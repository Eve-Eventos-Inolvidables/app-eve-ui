import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createEventCategory,
  deleteEventCategory,
  getEventCategories,
  updateEventCategory,
} from "../api/eventCategory.api";
import type {
  CreateEventCategoryRequest,
  EventCategoryDto,
  UpdateEventCategoryDto,
} from "../types/event.types";
import type { GetEventCategoriesRequest } from "../types/request";

const CATEGORY_PAGE_SIZE = 100;

export const eventCategoryKeys = {
  all: ["eventCategories"] as const,
  lists: () => [...eventCategoryKeys.all, "list"] as const,
  list: (params: GetEventCategoriesRequest) =>
    [...eventCategoryKeys.lists(), params] as const,
  allPages: () => [...eventCategoryKeys.all, "allPages"] as const,
};

export function useEventCategoriesQuery(
  params: GetEventCategoriesRequest = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventCategoryKeys.list(params),
    queryFn: () => getEventCategoriesPage(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

async function getEventCategoriesPage(params: GetEventCategoriesRequest) {
  const response = await getEventCategories(params);

  if (!response.success) {
    throw new Error(response.message || "No se pudieron cargar las categorías.");
  }

  return response;
}

async function getAllEventCategories(): Promise<EventCategoryDto[]> {
  const firstPage = await getEventCategoriesPage({
    page: 0,
    size: CATEGORY_PAGE_SIZE,
    sort: "name,asc",
  });
  const pageCount = Math.max(firstPage.pagination?.totalPages ?? 1, 1);
  const pageSize = firstPage.pagination?.size || CATEGORY_PAGE_SIZE;

  const remainingPages =
    pageCount > 1
      ? await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) =>
            getEventCategoriesPage({
              page: index + 1,
              size: pageSize,
              sort: "name,asc",
            }),
          ),
        )
      : [];

  return [
    ...(firstPage.data ?? []),
    ...remainingPages.flatMap((page) => page.data ?? []),
  ]
    .filter((category) => !category.archived)
    .sort((left, right) =>
      left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
    );
}

export function useAllEventCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: eventCategoryKeys.allPages(),
    queryFn: getAllEventCategories,
    enabled,
  });
}

export function useCreateEventCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEventCategoryRequest) => {
      const response = await createEventCategory(payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || "No se pudo crear la categoría.");
      }

      return { category: response.data, message: response.message };
    },
    onSuccess: ({ category }) => {
      queryClient.setQueryData<EventCategoryDto[]>(
        eventCategoryKeys.allPages(),
        (current) => {
          if (category.archived) {
            return current ?? [];
          }

          const withoutDuplicate = (current ?? []).filter(
            (item) => item.id !== category.id,
          );

          return [...withoutDuplicate, category].sort((left, right) =>
            left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
          );
        },
      );
      void queryClient.invalidateQueries({ queryKey: eventCategoryKeys.all });
    },
  });
}

export function useUpdateEventCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: UpdateEventCategoryDto;
    }) => {
      const response = await updateEventCategory(id, body);

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "No se pudo actualizar la categoría.",
        );
      }

      return { category: response.data, message: response.message };
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventCategoryKeys.all }),
  });
}

export function useDeleteEventCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteEventCategory(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventCategoryKeys.all }),
  });
}
