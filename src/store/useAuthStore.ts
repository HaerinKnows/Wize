import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware.js';

type AuthState = {
  isAuthenticated: boolean;
  userId?: string;
  pendingUserId?: string;
  twoFactorVerified: boolean;
  mpinSet: boolean;
  biometricEnabled: boolean;
  biometricByUser: Record<string, boolean>;
  startAuth: (userId: string) => void;
  verify2fa: () => void;
  completeAuth: () => void;
  setMpin: () => void;
  setBiometric: (enabled: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      twoFactorVerified: false,
      mpinSet: false,
      biometricEnabled: false,
      biometricByUser: {},
      startAuth: (userId) =>
        set((state) => ({
          pendingUserId: userId,
          twoFactorVerified: false,
          isAuthenticated: false,
          biometricEnabled: state.biometricByUser[userId] ?? false
        })),
      verify2fa: () => {
        const pendingUserId = get().pendingUserId;
        const biometricEnabled = pendingUserId ? (get().biometricByUser[pendingUserId] ?? false) : false;
        set({
          userId: pendingUserId,
          pendingUserId: undefined,
          twoFactorVerified: true,
          biometricEnabled
        });
      },
      completeAuth: () => set({ isAuthenticated: true }),
      setMpin: () => set({ mpinSet: true }),
      setBiometric: (enabled) =>
        set((state) => {
          const targetUserId = state.userId ?? state.pendingUserId;
          if (!targetUserId) {
            return { biometricEnabled: enabled };
          }

          return {
            biometricEnabled: enabled,
            biometricByUser: { ...state.biometricByUser, [targetUserId]: enabled }
          };
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          twoFactorVerified: false,
          userId: undefined,
          pendingUserId: undefined,
          biometricEnabled: false
        })
    }),
    {
      name: 'wizenance-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        mpinSet: state.mpinSet,
        biometricEnabled: state.biometricEnabled,
        biometricByUser: state.biometricByUser
      })
    }
  )
);
