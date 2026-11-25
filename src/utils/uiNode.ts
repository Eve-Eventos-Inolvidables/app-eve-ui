export const UI_NODE_COOKIE = "eve-ui";

const UI_NODE_BY_PORT: Record<string, string> = {
  "8090": "UI-0",
  "8091": "UI-1",
};

const FALLBACK_UI_NODE = "local";

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));

  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function saveUiNodeCookie(): void {
  const node = UI_NODE_BY_PORT[window.location.port] ?? FALLBACK_UI_NODE;
  const maxAge = 60 * 60 * 24 * 365;

  document.cookie = `${UI_NODE_COOKIE}=${encodeURIComponent(node)}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

export function getUiNode(): string {
  return readCookie(UI_NODE_COOKIE) ?? FALLBACK_UI_NODE;
}
