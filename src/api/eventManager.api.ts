import { MANAGER_URL } from "../constants/ms";
import type { BaseEntity } from "../types/entity";
import type { PagedRequest } from "../types/request";
import type { ApiErrorResponse, ApiPagedResponse, ApiResponse } from "../types/responses";
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
export const eventManagerApi = {
    getManagers: (params:PagedRequest) => apiClient.get<ApiPagedResponse<EventManager[]>>(MANAGER_URL + "/api/managers", { params }).then(res => res.data),
    createEventManager: (request: CreateEventManagerRequest) => apiClient.post<ApiResponse<EventManager>>(MANAGER_URL + "/api/managers", request).then(res => res.data),
    getEventManagerById: (id: number) => apiClient.get<ApiResponse<EventManager>>(MANAGER_URL + `/api/managers/${id}`).then(res => res.data),
    delete: (id: number) => apiClient.delete<ApiErrorResponse | void>(MANAGER_URL + `/api/managers/${id}`).then(res => res.data),
    getManagersByEventId: (eventId: number, params: PagedRequest = {}) => apiClient.get<ApiPagedResponse<EventManager[]>>(MANAGER_URL + `/api/managers/by-event/${eventId}`, { params }).then(res => res.data),    
    getManagersByManagerId: (managerId: number) => apiClient.get<ApiResponse<EventManager[]>>(MANAGER_URL + `/api/managers/by-manager/${managerId}`).then(res => res.data),
    getMyEvents: () => apiClient.get<ApiResponse<number[]>>(MANAGER_URL + `/api/managers/myEvents`).then(res => res.data),
}