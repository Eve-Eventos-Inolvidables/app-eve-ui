import type { BaseEntity } from "./entity";

export interface CreateBuyRequest {
  eventId: number;
  sectorByBatchIds: number[];
}

export interface BuyDto extends BaseEntity {
  eventId: number;
  userId: number;
  total: number;
  date: string;
}

export interface TicketDto extends BaseEntity {
  sectorByBatchId: number;
  buyId: number;
  qrToken?: string | null;
}

export interface GetTicketsRequest {
  page?: number;
  size?: number;
  buyId?: number;
  sectorByBatchId?: number;
  eventId?: number;
}
