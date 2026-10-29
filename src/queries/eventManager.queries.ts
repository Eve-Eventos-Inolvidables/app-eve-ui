import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  eventManagerApi,
  type CreateEventManagerRequest,
} from "../api/eventManager.api";
import { usersApi } from "../api/users.api";
import type { PagedRequest } from "../types/request";

export interface EventManagerRowData {
  id: number;
  managerId: number;
  eventId: number;
  assignedAt: string;
  name: string;
  email: string;
  event: string;
}

export const eventManagerKeys = {
  all: ["eventManagers"] as const,
  lists: () => [...eventManagerKeys.all, "list"] as const,
  list: (params: PagedRequest) => [...eventManagerKeys.lists(), params] as const,
  details: () => [...eventManagerKeys.all, "detail"] as const,
  detail: (id: number) => [...eventManagerKeys.details(), id] as const,
  withUsers: (params: PagedRequest) =>
    [...eventManagerKeys.all, "withUsers", params] as const,
};

async function getEventManagersWithUsers(
  params: PagedRequest,
): Promise<EventManagerRowData[]> {
  const response = await eventManagerApi.getManagers(params);
  const managers = response.data ?? [];
  const managerIds = [...new Set(managers.map((manager) => manager.managerId))];

  const results = await Promise.allSettled(
    managerIds.map((id) => usersApi.getUserById(id)),
  );

  const usersById = new Map(
    managerIds.map((id, index) => {
      const result = results[index];
      return [
        id,
        result.status === "fulfilled" ? result.value.data : null,
      ] as const;
    }),
  );

  return managers.map((manager) => {
    const user = usersById.get(manager.managerId);

    return {
      id: manager.id,
      managerId: manager.managerId,
      eventId: manager.eventId,
      assignedAt: manager.assignedAt,
      name: user?.name ?? "Sin nombre",
      email: user?.email ?? "-",
      event: "-",
    };
  });
}

export function useEventManagersWithUsersQuery(params: PagedRequest = {}) {
  return useQuery({
    queryKey: eventManagerKeys.withUsers(params),
    queryFn: () => getEventManagersWithUsers(params),
  });
}

export function useEventManagersQuery(params: PagedRequest = {}) {
  return useQuery({
    queryKey: eventManagerKeys.list(params),
    queryFn: () => eventManagerApi.getManagers(params),
  });
}

export function useEventManagerQuery(id: number) {
  return useQuery({
    queryKey: eventManagerKeys.detail(id),
    queryFn: () => eventManagerApi.getEventManagerById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateEventManagerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateEventManagerRequest) =>
      eventManagerApi.createEventManager(request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventManagerKeys.all }),
  });
}

export function useDeleteEventManagerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventManagerApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventManagerKeys.all }),
  });
}
