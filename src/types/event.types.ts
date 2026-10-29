export interface SectorDraft {
  eventId: 0;
  name: string;
  capacity: string;
}

export interface TandaDraft {
  eventId: 0;
  name: string;
  startDate: string;
  endDate: string;
}

export interface PrecioDraft {
  sectorId: string;
  batchId: string;
  price: string;
  quantity: string;
}

export interface EventDraft {
  categoryId: string;
  name: string;
  visibleStart: string;
  description: string;
  date: string;
  kickOffTime: string;
  ticketsPerPersonLimit: string;
  primaryColor: string;
  secondaryColor: string;
  mapsLink: string;
  sectores: SectorDraft[];
  tandas: TandaDraft[];
  precios: PrecioDraft[];
}

export type BasicField = Exclude<
  keyof EventDraft,
  "sectores" | "tandas" | "precios"
>;

export type FormErrors = Record<string, string>;

export interface CreateSectorRequest {
  eventId: 0;
  name: string;
  capacity: number;
}

export interface CreateBatchRequest {
  eventId: 0;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreatePriceRequest {
  sectorId: number;
  batchId: number;
  price: number;
  quantity: number;
}

export interface CreateEventRequest {
  categoryId: number;
  name: string;
  visibleStart: string;
  description: string;
  date: string;
  kickOffTime: string;
  ticketsPerPersonLimit: number;
  primaryColor: string;
  secondaryColor: string;
  mapsLink: string;
  sectores: CreateSectorRequest[];
  tandas: CreateBatchRequest[];
  precios: CreatePriceRequest[];
}

export interface SimpleEventDto {
  id: number;
  archived?: boolean;
  categoryId: number;
  name: string;
  visibleStart: string;
  description?: string | null;
  date: string;
  kickOffTime: string;
  ticketsPerPersonLimit: number;
  primaryColor: string;
  secondaryColor: string;
  mapsLink?: string | null;
}
