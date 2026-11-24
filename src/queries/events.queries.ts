import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createEvent,
  getEventById,
  getEvents,
} from "../api/events.api";
import {
  getBatches,
  lookupPricesForEvent,
  getPrices,
  getSectors,
} from "../api/eventCatalog.api";
import type { GetEventCatalogPageRequest } from "../api/eventCatalog.api";
import { getAllPagedItems } from "../api/pagination";
import type {
  BatchDto,
  CreateEventRequest,
  SectorByBatchDto,
  SectorDto,
  SimpleEventDto,
} from "../types/event.types";
import type { GetEventsRequest, PagedRequest } from "../types/request";
import type { ApiErrorResponse } from "../types/responses";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: GetEventsRequest) => [...eventKeys.lists(), params] as const,
  allPages: () => [...eventKeys.all, "allPages"] as const,
  detail: (id: number) => [...eventKeys.all, "detail", id] as const,
  catalogStructure: (eventId: number) =>
    ["eventCatalog", "structure", eventId] as const,
};

export interface EventCatalogStructure {
  sectors: SectorDto[];
  batches: BatchDto[];
  prices: SectorByBatchDto[];
}

export function useEventsQuery(
  params: GetEventsRequest = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: async () => {
      const response = await getEvents(params);

      if (!response.success) {
        throw new Error(response.message || "No se pudieron cargar los eventos.");
      }

      return response;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

async function getAllEvents(): Promise<SimpleEventDto[]> {
  return getAllPagedItems(
    getEvents,
    "No se pudieron cargar todos los eventos.",
  );
}

export function useAllEventsQuery(enabled = true) {
  return useQuery({
    queryKey: eventKeys.allPages(),
    queryFn: getAllEvents,
    enabled,
  });
}

export function useEventByIdQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const response = await getEventById(id);

      if (!response.success || !response.data) {
        throw new Error(response.message || "No se encontró el evento.");
      }

      return response.data;
    },
    enabled: enabled && Number.isInteger(id) && id > 0,
  });
}

async function getEventCatalogStructure(
  eventId: number,
): Promise<EventCatalogStructure> {
  const getEventCatalogPage = (params: PagedRequest): GetEventCatalogPageRequest => ({
    ...params,
    eventId,
  });
  const [sectors, batches, prices] = await Promise.all([
    getAllPagedItems(
      (params) => getSectors(getEventCatalogPage(params)),
      "No se pudieron cargar los sectores.",
    ),
    getAllPagedItems(
      (params) => getBatches(getEventCatalogPage(params)),
      "No se pudieron cargar las tandas.",
    ),
    getAllPagedItems(
      (params) => getPrices(getEventCatalogPage(params)),
      "No se pudieron cargar los precios.",
    ),
  ]);

  return { sectors, batches, prices };
}

export function useEventCatalogStructureQuery(
  eventId: number,
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.catalogStructure(eventId),
    queryFn: () => getEventCatalogStructure(eventId),
    enabled: enabled && Number.isSafeInteger(eventId) && eventId > 0,
  });
}

export function useLookupPricesForEventMutation() {
  return useMutation({
    mutationFn: async ({
      eventId,
      sectorByBatchIds,
    }: {
      eventId: number;
      sectorByBatchIds: number[];
    }) => {
      const response = await lookupPricesForEvent(eventId, sectorByBatchIds);

      if (!response.success || !response.data) {
        throw new Error(response.message || "No se pudieron verificar los precios.");
      }

      return response.data;
    },
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEventRequest) => {
      const response = await createEvent(payload);

      if (!response.success) {
        throw new Error(
          (response as ApiErrorResponse).data?.message ||
            response.message ||
            "No se pudo crear el evento.",
        );
      }

      return response;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}
