import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

type SecureStoreLike = {
  getItemAsync?: (key: string) => Promise<string | null>;
  setItemAsync?: (key: string, value: string) => Promise<void>;
  deleteItemAsync?: (key: string) => Promise<void>;
  isAvailableAsync?: () => Promise<boolean>;
};

const secureStore = SecureStore as SecureStoreLike;

const hasSecureStoreMethods = () =>
  typeof secureStore.getItemAsync === 'function' &&
  typeof secureStore.setItemAsync === 'function' &&
  typeof secureStore.deleteItemAsync === 'function';

const canUseSecureStore = async () => {
  if (!hasSecureStoreMethods()) return false;
  if (typeof secureStore.isAvailableAsync !== 'function') return true;

  try {
    return await secureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const secureStorage = {
  async getItem(key: string) {
    if (await canUseSecureStore()) {
      try {
        return await secureStore.getItemAsync!(key);
      } catch {
        // Fall through to AsyncStorage if SecureStore throws on unsupported environments.
      }
    }

    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string) {
    if (await canUseSecureStore()) {
      try {
        await secureStore.setItemAsync!(key, value);
        return;
      } catch {
        // Fall through to AsyncStorage if SecureStore throws on unsupported environments.
      }
    }

    await AsyncStorage.setItem(key, value);
  },

  async deleteItem(key: string) {
    if (await canUseSecureStore()) {
      try {
        await secureStore.deleteItemAsync!(key);
        return;
      } catch {
        // Fall through to AsyncStorage if SecureStore throws on unsupported environments.
      }
    }

    await AsyncStorage.removeItem(key);
  }
};
