import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "../types/auth.types";

interface AuthState {
  user: UserDto | null;
  token: string | null;
  onboardingPending: boolean;

  setAuth: (user: UserDto, token: string) => void;
  clearAuth: () => void;
  setOnboardingPending: (pending: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      onboardingPending: false,

      setAuth: (user, token) => set({ user, token }),
      clearAuth: () =>
        set({ user: null, token: null, onboardingPending: false }),
      setOnboardingPending: (onboardingPending) => set({ onboardingPending }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        onboardingPending: state.onboardingPending,
      }),
    },
  ),
);
