import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Platform } from 'react-native';
import { secureStorage } from '@/security/secureStorage';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  requires2fa: boolean;
  userId?: string;
};

type RegisterResponse = {
  userId: string;
  next: '2fa';
};

type OtpResponse = {
  status: 'sent';
  channel: 'gateway' | 'dev';
  expiresIn: number;
  debugCode?: string;
};

type Method = 'sms' | 'email';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
};

type OtpSession = {
  method: Method;
  provider: 'local' | 'gateway';
  code?: string;
  phone: string;
  expiresAt: number;
};

const KEY_ACCESS = 'wizenance_access_token';
const KEY_REFRESH = 'wizenance_refresh_token';
const KEY_USERS = 'wizenance_users';
const KEY_OTP = 'wizenance_otp_sessions';
const OTP_TTL_MS = 5 * 60 * 1000;

const SMS_GATEWAY_URL = process.env.EXPO_PUBLIC_SMS_GATEWAY_URL;
const SHOULD_INCLUDE_DEMO_USER = Platform.OS === 'web';

const seedUsers: AuthUser[] = [
  {
    id: 'user_demo',
    name: 'Demo User',
    email: 'demo@wizenance.app',
    password: 'Wizenance123!',
    phone: '+15551234567'
  }
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (password: string) =>
  password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

const normalizePhone = (phone: string) => {
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/[^\d+]/g, '');

  let candidate = digitsOnly;

  if (digitsOnly.startsWith('00')) {
    candidate = `+${digitsOnly.slice(2)}`;
  } else if (digitsOnly.startsWith('09') && digitsOnly.length === 11) {
    // PH local style: 09XXXXXXXXX -> +639XXXXXXXXX
    candidate = `+63${digitsOnly.slice(1)}`;
  } else if (digitsOnly.startsWith('9') && digitsOnly.length === 10) {
    // PH shorthand without leading 0
    candidate = `+63${digitsOnly}`;
  } else if (digitsOnly.startsWith('639') && digitsOnly.length === 12) {
    // PH with country code but missing +
    candidate = `+${digitsOnly}`;
  } else if (!digitsOnly.startsWith('+')) {
    // Require explicit country code for non-PH local formats.
    candidate = `+${digitsOnly}`;
  }

  let parsed = parsePhoneNumberFromString(candidate);

  if (!parsed?.isValid()) {
    // Additional PH fallback parse for local entries like 0917....
    parsed = parsePhoneNumberFromString(trimmed, 'PH');
  }

  if (!parsed || !parsed.isValid()) {
    throw new Error(
      'Use a valid international number from any country, e.g. +639171234567, +60123456789, +628123456789.'
    );
  }

  return parsed.number;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getUsers(): Promise<AuthUser[]> {
  const users = await readJson<AuthUser[]>(KEY_USERS, []);
  const withoutDemo = users.filter((user) => user.id !== 'user_demo' && user.email !== 'demo@wizenance.app');

  if (!SHOULD_INCLUDE_DEMO_USER) {
    if (withoutDemo.length !== users.length) {
      await writeJson(KEY_USERS, withoutDemo);
    }
    return withoutDemo;
  }

  const hasDemo = users.some((user) => user.id === 'user_demo' || user.email === 'demo@wizenance.app');
  if (hasDemo) return users;

  const seededUsers = [...seedUsers, ...users];
  await writeJson(KEY_USERS, seededUsers);
  return seededUsers;
}

async function saveUsers(users: AuthUser[]): Promise<void> {
  await writeJson(KEY_USERS, users);
}

async function getOtpSessions(): Promise<Record<string, OtpSession>> {
  return readJson<Record<string, OtpSession>>(KEY_OTP, {});
}

async function saveOtpSessions(sessions: Record<string, OtpSession>): Promise<void> {
  await writeJson(KEY_OTP, sessions);
}

async function emailDomainHasMx(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const knownDomains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'proton.me',
    'protonmail.com'
  ];
  if (knownDomains.includes(domain)) {
    return true;
  }

  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (!res.ok) return false;
    const body = (await res.json()) as { Status?: number; Answer?: unknown[] };
    return body.Status === 0 && Array.isArray(body.Answer) && body.Answer.length > 0;
  } catch {
    return false;
  }
}

const getGatewayVerifyUrl = () => {
  if (!SMS_GATEWAY_URL) {
    throw new Error('SMS gateway URL is missing.');
  }

  const requestUrl = String(SMS_GATEWAY_URL);
  const verifyUrl = requestUrl.replace(/\/auth\/request-otp\/?$/, '/auth/verify-otp');
  return verifyUrl === requestUrl ? `${requestUrl.replace(/\/$/, '')}/auth/verify-otp` : verifyUrl;
};

async function sendOtpViaGateway(email: string, userId: string): Promise<number> {
  if (!SMS_GATEWAY_URL) {
    throw new Error('Gateway URL is missing.');
  }

  const res = await fetch(String(SMS_GATEWAY_URL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, userId })
  });

  if (!res.ok) {
    throw new Error('Gateway failed to send OTP.');
  }

  const body = (await res.json()) as { expiresIn?: number };
  return typeof body.expiresIn === 'number' ? body.expiresIn : Math.floor(OTP_TTL_MS / 1000);
}

async function verifyOtpViaGateway(userId: string, code: string): Promise<void> {
  const res = await fetch(getGatewayVerifyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  });

  if (!res.ok) {
    let message = 'SMS gateway OTP verification failed.';
    try {
      const body = (await res.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // Keep the generic message when the gateway does not return JSON.
    }
    throw new Error(message);
  }
}

export const authService = {
  async register(name: string, email: string, password: string, phone: string): Promise<RegisterResponse> {
    const parsedName = name.trim();
    const parsedEmail = normalizeEmail(email);
    let parsedPhone = '';

    if (parsedName.length < 2) {
      throw new Error('Name must be at least 2 characters.');
    }
    if (!isValidEmail(parsedEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!(await emailDomainHasMx(parsedEmail))) {
      throw new Error('Email domain could not be verified. Use a valid reachable email.');
    }
    if (!isStrongPassword(password)) {
      throw new Error('Password must be 8+ chars and include letters and numbers.');
    }

    parsedPhone = normalizePhone(phone);

    const users = await getUsers();

    if (users.some((u) => u.email === parsedEmail)) {
      throw new Error('Email already exists. Please log in instead.');
    }

    const newUser: AuthUser = {
      id: `user_${Date.now()}`,
      name: parsedName,
      email: parsedEmail,
      password,
      phone: parsedPhone
    };

    await saveUsers([newUser, ...users]);

    return { userId: newUser.id, next: '2fa' };
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const parsedEmail = normalizeEmail(email);

    if (!isValidEmail(parsedEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!isStrongPassword(password)) {
      throw new Error('Wrong password format.');
    }

    const users = await getUsers();
    const user = users.find((u) => u.email === parsedEmail && u.password === password);

    if (!user) {
      throw new Error('Invalid credentials. Check email/password or sign up first.');
    }

    return {
      accessToken: 'mock_access',
      refreshToken: 'mock_refresh',
      requires2fa: true,
      userId: user.id
    };
  },

  async requestOtp(userId: string, method: Method = 'sms'): Promise<OtpResponse> {
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      throw new Error('User not found. Please log in again.');
    }

    const sessions = await getOtpSessions();
    if (method === 'email' && SMS_GATEWAY_URL) {
      const expiresIn = await sendOtpViaGateway(user.email, userId);
      sessions[userId] = {
        method,
        provider: 'gateway',
        phone: user.email,
        expiresAt: Date.now() + expiresIn * 1000
      };
      await saveOtpSessions(sessions);

      return {
        status: 'sent',
        channel: 'gateway',
        expiresIn
      };
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    sessions[userId] = {
      method,
      provider: 'local',
      code,
      phone: user.email,
      expiresAt: Date.now() + OTP_TTL_MS
    };
    await saveOtpSessions(sessions);

    return {
      status: 'sent',
      channel: 'dev',
      expiresIn: Math.floor(OTP_TTL_MS / 1000),
      debugCode: code
    };
  },

  async verifyOtp(userId: string, code: string): Promise<void> {
    if (code.length !== 6) throw new Error('Invalid OTP');

    const sessions = await getOtpSessions();
    const session = sessions[userId];

    if (!session) {
      throw new Error('No OTP request found. Please resend OTP.');
    }

    if (Date.now() > session.expiresAt) {
      delete sessions[userId];
      await saveOtpSessions(sessions);
      throw new Error('OTP expired. Request a new code.');
    }

    if (session.provider === 'gateway') {
      await verifyOtpViaGateway(userId, code);
    } else if (session.code !== code) {
      throw new Error('Incorrect OTP.');
    }

    delete sessions[userId];
    await saveOtpSessions(sessions);
    await secureStorage.setItem(KEY_ACCESS, 'verified_access');
    await secureStorage.setItem(KEY_REFRESH, 'verified_refresh');
  },

  async saveSession(accessToken: string, refreshToken: string) {
    await secureStorage.setItem(KEY_ACCESS, accessToken);
    await secureStorage.setItem(KEY_REFRESH, refreshToken);
  },

  async clearSession() {
    await secureStorage.deleteItem(KEY_ACCESS);
    await secureStorage.deleteItem(KEY_REFRESH);
  }
};
