import { useAuthStore } from "../stores/auth.store";

const ADMIN_ROLES = new Set(["admin", "administrador"]);

export function isAdminRole(roleName?: string | null): boolean {
  return ADMIN_ROLES.has((roleName ?? "").trim().toLowerCase());
}

export function useIsAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  return isAdminRole(user?.roleName);
}
