export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T | null;
}

export interface UserDto {
  id: number;
  archived?: boolean;
  roleId?: number;
  name: string;
  email: string;
  roleName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
}
