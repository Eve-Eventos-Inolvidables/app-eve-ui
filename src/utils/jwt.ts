import type { UserDto } from "../types/auth.types";

type JwtPayload = Record<string, unknown>;

function normalizeBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  return padding === 0 ? normalized : normalized.padEnd(normalized.length + 4 - padding, "=");
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const binary = atob(normalizeBase64(payload));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}

function extractRole(payload: JwtPayload): string {
  const candidates = [
    payload.roleName,
    payload.role,
    payload.roles,
    payload.authorities,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate.replace(/^ROLE_/i, "");
    }

    if (Array.isArray(candidate)) {
      const role = candidate.find((item) => typeof item === "string");
      if (typeof role === "string") {
        return role.replace(/^ROLE_/i, "");
      }

      const authority = candidate.find(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "authority" in item &&
          typeof item.authority === "string",
      );
      if (authority && "authority" in authority) {
        return (authority.authority as string).replace(/^ROLE_/i, "");
      }
    }
  }

  return "";
}

function extractId(payload: JwtPayload): number {
  const rawId = payload.userId ?? payload.id ?? payload.sub;
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function userFromToken(token: string, fallbackEmail: string): UserDto {
  const payload = decodeJwtPayload(token);
  const email = firstString(payload?.email, fallbackEmail);
  const name = firstString(
    payload?.name,
    payload?.fullName,
    email.split("@")[0],
    "Usuario",
  );

  return {
    id: payload ? extractId(payload) : 0,
    name,
    email,
    roleName: payload ? extractRole(payload) : "",
  };
}
