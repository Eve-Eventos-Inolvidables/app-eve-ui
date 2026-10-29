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
} from "../api/users.api";
import type { UserDto } from "../types/auth.types";
import type { PagedRequestByName } from "../types/request";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: PagedRequestByName) =>
    [...userKeys.lists(), params] as const,
  allPages: () => [...userKeys.all, "allPages"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
};

export function useUsersQuery(
  params: PagedRequestByName = {},
  enabled = true,
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getUsers(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

async function getAllUsers(): Promise<UserDto[]> {
  const firstPage = await usersApi.getUsers({ page: 0, size: 100 });
  const pageCount = Math.max(firstPage.pagination?.totalPages ?? 1, 1);
  const pageSize = firstPage.pagination?.size ?? 100;

  if (pageCount === 1) {
    return firstPage.data ?? [];
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      usersApi.getUsers({ page: index + 1, size: pageSize }),
    ),
  );

  return [
    ...(firstPage.data ?? []),
    ...remainingPages.flatMap((response) => response.data ?? []),
  ];
}

export function useAllUsersQuery(enabled = true) {
  return useQuery({
    queryKey: userKeys.allPages(),
    queryFn: getAllUsers,
    enabled,
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
