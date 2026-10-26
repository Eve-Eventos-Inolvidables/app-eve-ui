import { useMutation } from "@tanstack/react-query";
import { login, register } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";
import type {
  LoginRequest,
  RegisterRequest,
  UserDto,
} from "../types/auth.types";
import { userFromToken } from "../utils/jwt";
import type { ApiErrorResponse } from "../types/responses";

interface AuthResult {
  user: UserDto;
  token: string;
}

async function loginAndStore(payload: LoginRequest): Promise<AuthResult> {
  const response = await login(payload);

  if (!response.success || !response.data?.token) {
    throw new Error((response as ApiErrorResponse).data?.message || "No se pudo iniciar sesión");
  }

  return {
    user: userFromToken(response.data.token, payload.email),
    token: response.data.token,
  };
}

async function registerAndLogin(payload: RegisterRequest): Promise<AuthResult> {
  const registerResponse = await register(payload);

  if (!registerResponse.success || !registerResponse.data) {
    throw new Error(registerResponse.message || "No se pudo crear la cuenta");
  }

  const loginResponse = await login({
    email: payload.email,
    password: payload.password,
  });

  if (!loginResponse.success || !loginResponse.data?.token) {
    throw new Error(
      loginResponse.message ||
        "La cuenta fue creada, pero no se pudo iniciar sesión",
    );
  }

  return {
    user: {
      ...registerResponse.data,
      roleName: registerResponse.data.roleName ?? "",
    },
    token: loginResponse.data.token,
  };
}

export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: loginAndStore,
    onSuccess: ({ user, token }) => setAuth(user, token),
  });
}

export function useRegisterMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: registerAndLogin,
    onSuccess: ({ user, token }) => setAuth(user, token),
  });
}
