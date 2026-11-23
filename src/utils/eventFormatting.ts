export function formatEventDate(value: string, options: Intl.DateTimeFormatOptions = {
  dateStyle: "long",
}): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PY", options).format(
    new Date(year, month - 1, day, 12),
  );
}

export function formatPrice(value: number): string {
  return `Gs. ${new Intl.NumberFormat("es-PY", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getHttpUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function getSafeEventColor(
  value: string | undefined,
  fallback: string,
): string {
  if (!value || typeof CSS === "undefined" || !CSS.supports("color", value)) {
    return fallback;
  }

  return value;
}
