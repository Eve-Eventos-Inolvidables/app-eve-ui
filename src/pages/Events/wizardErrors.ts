import type { FormErrors } from "../../types/event.types";

interface ArrayErrorLike {
  message?: unknown;
  root?: { message?: unknown };
}

export function getArrayError(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const { message, root } = error as ArrayErrorLike;
  const candidate =
    typeof message === "string" && message.length > 0
      ? message
      : root?.message;

  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : undefined;
}

export function collectGlobalErrors(
  errors: FormErrors,
  prefix: string,
): string[] {
  return Object.entries(errors)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, message]) => message);
}
