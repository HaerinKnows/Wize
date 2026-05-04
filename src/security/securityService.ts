import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '@/security/secureStorage';

type MpinLength = 4 | 6;

type MpinProfile = {
  salt: string;
  digest: string;
  length: MpinLength;
};

type MpinProfiles = Record<string, MpinProfile>;
type BiometricProfiles = Record<string, boolean>;

const MPIN_PROFILES_KEY = 'wizenance_mpin_profiles';
const BIOMETRIC_PROFILES_KEY = 'wizenance_biometric_profiles';

const simpleHash = (value: string, salt: string) => {
  let hash = 0;
  const input = `${value}:${salt}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `${hash}`;
};

const readProfiles = async (): Promise<MpinProfiles> => {
  const raw = await secureStorage.getItem(MPIN_PROFILES_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as MpinProfiles;
  } catch {
    return {};
  }
};

const saveProfiles = async (profiles: MpinProfiles) => {
  await secureStorage.setItem(MPIN_PROFILES_KEY, JSON.stringify(profiles));
};

const readBiometricProfiles = async (): Promise<BiometricProfiles> => {
  const raw = await secureStorage.getItem(BIOMETRIC_PROFILES_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as BiometricProfiles;
  } catch {
    return {};
  }
};

const saveBiometricProfiles = async (profiles: BiometricProfiles) => {
  await secureStorage.setItem(BIOMETRIC_PROFILES_KEY, JSON.stringify(profiles));
};

export const securityService = {
  async setMpin(userId: string, pin: string) {
    if (!userId) {
      throw new Error('Missing user context for MPIN.');
    }

    const length: MpinLength = pin.length === 6 ? 6 : 4;
    const salt = `${Date.now()}`;
    const digest = simpleHash(pin, salt);
    const profiles = await readProfiles();

    profiles[userId] = {
      salt,
      digest,
      length
    };

    await saveProfiles(profiles);
  },

  async verifyMpin(userId: string, pin: string) {
    if (!userId) return false;

    const profiles = await readProfiles();
    const profile = profiles[userId];

    if (!profile) return false;
    if (pin.length !== profile.length) return false;

    return simpleHash(pin, profile.salt) === profile.digest;
  },

  async getMpinLength(userId: string): Promise<MpinLength | null> {
    if (!userId) return null;

    const profiles = await readProfiles();
    const profile = profiles[userId];

    return profile?.length ?? null;
  },

  async setBiometricEnabled(userId: string, enabled: boolean) {
    if (!userId) return;

    const profiles = await readBiometricProfiles();
    profiles[userId] = enabled;
    await saveBiometricProfiles(profiles);
  },

  async isBiometricEnabled(userId: string) {
    if (!userId) return false;

    const profiles = await readBiometricProfiles();
    return profiles[userId] ?? false;
  },

  async authenticateBiometric() {
    const available = await LocalAuthentication.hasHardwareAsync();
    if (!available) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Wizenance'
    });
    return result.success;
  }
};
