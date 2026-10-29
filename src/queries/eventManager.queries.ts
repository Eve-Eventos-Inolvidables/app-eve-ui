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
import { usersApi } from "../api/users.api";
import type { PagedRequest } from "../types/request";
import type {
  ApiErrorResponse,
  ApiResponse,
  Pagination,
} from "../types/responses";

export interface EventManagerRowData {
  id: number;
  managerId: number;
  eventId: number;
  assignedAt: string;
  name: string;
  email: string;
}

export interface EventManagersWithUsersResult {
  rows: EventManagerRowData[];
  pagination: Pagination;
}

function ensureSuccess(
  response: ApiResponse<unknown> | null | undefined,
  fallbackMessage: string,
): void {
  if (response && !response.success) {
    throw new Error(
      (response as ApiErrorResponse).data?.message ||
        response.message ||
        fallbackMessage,
    );
  }
}

export const eventManagerKeys = {
  all: ["eventManagers"] as const,
  lists: () => [...eventManagerKeys.all, "list"] as const,
  list: (params: PagedRequest) => [...eventManagerKeys.lists(), params] as const,
  allPages: () => [...eventManagerKeys.all, "allPages"] as const,
  details: () => [...eventManagerKeys.all, "detail"] as const,
  detail: (id: number) => [...eventManagerKeys.details(), id] as const,
  withUsers: (params: PagedRequest) =>
    [...eventManagerKeys.all, "withUsers", params] as const,
};

async function getEventManagersWithUsers(
  params: PagedRequest,
): Promise<EventManagersWithUsersResult> {
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

  return {
    rows: managers.map((manager) => {
      const user = usersById.get(manager.managerId);

      return {
        id: manager.id,
        managerId: manager.managerId,
        eventId: manager.eventId,
        assignedAt: manager.assignedAt,
        name: user?.name ?? "Sin nombre",
        email: user?.email ?? "-",
      };
    }),
    pagination: response.pagination ?? {
      page: params.page ?? 0,
      size: params.size ?? managers.length,
      totalPages: 1,
      totalItems: managers.length,
    },
  };
}

export function useEventManagersWithUsersQuery(params: PagedRequest = {}) {
  return useQuery({
    queryKey: eventManagerKeys.withUsers(params),
    queryFn: () => getEventManagersWithUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useEventManagersQuery(params: PagedRequest = {}) {
  return useQuery({
    queryKey: eventManagerKeys.list(params),
    queryFn: () => eventManagerApi.getManagers(params),
  });
}

async function getAllEventManagers() {
  const firstPage = await eventManagerApi.getManagers({ page: 0, size: 100 });
  const pageCount = Math.max(firstPage.pagination?.totalPages ?? 1, 1);
  const pageSize = firstPage.pagination?.size || 100;

  if (pageCount === 1) {
    return firstPage.data ?? [];
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      eventManagerApi.getManagers({ page: index + 1, size: pageSize }),
    ),
  );

  return [
    ...(firstPage.data ?? []),
    ...remainingPages.flatMap((response) => response.data ?? []),
  ];
}

export function useAllEventManagersQuery(enabled = true) {
  return useQuery({
    queryKey: eventManagerKeys.allPages(),
    queryFn: getAllEventManagers,
    enabled,
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
    mutationFn: async (request: CreateEventManagerRequest) => {
      const response = await eventManagerApi.createEventManager(request);
      return ensureSuccess(response, "No se pudo asignar el manager.");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventManagerKeys.all }),
  });
}

export function useDeleteEventManagerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await eventManagerApi.delete(id);
      return ensureSuccess(response, "No se pudo desasignar el manager.");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventManagerKeys.all }),
  });
}
