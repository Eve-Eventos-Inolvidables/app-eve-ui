import { EVENT_URL } from "../constants/ms";
import type {
  CreateEventCategoryRequest,
  EventCategoryDto,
  UpdateEventCategoryDto,
} from "../types/event.types";
import type { GetEventCategoriesRequest } from "../types/request";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import { apiClient } from "./client";

export async function getEventCategories(
  params: GetEventCategoriesRequest,
): Promise<ApiPagedResponse<EventCategoryDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<EventCategoryDto[]>>(
    `${EVENT_URL}/api/categoria`,
    { params },
  );
  return data;
}

export async function createEventCategory(
  payload: CreateEventCategoryRequest,
): Promise<ApiResponse<EventCategoryDto>> {
  const { data } = await apiClient.post<ApiResponse<EventCategoryDto>>(
    `${EVENT_URL}/api/categoria`,
    payload,
  );
  return data;
}

export async function updateEventCategory(
  id: number,
  payload: UpdateEventCategoryDto,
): Promise<ApiResponse<EventCategoryDto>> {
  const { data } = await apiClient.patch<ApiResponse<EventCategoryDto>>(
    `${EVENT_URL}/api/categoria/${id}`,
    payload,
  );
  return data;
}

export async function deleteEventCategory(id: number): Promise<void> {
  await apiClient.delete<void>(`${EVENT_URL}/api/categoria/${id}`);
}
