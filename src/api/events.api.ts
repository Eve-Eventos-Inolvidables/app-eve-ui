import { EVENT_URL } from "../constants/ms";
import type { GetEventsRequest } from "../types/request";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import type { CreateEventRequest, SimpleEventDto } from "../types/event.types";
import { apiClient } from "./client";

export async function createEvent(
  payload: CreateEventRequest,
): Promise<ApiResponse<SimpleEventDto>> {
  const { data } = await apiClient.post<ApiResponse<SimpleEventDto>>(
    EVENT_URL + "/api/event",
    payload,
  );
  return data;
}

export async function getEvents(
  params: GetEventsRequest,
): Promise<ApiPagedResponse<SimpleEventDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<SimpleEventDto[]>>(
    EVENT_URL + "/api/sevent",
    { params },
  );
  return data;
}
