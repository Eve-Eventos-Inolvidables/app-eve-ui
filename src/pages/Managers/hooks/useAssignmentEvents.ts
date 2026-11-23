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
      queryFn: () => getEventById(eventId),
      enabled: enabled && Number.isInteger(eventId) && eventId > 0,
    })),
    combine: (results) => {
      const eventsById = new Map<number, SimpleEventDto>();

      results.forEach((result) => {
        const event = result.data?.data;
        if (event) {
          eventsById.set(event.id, event);
        }
      });

      return {
        eventsById,
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        hasError: results.some(
          (result) => result.isError || result.data?.success === false,
        ),
        retry: () => {
          results.forEach((result) => {
            if (result.isError || result.data?.success === false) {
              void result.refetch();
            }
          });
        },
      };
    },
  });
}
