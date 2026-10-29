import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { createEvent, getEvents } from "../api/events.api";
import type { CreateEventRequest, SimpleEventDto } from "../types/event.types";
import type { GetEventsRequest } from "../types/request";
import type { ApiErrorResponse } from "../types/responses";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: GetEventsRequest) => [...eventKeys.lists(), params] as const,
  allPages: () => [...eventKeys.all, "allPages"] as const,
};

export function useEventsQuery(
  params: GetEventsRequest = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => getEvents(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

async function getAllEvents(): Promise<SimpleEventDto[]> {
  const firstPage = await getEvents({ page: 0, size: 100 });
  const pageCount = Math.max(firstPage.pagination?.totalPages ?? 1, 1);
  const pageSize = firstPage.pagination?.size || 100;

  if (pageCount === 1) {
    return firstPage.data ?? [];
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      getEvents({ page: index + 1, size: pageSize }),
    ),
  );

  return [
    ...(firstPage.data ?? []),
    ...remainingPages.flatMap((response) => response.data ?? []),
  ];
}

export function useAllEventsQuery(enabled = true) {
  return useQuery({
    queryKey: eventKeys.allPages(),
    queryFn: getAllEvents,
    enabled,
  });
}

export function useCreateEventMutation() {
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
  });
}
