export function getLandingPath(roleName?: string | null): string {
  const normalizedRole = roleName?.trim().replace(/^ROLE_/i, "").toLowerCase();
  return normalizedRole === "cliente" ? "/events" : "/dash";
}
