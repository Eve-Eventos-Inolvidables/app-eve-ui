import { z } from "zod";

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function createEventCategorySchema(existingNames: readonly string[] = []) {
  const normalizedExistingNames = new Set(existingNames.map(normalizeName));

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "El nombre de la categoría es obligatorio.")
        .max(100, "El nombre no puede superar los 100 caracteres."),
    })
    .superRefine(({ name }, context) => {
      if (normalizedExistingNames.has(normalizeName(name))) {
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: "Ya existe una categoría con este nombre.",
        });
      }
    });
}
