import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserDto,
} from "../types/auth.types";
import { apiClient } from "./client";

const auth_url=import.meta.env.
VITE_AUTH_URL;

export async function login(
  payload: LoginRequest,
): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    auth_url+"/api/auth/login",
    payload,
  );
  return data;
}

export async function register(
  payload: RegisterRequest,
): Promise<ApiResponse<UserDto>> {
  const { data } = await apiClient.post<ApiResponse<UserDto>>(
    "/api/auth/register",
    payload,
  );
  return data;
}
