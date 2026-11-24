import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBuy, getTickets } from "../api/sales.api";
import { getAllPagedItems } from "../api/pagination";
import type {
  BuyDto,
  CreateBuyRequest,
  TicketDto,
} from "../types/sales.types";

export const salesKeys = {
  all: ["sales"] as const,
  buys: () => [...salesKeys.all, "buys"] as const,
  tickets: () => [...salesKeys.all, "tickets"] as const,
  ticketsByBuy: (buyId: number) =>
    [...salesKeys.tickets(), "buy", buyId] as const,
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesKeys.buys() }),
  });
}
