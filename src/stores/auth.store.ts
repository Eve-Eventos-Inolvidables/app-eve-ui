import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "../api/auth.api";

interface AuthState {
  user: UserDto | null;
  isAdmin: boolean;

  setAuth: (user: UserDto) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,

      setAuth: (user) => set({ user, isAdmin: user.roleName.toLowerCase() === "admin" }),
      clearAuth: () => set({ user: null, isAdmin: false }),
    }),
    { name: "auth-storage" },
  ),
);
