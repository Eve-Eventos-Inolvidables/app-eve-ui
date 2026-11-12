import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .trim()
    .url("VITE_API_URL debe ser una URL válida.")
    .default("http://localhost:8080"),
  VITE_AUTH_URL: z
    .string()
    .trim()
    .min(1, "VITE_AUTH_URL es obligatoria.")
    .default("/app-eve-ms-auth"),
  VITE_EVENT_URL: z
    .string()
    .trim()
    .min(1, "VITE_EVENT_URL es obligatoria.")
    .default("/app-eve-ms-events"),
  VITE_MANAGER_URL: z
    .string()
    .trim()
    .min(1, "VITE_MANAGER_URL es obligatoria.")
    .default("/app-eve-ms-users"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Configuración de entorno inválida: ${details}`);
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL,
  authUrl: parsed.data.VITE_AUTH_URL,
  eventUrl: parsed.data.VITE_EVENT_URL,
  managerUrl: parsed.data.VITE_MANAGER_URL,
} as const;
