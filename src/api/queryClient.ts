import { QueryCache, QueryClient, type Query } from "@tanstack/react-query";
import axios from "axios";
import { toaster } from "../components/ui/chakra-base/toaster-instance";
import { getErrorMessage } from "../utils/error";

const QUERY_ERROR_TOAST_ID = "query-error";

function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function handleQueryError(
  error: unknown,
  query: Query<unknown, unknown, unknown, readonly unknown[]>,
): void {
  // 401s are handled by the axios interceptor, which clears the session
  // and the query cache.
  if (isUnauthorized(error)) {
    return;
  }

  // Initial-load failures are rendered inline by each page; only surface
  // background refetch failures globally to avoid duplicate messages.
  if (query.state.data === undefined) {
    return;
  }

  // A single deduplicated toast, even if several queries fail at once.
  if (toaster.isVisible(QUERY_ERROR_TOAST_ID)) {
    return;
  }

  toaster.create({
    id: QUERY_ERROR_TOAST_ID,
    title: "No se pudieron actualizar los datos",
    description: getErrorMessage(error),
    type: "error",
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
});
