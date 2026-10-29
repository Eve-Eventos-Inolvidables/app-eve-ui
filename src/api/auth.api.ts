import { AUTH_URL } from "../constants/ms";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserDto,
} from "../types/auth.types";
import { apiClient } from "./client";


export async function login(
  payload: LoginRequest,
): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    AUTH_URL+"/api/auth/login",
    payload,
  );
  return data;
}

export async function register(
  payload: RegisterRequest,
): Promise<ApiResponse<UserDto>> {
  const { data } = await apiClient.post<ApiResponse<UserDto>>(
    AUTH_URL+"/api/auth/register",
    payload,
  );
  return data;
}
