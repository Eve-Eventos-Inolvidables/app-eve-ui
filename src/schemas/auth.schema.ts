import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "El correo es obligatorio")
  .max(150, "El correo no puede superar los 150 caracteres")
  .email("Ingresa un correo válido");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(125, "El nombre no puede superar los 125 caracteres"),
  email: emailSchema,
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(255, "La contraseña no puede superar los 255 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
