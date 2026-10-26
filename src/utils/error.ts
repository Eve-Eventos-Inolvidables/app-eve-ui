import axios from "axios";
import type { ApiResponse } from "../types/auth.types";

export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiResponse<unknown>> | undefined;

    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }

    if (error.response?.status === 401) {
      return "Credenciales inválidas";
    }

    if (!error.response) {
      return "No se pudo conectar con el servidor";
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}
