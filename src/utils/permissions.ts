import { useAuthStore } from "../stores/auth.store";

const ADMIN_ROLES = new Set(["admin", "administrador"]);
const MANAGER_ROLES = new Set(["manager"]);

export function isAdminRole(roleName?: string | null): boolean {
  return ADMIN_ROLES.has((roleName ?? "").trim().toLowerCase());
}

export function isManagerRole(roleName?: string | null): boolean {
  return MANAGER_ROLES.has((roleName ?? "").trim().toLowerCase());
}

export function useIsAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  return isAdminRole(user?.roleName);
}

export function useIsManager(): boolean {
  const user = useAuthStore((state) => state.user);
  return isManagerRole(user?.roleName);
}
