import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { createEvent, getEventById, getEvents } from "../api/events.api";
import type { CreateEventRequest } from "../types/event.types";
import type { GetEventsRequest } from "../types/request";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: GetEventsRequest) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (id: number) => [...eventKeys.details(), id] as const,
};

export function useGetEvents(
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

export function useGetEventById(id: number) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEventById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateEvent() {
  return useMutation({
    mutationFn: (payload: CreateEventRequest) => createEvent(payload),
  });
}
