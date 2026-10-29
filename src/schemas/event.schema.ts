import { z } from "zod";
import type { EventDraft, FormErrors } from "../types/event.types";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const positiveIntegerString = (message: string) =>
  z.string().refine((value) => {
    const parsed = Number(value);
    return value !== "" && Number.isInteger(parsed) && parsed > 0;
  }, message);

const sectorSchema = z.object({
  eventId: z.literal(0),
  name: z.string().trim().min(1, "El nombre del sector es obligatorio."),
  capacity: positiveIntegerString(
    "La capacidad debe ser un número entero mayor a 0.",
  ),
});

const tandaSchema = z.object({
  eventId: z.literal(0),
  name: z.string().trim().min(1, "El nombre de la tanda es obligatorio."),
  startDate: z
    .string()
    .min(1, "La fecha de inicio de la tanda es obligatoria."),
  endDate: z.string().min(1, "La fecha de fin de la tanda es obligatoria."),
});

const precioSchema = z.object({
  sectorId: z.string().refine(
    (value) =>
      value !== "" &&
      Number.isInteger(Number(value)) &&
      Number(value) >= 0,
    "Selecciona un sector.",
  ),
  batchId: z.string().refine(
    (value) =>
      value !== "" &&
      Number.isInteger(Number(value)) &&
      Number(value) >= 0,
    "Selecciona una tanda.",
  ),
  price: z.string().refine((value) => {
    const parsed = Number(value);
    return value !== "" && Number.isFinite(parsed) && parsed > 0;
  }, "El precio debe ser un número mayor a 0."),
  quantity: z.string().refine((value) => {
    const parsed = Number(value);
    return value !== "" && Number.isInteger(parsed) && parsed > 0;
  }, "La cantidad debe ser un número entero mayor a 0."),
});

export const eventStep1Schema = z.object({
  categoryId: positiveIntegerString("Ingresa un ID de categoría válido."),
  name: z.string().trim().min(1, "El nombre del evento es obligatorio."),
  visibleStart: z
    .string()
    .min(1, "La fecha de inicio de visibilidad es obligatoria."),
  description: z.string(),
  date: z.string().min(1, "La fecha del evento es obligatoria."),
  kickOffTime: z.string().min(1, "La hora de inicio es obligatoria."),
  ticketsPerPersonLimit: positiveIntegerString(
    "El límite de tickets por persona debe ser mayor a 0.",
  ),
  primaryColor: z.string().min(1, "Selecciona el color primario."),
  secondaryColor: z.string().min(1, "Selecciona el color secundario."),
  mapsLink: z
    .string()
    .refine(
      (value) => !value.trim() || isValidUrl(value.trim()),
      "Ingresa un enlace de mapas válido.",
    ),
});

export const eventStep2Schema = z
  .object({
    date: z.string().optional(),
    sectores: z.array(sectorSchema).min(1, "Agrega al menos un sector."),
    tandas: z.array(tandaSchema).min(1, "Agrega al menos una tanda."),
  })
  .superRefine((data, ctx) => {
    if (!data.date) {
      ctx.addIssue({
        code: "custom",
        path: ["tandas", "general"],
        message: "Define la fecha del evento en el Paso 1.",
      });
      return;
    }

    data.tandas.forEach((tanda, index) => {
      if (
        tanda.startDate &&
        tanda.endDate &&
        tanda.startDate > tanda.endDate
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tandas", index, "endDate"],
          message:
            "La fecha de fin no puede ser anterior a la fecha de inicio.",
        });
      }

      if (tanda.startDate && tanda.startDate > data.date!) {
        ctx.addIssue({
          code: "custom",
          path: ["tandas", index, "startDate"],
          message:
            "La fecha de inicio no puede ser posterior a la fecha del evento.",
        });
      }

      if (tanda.endDate && tanda.endDate > data.date!) {
        ctx.addIssue({
          code: "custom",
          path: ["tandas", index, "endDate"],
          message:
            "La fecha de fin no puede ser posterior a la fecha del evento.",
        });
      }
    });
  });

export const eventStep3Schema = z
  .object({
    sectores: z.array(sectorSchema),
    tandas: z.array(tandaSchema),
    precios: z.array(precioSchema).min(1, "Agrega al menos un precio."),
  })
  .superRefine((data, ctx) => {
    const combinations = new Set<string>();
    const quantitiesBySector = new Map<number, number>();

    data.precios.forEach((precio, index) => {
      const sectorId = Number(precio.sectorId);
      const batchId = Number(precio.batchId);
      const quantity = Number(precio.quantity);

      if (!data.sectores[sectorId]) {
        ctx.addIssue({
          code: "custom",
          path: ["precios", index, "sectorId"],
          message: "Selecciona un sector.",
        });
      }

      if (!data.tandas[batchId]) {
        ctx.addIssue({
          code: "custom",
          path: ["precios", index, "batchId"],
          message: "Selecciona una tanda.",
        });
      }

      if (data.sectores[sectorId] && data.tandas[batchId]) {
        const combination = `${sectorId}-${batchId}`;

        if (combinations.has(combination)) {
          ctx.addIssue({
            code: "custom",
            path: ["precios", index, "batchId"],
            message: "Ya existe un precio para este sector y esta tanda.",
          });
        }

        combinations.add(combination);

        if (Number.isInteger(quantity) && quantity > 0) {
          quantitiesBySector.set(
            sectorId,
            (quantitiesBySector.get(sectorId) ?? 0) + quantity,
          );
        }
      }
    });

    quantitiesBySector.forEach((quantity, sectorIndex) => {
      const sector = data.sectores[sectorIndex];
      const capacity = Number(sector?.capacity ?? 0);

      if (quantity > capacity) {
        ctx.addIssue({
          code: "custom",
          path: ["precios", "sector", sectorIndex],
          message: `La cantidad total de "${sector?.name || `Sector ${sectorIndex + 1}`}" (${quantity}) supera su capacidad (${capacity}).`,
        });
      }
    });
  });

export function toFormErrors(error: z.ZodError): FormErrors {
  const errors: FormErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");

    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}

export function validateStep1(form: EventDraft): FormErrors {
  const result = eventStep1Schema.safeParse(form);
  return result.success ? {} : toFormErrors(result.error);
}

export function validateStep2(form: EventDraft): FormErrors {
  const result = eventStep2Schema.safeParse(form);
  return result.success ? {} : toFormErrors(result.error);
}

export function validateStep3(form: EventDraft): FormErrors {
  const result = eventStep3Schema.safeParse(form);
  return result.success ? {} : toFormErrors(result.error);
}
