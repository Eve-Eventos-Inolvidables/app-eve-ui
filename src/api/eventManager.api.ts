import { MANAGER_URL } from "../constants/ms";
import type { BaseEntity } from "../types/entity";
import type { PagedRequest } from "../types/request";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import { apiClient } from "./client";


export interface EventManager extends BaseEntity {
    eventId: number;
    assignedAt: string;
    managerId: number;
}
export interface CreateEventManagerRequest {
    managerId: number;
    eventId: number;
}
export const EventManagerApi = {
    getManagers: (params:PagedRequest) => apiClient.get<ApiPagedResponse<EventManager>>(MANAGER_URL + "/api/managers", { params }).then(res => res.data),
    createEventManager: (request: CreateEventManagerRequest) => apiClient.post<ApiResponse<EventManager>>(MANAGER_URL + "/api/managers", request).then(res => res.data),
    getEventManagerById: (id: number) => apiClient.get<ApiResponse<EventManager>>(MANAGER_URL + `/api/managers/${id}`).then(res => res.data),
    delete: (id: number) => apiClient.delete(MANAGER_URL + `/api/managers/${id}`).then(res => res.data),
}