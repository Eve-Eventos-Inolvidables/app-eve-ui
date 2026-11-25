import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUserInterest, getUserInterests } from "../api/userInterest.api";
import type { GetUserInterestsRequest } from "../types/request";
import type {
  CreateUserInterestRequest,
  UserInterestDto,
} from "../types/userInterest.types";

const USER_INTEREST_PAGE_SIZE = 100;

export const userInterestKeys = {
  all: ["userInterests"] as const,
  lists: () => [...userInterestKeys.all, "list"] as const,
  list: (params: GetUserInterestsRequest) =>
    [...userInterestKeys.lists(), params] as const,
  byUser: (userId: number) =>
    [...userInterestKeys.all, "byUser", userId] as const,
};

async function getUserInterestsPage(params: GetUserInterestsRequest) {
  const response = await getUserInterests(params);

  if (!response.success) {
    throw new Error(response.message || "No se pudieron cargar tus intereses.");
  }

  return response;
}

async function getAllUserInterests(userId: number): Promise<UserInterestDto[]> {
  const firstPage = await getUserInterestsPage({
    page: 0,
    size: USER_INTEREST_PAGE_SIZE,
    userId,
  });
  const pageCount = Math.max(firstPage.pagination?.totalPages ?? 1, 1);
  const pageSize = firstPage.pagination?.size || USER_INTEREST_PAGE_SIZE;

  const remainingPages =
    pageCount > 1
      ? await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) =>
            getUserInterestsPage({
              page: index + 1,
              size: pageSize,
              userId,
            }),
          ),
        )
      : [];

  return [...(firstPage.data ?? []), ...remainingPages.flatMap((page) => page.data ?? [])]
    .filter((interest) => !interest.archived)
    .sort((left, right) => left.categoryId - right.categoryId);
}

export function useUserInterestsQuery(userId?: number, enabled = true) {
  return useQuery({
    queryKey: userInterestKeys.byUser(userId ?? 0),
    queryFn: () => getAllUserInterests(userId as number),
    enabled: enabled && userId != null,
  });
}

export function useCreateUserInterestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserInterestRequest) => {
      const response = await createUserInterest(payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || "No se pudo guardar el interés.");
      }

      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userInterestKeys.all }),
  });
}
