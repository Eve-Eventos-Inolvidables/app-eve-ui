import { useQueries } from "@tanstack/react-query";
import { getEventById } from "../../../api/events.api";
import type { EventManager } from "../../../api/eventManager.api";
import { eventKeys } from "../../../queries/events.queries";
import type { SimpleEventDto } from "../../../types/event.types";

export function useAssignmentEvents(
  assignments: EventManager[],
  enabled: boolean,
) {
  const eventIds = [...new Set(assignments.map((assignment) => assignment.eventId))];

  return useQueries({
    queries: eventIds.map((eventId) => ({
      queryKey: eventKeys.detail(eventId),
      queryFn: async () => {
        const response = await getEventById(eventId);

        if (!response.success || !response.data) {
          throw new Error(response.message || "No se encontró el evento.");
        }

        return response.data;
      },
      enabled: enabled && Number.isInteger(eventId) && eventId > 0,
    })),
    combine: (results) => {
      const eventsById = new Map<number, SimpleEventDto>();

      results.forEach((result) => {
        const event = result.data;
        if (event) {
          eventsById.set(event.id, event);
        }
      });

      return {
        eventsById,
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        hasError: results.some(
          (result) => result.isError,
        ),
        retry: () => {
          results.forEach((result) => {
            if (result.isError) {
              void result.refetch();
            }
          });
        },
      };
    },
  });
}
