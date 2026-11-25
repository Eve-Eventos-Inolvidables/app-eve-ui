const BALANCER_COOKIE = "BBNODE";

const NODE_LABELS: Record<string, string> = {
  t1: "Tom1",
  t2: "Tom2",
};

const FALLBACK_UI_NODE = "local";

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));

  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function getUiNode(): string {
  const route = readCookie(BALANCER_COOKIE)?.replace(/^\./, "");

  return (route && NODE_LABELS[route]) || FALLBACK_UI_NODE;
}
