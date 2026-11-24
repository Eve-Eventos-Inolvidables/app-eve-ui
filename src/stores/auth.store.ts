import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "../types/auth.types";

interface AuthState {
  user: UserDto | null;
  token: string | null;

  setAuth: (user: UserDto, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
