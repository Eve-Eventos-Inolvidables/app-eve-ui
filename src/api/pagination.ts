import type { PagedRequest } from "../types/request";
import type { ApiPagedResponse } from "../types/responses";

const API_PAGE_SIZE = 100;

function assertSuccessfulPage<T>(
  response: ApiPagedResponse<T[]>,
  fallbackMessage: string,
): T[] {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data ?? [];
}

export async function getAllPagedItems<T>(
  getPage: (
    params: PagedRequest,
  ) => Promise<ApiPagedResponse<T[]>>,
  fallbackMessage: string,
): Promise<T[]> {
  const firstPage = await getPage({ page: 1, size: API_PAGE_SIZE });
  const items = assertSuccessfulPage(firstPage, fallbackMessage);
  const pageCount = Math.max(firstPage.pagination?.totalPages ?? 1, 1);
  const pageSize = firstPage.pagination?.size || API_PAGE_SIZE;

  for (let page = 2; page <= pageCount; page += 1) {
    const response = await getPage({ page, size: pageSize });
    items.push(...assertSuccessfulPage(response, fallbackMessage));
  }

  return items;
}
