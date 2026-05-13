import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware.js';

type AuthState = {
  isAuthenticated: boolean;
  isSignup: boolean;
  userId?: string;
  pendingUserId?: string;
  userEmail?: string;
  userName?: string;
  twoFactorVerified: boolean;
  mpinSet: boolean;
  isPremium: boolean;
  trialEndsAt?: string;
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired';
  biometricEnabled: boolean;
  biometricByUser: Record<string, boolean>;
  setPremium: (enabled: boolean) => void;
  startTrial: () => void;
  startAuth: (userId: string, isSignup: boolean, userData?: { email?: string; name?: string }) => void;
  verify2fa: () => void;
  completeAuth: () => void;
  setMpin: () => void;
  setBiometric: (enabled: boolean) => void;
  logout: () => void;
  checkSubscription: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isSignup: false,
      twoFactorVerified: false,
      mpinSet: false,
      isPremium: false,
      subscriptionStatus: 'none',
      biometricEnabled: false,
      biometricByUser: {},
      setPremium: (enabled) => set({ isPremium: enabled, subscriptionStatus: enabled ? 'active' : 'none' }),
      startTrial: () => {
        const ends = new Date();
        ends.setDate(ends.getDate() + 30);
        set({
          isPremium: true,
          subscriptionStatus: 'trial',
          trialEndsAt: ends.toISOString()
        });
      },
      startAuth: (userId, isSignup, userData) =>
        set((state) => ({
          pendingUserId: userId,
          isSignup,
          twoFactorVerified: false,
          isAuthenticated: false,
          biometricEnabled: state.biometricByUser[userId] ?? false,
          userEmail: userData?.email,
          userName: userData?.name
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
      checkSubscription: () => {
        const { trialEndsAt, subscriptionStatus, isPremium } = get();
        if (subscriptionStatus === 'trial' && trialEndsAt) {
          const hasEnded = new Date(trialEndsAt) < new Date();
          if (hasEnded) {
            set({ isPremium: false, subscriptionStatus: 'expired' });
          }
        }
      },
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
        biometricByUser: state.biometricByUser,
        isPremium: state.isPremium,
        subscriptionStatus: state.subscriptionStatus,
        trialEndsAt: state.trialEndsAt,
        userEmail: state.userEmail,
        userName: state.userName
      })
    }
  )
);
