import { EVENT_URL } from "../constants/ms";
import type { ApiResponse } from "../types/responses";
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
