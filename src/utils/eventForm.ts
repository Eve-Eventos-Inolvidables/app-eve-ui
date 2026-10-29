import type {
  CreateEventRequest,
  EventDraft,
  PrecioDraft,
} from "../types/event.types";

export function createInitialForm(): EventDraft {
  return {
    categoryId: "",
    name: "",
    visibleStart: "",
    description: "",
    date: "",
    kickOffTime: "",
    ticketsPerPersonLimit: "",
    primaryColor: "#111111",
    secondaryColor: "#C8102E",
    mapsLink: "",
    sectores: [{ eventId: 0, name: "", capacity: "" }],
    tandas: [{ eventId: 0, name: "", startDate: "", endDate: "" }],
    precios: [],
  };
}

function normalizeTime(value: string): string {
  if (!value) {
    return "";
  }

  return value.length === 5 ? `${value}:00` : value;
}

export function buildPayload(form: EventDraft): CreateEventRequest {
  return {
    categoryId: Number(form.categoryId),
    name: form.name.trim(),
    visibleStart: form.visibleStart,
    description: form.description.trim(),
    date: form.date,
    kickOffTime: normalizeTime(form.kickOffTime),
    ticketsPerPersonLimit: Number(form.ticketsPerPersonLimit),
    primaryColor: form.primaryColor,
    secondaryColor: form.secondaryColor,
    mapsLink: form.mapsLink.trim(),
    sectores: form.sectores.map((sector) => ({
      eventId: 0,
      name: sector.name.trim(),
      capacity: Number(sector.capacity),
    })),
    tandas: form.tandas.map((tanda) => ({
      eventId: 0,
      name: tanda.name.trim(),
      startDate: tanda.startDate,
      endDate: tanda.endDate,
    })),
    precios: form.precios.map((precio) => ({
      sectorId: Number(precio.sectorId),
      batchId: Number(precio.batchId),
      price: Number(precio.price),
      quantity: Number(precio.quantity),
    })),
  };
}

export function remapPriceIndexes(
  prices: PrecioDraft[],
  field: "sectorId" | "batchId",
  removedIndex: number,
): PrecioDraft[] {
  return prices
    .filter(
      (price) => price[field] === "" || Number(price[field]) !== removedIndex,
    )
    .map((price) => {
      if (price[field] === "" || Number(price[field]) <= removedIndex) {
        return price;
      }

      return { ...price, [field]: String(Number(price[field]) - 1) };
    });
}
