import { SALES_URL } from "../constants/ms";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import type {
  BuyDto,
  CreateBuyRequest,
  GetTicketsRequest,
  TicketDto,
} from "../types/sales.types";
import { apiClient } from "./client";

export async function createBuy(
  payload: CreateBuyRequest,
): Promise<ApiResponse<BuyDto>> {
  const { data } = await apiClient.post<ApiResponse<BuyDto>>(
    `${SALES_URL}/api/buys`,
    payload,
  );
  return data;
}

export async function getTickets(
  params: GetTicketsRequest,
): Promise<ApiPagedResponse<TicketDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<TicketDto[]>>(
    `${SALES_URL}/api/tickets`,
    { params },
  );
  return data;
}
