import { AUTH_URL } from "../constants/ms";
import type { UserDto } from "../types/auth.types";
import type { PagedRequestByName } from "../types/request";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import { apiClient } from "./client";



export interface CreateUserRequest {
    roleId:   number;
    name:     string;
    email:    string;
    password: string;
}
export const usersApi = {
    getUsers: (params:PagedRequestByName) => apiClient.get<ApiPagedResponse<UserDto[]>>(AUTH_URL+"/api/users", { params }).then(res => res.data),
    createUser: (request: CreateUserRequest) => apiClient.post<ApiResponse<UserDto>>(AUTH_URL+"/api/users", request).then(res => res.data),
    getUserById: (id: number) => apiClient.get<ApiResponse<UserDto>>(AUTH_URL+`/api/users/${id}`).then(res => res.data),
    updateUser: (id: number, body: Partial<CreateUserRequest>) => apiClient.put<ApiResponse<UserDto>>(AUTH_URL+`/api/users/${id}`, body).then(res => res.data),
    deleteUser: (id: number) => apiClient.delete(AUTH_URL+`/api/users/${id}`).then(res => res.data)
}

export interface Role {
    id: number;
    name: string;
    archived: boolean;
}
export const rolesApi = {
    getAllRoles: () => apiClient.get<ApiResponse<Role[]>>(AUTH_URL+"/api/roles").then(res => res.data)
}