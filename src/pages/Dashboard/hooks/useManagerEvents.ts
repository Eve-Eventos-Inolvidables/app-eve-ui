import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { useGetMyEvents } from "../../../queries/eventManager.queries";
import { eventByIdQueryOptions } from "../../../queries/events.queries";
import type { SimpleEventDto } from "../../../types/event.types";
import { getTodayDateValue } from "../../../utils/eventFormatting";

// A 404 from the assignments endpoint means the manager has no events yet:
// that is an empty state for this screen, not a failure.
function isNoEventsError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export interface ManagerEvents {
  upcoming: SimpleEventDto[];
  past: SimpleEventDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useManagerEvents(): ManagerEvents {
  const myEventsQuery = useGetMyEvents();
  const noEvents =
    myEventsQuery.isError && isNoEventsError(myEventsQuery.error);

  const eventIds = useMemo(
    () =>
      noEvents ? [] : [...new Set(myEventsQuery.data?.data ?? [])],
    [myEventsQuery.data, noEvents],
  );

  const eventQueries = useQueries({
    queries: eventIds.map((id) => eventByIdQueryOptions(id)),
  });

  const events = eventQueries
    .map((query) => query.data)
    .filter(
      (event): event is SimpleEventDto => Boolean(event) && !event?.archived,
    );

  const today = getTodayDateValue();
  const upcoming = events
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((event) => event.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const isLoading =
    myEventsQuery.isPending || eventQueries.some((query) => query.isPending);

  const refetch = () => {
    void myEventsQuery.refetch();
    eventQueries.forEach((query) => void query.refetch());
  };

  return {
    upcoming,
    past,
    isLoading,
    isError: myEventsQuery.isError && !noEvents,
    error: myEventsQuery.error,
    refetch,
  };
}
