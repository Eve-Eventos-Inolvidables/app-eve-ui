import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  rolesApi,
  usersApi,
  type CreateUserRequest,
  type SearchUsersRequest,
} from "../api/users.api";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: SearchUsersRequest) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
};

export function useGetUsers(
  params: SearchUsersRequest = {},
  enabled = true,
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getUsers(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useGetUserById(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useGetRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: rolesApi.getAllRoles,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) => usersApi.createUser(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
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

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
