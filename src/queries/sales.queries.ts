import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createBuy, getBuys, getTickets } from "../api/sales.api";
import { getAllPagedItems } from "../api/pagination";
import type {
  BuyDto,
  CreateBuyRequest,
  TicketDto,
} from "../types/sales.types";

const BUY_PAGE_SIZE = 10;

export const salesKeys = {
  all: ["sales"] as const,
  buys: () => [...salesKeys.all, "buys"] as const,
  buyPage: (page: number) => [...salesKeys.buys(), "page", page] as const,
  tickets: () => [...salesKeys.all, "tickets"] as const,
  ticketsByBuy: (buyId: number) =>
    [...salesKeys.tickets(), "buy", buyId] as const,
  ticketCountByBuy: (buyId: number) =>
    [...salesKeys.tickets(), "buy", buyId, "count"] as const,
  ticketCountByEvent: (eventId: number) =>
    [...salesKeys.tickets(), "event", eventId, "count"] as const,
};

async function getAllTicketsForBuy(buyId: number): Promise<TicketDto[]> {
  return getAllPagedItems(
    (params) => getTickets({ ...params, buyId }),
    "No se pudieron cargar las entradas de la compra.",
  );
}

export function useTicketsByBuyQuery(buyId: number, enabled = true) {
  return useQuery({
    queryKey: salesKeys.ticketsByBuy(buyId),
    queryFn: () => getAllTicketsForBuy(buyId),
    enabled: enabled && Number.isInteger(buyId) && buyId > 0,
  });
}

async function getTicketCountForBuy(buyId: number): Promise<number> {
  const response = await getTickets({ buyId, page: 1, size: 1 });
  if (!response.success) {
    throw new Error(response.message || "No se pudieron contar las entradas.");
  }
  return response.pagination.totalItems;
}

export function useTicketCountByBuyQuery(buyId: number, enabled = true) {
  return useQuery({
    queryKey: salesKeys.ticketCountByBuy(buyId),
    queryFn: () => getTicketCountForBuy(buyId),
    enabled: enabled && Number.isInteger(buyId) && buyId > 0,
  });
}

async function getTicketCountForEvent(eventId: number): Promise<number> {
  const response = await getTickets({ eventId, page: 1, size: 1 });
  if (!response.success) {
    throw new Error(response.message || "No se pudo validar el límite de entradas.");
  }
  return response.pagination.totalItems;
}

export function useTicketCountByEventQuery(eventId: number, enabled = true) {
  return useQuery({
    queryKey: salesKeys.ticketCountByEvent(eventId),
    queryFn: () => getTicketCountForEvent(eventId),
    enabled: enabled && Number.isInteger(eventId) && eventId > 0,
  });
}

export function useBuysQuery(page: number, enabled = true) {
  return useQuery({
    queryKey: salesKeys.buyPage(page),
    queryFn: async () => {
      const response = await getBuys({
        page,
        size: BUY_PAGE_SIZE,
        sort: "date,desc",
      });

      if (!response.success) {
        throw new Error(response.message || "No se pudieron cargar tus compras.");
      }

      return response;
    },
    enabled: enabled && Number.isInteger(page) && page > 0,
    placeholderData: keepPreviousData,
  });
}

export function useCreateBuyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBuyRequest): Promise<BuyDto> => {
      const response = await createBuy(payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || "No se pudo registrar la compra.");
      }

      return response.data;
    },
    // Purchase creation is not idempotent; never automatically retry the POST.
    retry: 0,
    onSuccess: (_buy, payload) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: salesKeys.buys() }),
        queryClient.invalidateQueries({
          queryKey: salesKeys.ticketCountByEvent(payload.eventId),
        }),
      ]),
  });
}
