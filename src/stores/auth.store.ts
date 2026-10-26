import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "../types/auth.types";

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAdmin: boolean;

  setAuth: (user: UserDto, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdmin: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAdmin: (user.roleName ?? "").toLowerCase() === "admin",
        }),
      clearAuth: () => set({ user: null, token: null, isAdmin: false }),
    }),
    { name: "auth-storage" },
  ),
);
