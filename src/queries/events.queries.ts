import { useMutation, useQuery } from "@tanstack/react-query";
import { createEvent, getEvents } from "../api/events.api";
import type { CreateEventRequest } from "../types/event.types";
import type { GetEventsRequest } from "../types/request";
import type { ApiErrorResponse } from "../types/responses";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: GetEventsRequest) => [...eventKeys.lists(), params] as const,
};

export function useEventsQuery(params: GetEventsRequest = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => getEvents(params),
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
