import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rolesApi,
  usersApi,
  type CreateUserRequest,
} from "../api/users.api";
import type { PagedRequestByName } from "../types/request";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: PagedRequestByName) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
};

export function useUsersQuery(params: PagedRequestByName = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getUsers(params),
  });
}

export function useUserQuery(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) => usersApi.createUser(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Partial<CreateUserRequest>;
    }) => usersApi.updateUser(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useRolesQuery() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: () => rolesApi.getAllRoles(),
  });
}
