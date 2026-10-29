import axios from "axios";
import type { ApiErrorResponse } from "../types/responses";

function extractMessage(data?: ApiErrorResponse): string | null {
  const detail = data?.error ?? data?.data;

  if (detail?.message?.trim()) {
    return detail.message;
  }

  if (data?.message?.trim()) {
    return data.message;
  }

  return null;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Error desconocido",
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return "No se pudo conectar con el servidor";
    }

    return extractMessage(error.response.data) ?? fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
