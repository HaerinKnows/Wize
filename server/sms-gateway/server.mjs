import http from 'node:http';
import { createSign, randomInt, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URLSearchParams } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadLocalEnv = () => {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
};

loadLocalEnv();

const port = Number(process.env.PORT || 4000);
const resendApiKey = process.env.RESEND_API_KEY;
const allowedOrigin = process.env.OTP_ALLOWED_ORIGIN || '*';
const otpTtlMs = Number(process.env.OTP_TTL_MS || 5 * 60 * 1000);
const requestWindowMs = Number(process.env.OTP_REQUEST_WINDOW_MS || 15 * 60 * 1000);
const requestLimitMax = Number(process.env.OTP_REQUEST_LIMIT_MAX || 5);
const verifyWindowMs = Number(process.env.OTP_VERIFY_WINDOW_MS || 15 * 60 * 1000);
const verifyLimitMax = Number(process.env.OTP_VERIFY_LIMIT_MAX || 10);
const syncDataDir = process.env.SYNC_DATA_DIR || path.join(__dirname, 'data', 'sync');
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const firestoreSyncCollection = process.env.FIRESTORE_SYNC_COLLECTION || 'userSyncSnapshots';

const otpSessions = new Map();
const rateLimits = new Map();
let firestoreAccessToken;

const json = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  });
  res.end(JSON.stringify(payload));
};

const normalizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
};

const rateLimit = (key, max, windowMs) => {
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= max) {
    return false;
  }

  current.count += 1;
  return true;
};

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const makeCode = () => String(randomInt(100000, 1000000));

const parseSyncUserId = (requestUrl) => {
  const url = new URL(requestUrl, 'http://localhost');
  const match = url.pathname.match(/^\/sync\/([^/]+)$/);
  if (!match) return '';

  const userId = decodeURIComponent(match[1]);
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(userId)) return '';

  return userId;
};

const snapshotPathForUser = (userId) => path.join(syncDataDir, `${userId}.json`);

const emptySnapshot = (userId) => ({
  userId,
  accounts: [],
  transactions: [],
  budgets: [],
  lastSyncAt: null
});

const normalizeSnapshotArray = (value) => (Array.isArray(value) ? value : []);

const normalizeSyncSnapshot = (userId, body) => ({
  userId,
  accounts: normalizeSnapshotArray(body.accounts),
  transactions: normalizeSnapshotArray(body.transactions),
  budgets: normalizeSnapshotArray(body.budgets),
  lastSyncAt: typeof body.lastSyncAt === 'string' ? body.lastSyncAt : new Date().toISOString()
});

const writeSyncSnapshotToFile = async (userId, snapshot) => {
  await fs.promises.mkdir(syncDataDir, { recursive: true });
  const targetPath = snapshotPathForUser(userId);
  const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(snapshot, null, 2));
  await fs.promises.rename(tempPath, targetPath);
};

const hasFirebaseConfig = () =>
  Boolean(firebaseServiceAccountJson || (firebaseProjectId && firebaseClientEmail && firebasePrivateKey));

const getFirebaseCredential = () => {
  if (firebaseServiceAccountJson) {
    const parsed = JSON.parse(firebaseServiceAccountJson);
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key
    };
  }

  return {
    projectId: firebaseProjectId,
    clientEmail: firebaseClientEmail,
    privateKey: firebasePrivateKey
  };
};

const base64Url = (value) => Buffer.from(value).toString('base64url');

const createFirebaseJwt = (credential) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const claimSet = {
    iss: credential.clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: nowSeconds + 3600,
    iat: nowSeconds
  };
  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claimSet))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();

  return `${unsignedJwt}.${signer.sign(credential.privateKey, 'base64url')}`;
};

const getFirestoreAccessToken = async () => {
  if (firestoreAccessToken && firestoreAccessToken.expiresAt > Date.now() + 60_000) {
    return firestoreAccessToken.token;
  }

  const credential = getFirebaseCredential();
  const assertion = createFirebaseJwt(credential);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Firebase auth failed: ${details}`);
  }

  const tokenResponse = await res.json();
  firestoreAccessToken = {
    token: tokenResponse.access_token,
    expiresAt: Date.now() + Number(tokenResponse.expires_in || 3600) * 1000
  };

  return firestoreAccessToken.token;
};

const firestoreDocumentUrl = (userId) => {
  const { projectId } = getFirebaseCredential();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/${encodeURIComponent(firestoreSyncCollection)}/${encodeURIComponent(userId)}`;
};

const firestoreRequest = async (userId, init) => {
  const token = await getFirestoreAccessToken();
  return fetch(firestoreDocumentUrl(userId), {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
};

const readSyncSnapshot = async (userId) => {
  if (hasFirebaseConfig()) {
    const res = await firestoreRequest(userId, { method: 'GET' });
    if (res.status === 404) return emptySnapshot(userId);
    if (!res.ok) {
      const details = await res.text();
      throw new Error(`Firestore read failed: ${details}`);
    }

    const doc = await res.json();
    const snapshotJson = doc.fields?.snapshotJson?.stringValue;
    if (!snapshotJson) return emptySnapshot(userId);

    return { ...emptySnapshot(userId), ...JSON.parse(snapshotJson), userId };
  }

  try {
    const raw = await fs.promises.readFile(snapshotPathForUser(userId), 'utf8');
    const snapshot = JSON.parse(raw);

    return {
      ...emptySnapshot(userId),
      ...snapshot,
      userId
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return emptySnapshot(userId);
    }
    throw error;
  }
};

const writeSyncSnapshot = async (userId, body) => {
  const snapshot = normalizeSyncSnapshot(userId, body);

  if (hasFirebaseConfig()) {
    const res = await firestoreRequest(userId, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          snapshotJson: { stringValue: JSON.stringify(snapshot) },
          updatedAt: { timestampValue: new Date().toISOString() }
        }
      })
    });

    if (!res.ok) {
      const details = await res.text();
      throw new Error(`Firestore write failed: ${details}`);
    }

    return snapshot;
  }

  await writeSyncSnapshotToFile(userId, snapshot);

  return snapshot;
};

const syncStorageProvider = () => (hasFirebaseConfig() ? 'firestore' : 'file');

const sendResendOtp = async (email, code) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Wizenance <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Wizenance Verification Code',
      html: `<h2>Welcome to Wizenance!</h2><p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in ${Math.floor(otpTtlMs / 60000)} minutes.</p>`
    })
  });

  if (!res.ok) {
    const details = await res.text();
    const error = new Error('Resend email failed.');
    error.details = details;
    throw error;
  }
};

const readBody = async (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'wizenance-email-gateway',
      syncStorage: syncStorageProvider()
    });
  }

  const syncUserId = parseSyncUserId(req.url || '');
  if (syncUserId) {
    try {
      if (req.method === 'GET') {
        return json(res, 200, await readSyncSnapshot(syncUserId));
      }

      if (req.method === 'PUT') {
        const raw = await readBody(req);
        const body = raw ? JSON.parse(raw) : {};

        if (body.userId && body.userId !== syncUserId) {
          return json(res, 400, { error: 'Snapshot userId does not match sync URL.' });
        }

        return json(res, 200, await writeSyncSnapshot(syncUserId, body));
      }

      return json(res, 405, { error: 'Method Not Allowed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync server error.';
      return json(res, 500, { error: message });
    }
  }

  if (req.method !== 'POST' || !['/auth/request-otp', '/auth/verify-otp'].includes(req.url)) {
    return json(res, 404, { error: 'Not Found' });
  }

  if (!resendApiKey) {
    return json(res, 500, { error: 'RESEND_API_KEY is not configured on server.' });
  }

  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const clientIp = getClientIp(req);

    if (req.url === '/auth/verify-otp') {
      const code = typeof body.code === 'string' ? body.code.trim() : '';

      if (!userId || !/^\d{6}$/.test(code)) {
        return json(res, 400, { error: 'userId and 6-digit code are required.' });
      }

      if (!rateLimit(`verify:${clientIp}:${userId}`, verifyLimitMax, verifyWindowMs)) {
        return json(res, 429, { error: 'Too many verification attempts. Try again later.' });
      }

      const session = otpSessions.get(userId);
      if (!session) {
        return json(res, 400, { error: 'No OTP request found. Request a new code.' });
      }

      if (Date.now() > session.expiresAt) {
        otpSessions.delete(userId);
        return json(res, 400, { error: 'OTP expired. Request a new code.' });
      }

      session.attempts += 1;
      if (!safeEqual(session.code, code)) {
        if (session.attempts >= 5) {
          otpSessions.delete(userId);
          return json(res, 400, { error: 'Too many wrong attempts. Request a new code.' });
        }
        return json(res, 400, { error: 'Incorrect OTP.' });
      }

      otpSessions.delete(userId);
      return json(res, 200, { status: 'verified' });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email || !userId) {
      return json(res, 400, { error: 'email and userId are required.' });
    }

    if (
      !rateLimit(`request:ip:${clientIp}`, requestLimitMax, requestWindowMs) ||
      !rateLimit(`request:email:${normalizeEmail(email)}`, requestLimitMax, requestWindowMs)
    ) {
      return json(res, 429, { error: 'Too many OTP requests. Try again later.' });
    }

    const code = makeCode();
    await sendResendOtp(email, code);
    otpSessions.set(userId, {
      code,
      email,
      attempts: 0,
      expiresAt: Date.now() + otpTtlMs
    });

    return json(res, 200, {
      status: 'sent',
      provider: 'resend',
      expiresIn: Math.floor(otpTtlMs / 1000)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    const details = error instanceof Error && typeof error.details === 'string' ? error.details : undefined;
    return json(res, 500, { error: message, details });
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[email-gateway] listening on http://localhost:${port}`);
});
