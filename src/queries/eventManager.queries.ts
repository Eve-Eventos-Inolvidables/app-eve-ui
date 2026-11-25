import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { eventManagerApi } from "../api/eventManager.api";
import type { PagedRequest } from "../types/request";
import { getErrorMessage } from "../utils/error";

export const eventManagerKeys = {
  all: ["eventManagers"] as const,
  lists: () => [...eventManagerKeys.all, "list"] as const,
  list: (params: PagedRequest) => [...eventManagerKeys.lists(), params] as const,
  details: () => [...eventManagerKeys.all, "detail"] as const,
  detail: (id: number) => [...eventManagerKeys.details(), id] as const,
  byManagerId: (managerId: number) =>
    [...eventManagerKeys.all, "byManagerId", managerId] as const,
  byEventId: (eventId: number, params: PagedRequest = {}) =>
    [...eventManagerKeys.all, "byEventId", eventId, params] as const,
  myEvents: () => [...eventManagerKeys.all, "myEvents"] as const,
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

export function useGetEventManagersByEventId(
  eventId: number,
  params: PagedRequest = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventManagerKeys.byEventId(eventId, params),
    queryFn: () => eventManagerApi.getManagersByEventId(eventId, params),
    enabled: enabled && Number.isInteger(eventId) && eventId > 0,
  });
}

export function useGetMyEvents() {
  return useQuery({
    queryKey: eventManagerKeys.myEvents(),
    queryFn: () => eventManagerApi.getMyEvents(),
  });
}

export function useGetEventManagersByManagerId(managerId: number) {
  return useQuery({
    queryKey: eventManagerKeys.byManagerId(managerId),
    queryFn: () => eventManagerApi.getManagersByManagerId(managerId),
    enabled: Number.isInteger(managerId) && managerId > 0,
  });
}

export interface ManagerAssignmentResult {
  managerId: number;
  success: boolean;
  message: string;
}

export interface AssignManagersInput {
  eventId: number;
  managerIds: number[];
}

const ASSIGN_FALLBACK_MESSAGE = "No se pudo asignar el manager.";
const MISSING_RESULT_MESSAGE = "El servidor no devolvió resultado para este manager.";

// One manager: the regular endpoint. A failure is reported as a per-manager
// result so it appears in the assignment summary.
async function assignSingleManager(
  input: AssignManagersInput,
): Promise<ManagerAssignmentResult[]> {
  const managerId = input.managerIds[0];

  try {
    const response = await eventManagerApi.createEventManager({
      managerId,
      eventId: input.eventId,
    });

    return [
      {
        managerId,
        success: response.success,
        message:
          response.message ??
          (response.success ? "Asignado correctamente." : ASSIGN_FALLBACK_MESSAGE),
      },
    ];
  } catch (error) {
    return [
      {
        managerId,
        success: false,
        message: getErrorMessage(error, ASSIGN_FALLBACK_MESSAGE),
      },
    ];
  }
}

// Several managers: a single request. A request-level failure throws the
// backend ApiErrorResponse; per-manager outcomes come back in the data array.
async function assignManyManagers(
  input: AssignManagersInput,
): Promise<ManagerAssignmentResult[]> {
  const response = await eventManagerApi.assignManagersToEvent({
    eventId: input.eventId,
    managers: input.managerIds,
  });

  if (!response.success) {
    throw new Error(response.message || "No se pudo completar la asignación.");
  }

  const infoByManager = new Map(
    (response.data ?? []).map((info) => [info.managerId, info]),
  );

  return input.managerIds.map((managerId) => {
    const info = infoByManager.get(managerId);

    if (!info) {
      return { managerId, success: false, message: MISSING_RESULT_MESSAGE };
    }

    return { managerId, success: info.success, message: info.message };
  });
}

export function useAssignManagersToEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignManagersInput): Promise<ManagerAssignmentResult[]> =>
      input.managerIds.length === 1
        ? assignSingleManager(input)
        : assignManyManagers(input),
    onSettled: () =>
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
