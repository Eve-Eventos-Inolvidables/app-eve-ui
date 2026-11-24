export function getLandingPath(roleName?: string | null): string {
  const normalizedRole = roleName?.trim().replace(/^ROLE_/i, "").toLowerCase();
  if (normalizedRole === "cliente") return "/events";
  if (normalizedRole === "manager") return "/manager";
  return "/dash";
}
