import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  eventManagerApi,
  type CreateEventManagerRequest,
} from "../api/eventManager.api";
import type { PagedRequest } from "../types/request";

export const eventManagerKeys = {
  all: ["eventManagers"] as const,
  lists: () => [...eventManagerKeys.all, "list"] as const,
  list: (params: PagedRequest) => [...eventManagerKeys.lists(), params] as const,
  details: () => [...eventManagerKeys.all, "detail"] as const,
  detail: (id: number) => [...eventManagerKeys.details(), id] as const,
  byManagerId: (managerId: number) =>
    [...eventManagerKeys.all, "byManagerId", managerId] as const,
  byEventId: (eventId: number) =>
    [...eventManagerKeys.all, "byEventId", eventId] as const,
};

export function useGetEventManagers(params: PagedRequest = {}) {
  return useQuery({
    queryKey: eventManagerKeys.list(params),
    queryFn: () => eventManagerApi.getManagers(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetEventManagerById(id: number) {
  return useQuery({
    queryKey: eventManagerKeys.detail(id),
    queryFn: () => eventManagerApi.getEventManagerById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useGetEventManagersByEventId(eventId: number) {
  return useQuery({
    queryKey: eventManagerKeys.byEventId(eventId),
    queryFn: () => eventManagerApi.getManagersByEventId(eventId),
    enabled: Number.isInteger(eventId) && eventId > 0,
  });
}

export function useGetEventManagersByManagerId(managerId: number) {
  return useQuery({
    queryKey: eventManagerKeys.byManagerId(managerId),
    queryFn: () => eventManagerApi.getManagersByManagerId(managerId),
    enabled: Number.isInteger(managerId) && managerId > 0,
  });
}

export function useCreateEventManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateEventManagerRequest) =>
      eventManagerApi.createEventManager(request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventManagerKeys.all }),
  });
}

export function useDeleteEventManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventManagerApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventManagerKeys.all }),
  });
}
