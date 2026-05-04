import http from 'node:http';
import { randomInt, timingSafeEqual } from 'node:crypto';
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

const otpSessions = new Map();
const rateLimits = new Map();

const json = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    return json(res, 200, { ok: true, service: 'wizenance-email-gateway' });
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
