import { useAuthStore } from "../stores/auth.store";

const ADMIN_ROLES = new Set(["admin", "administrador"]);
const MANAGER_ROLES = new Set(["manager"]);
const CLIENT_ROLES = new Set(["cliente"]);

function normalizeRole(roleName?: string | null): string {
  return (roleName ?? "")
    .trim()
    .replace(/^ROLE_/i, "")
    .toLowerCase();
}

export function isAdminRole(roleName?: string | null): boolean {
  return ADMIN_ROLES.has(normalizeRole(roleName));
}

export function isManagerRole(roleName?: string | null): boolean {
  return MANAGER_ROLES.has(normalizeRole(roleName));
}

export function isClientRole(roleName?: string | null): boolean {
  return CLIENT_ROLES.has(normalizeRole(roleName));
}

export function useIsAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  return isAdminRole(user?.roleName);
}

export function useIsManager(): boolean {
  const user = useAuthStore((state) => state.user);
  return isManagerRole(user?.roleName);
}
