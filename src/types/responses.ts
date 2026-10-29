export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T | null;
}

export interface ApiPagedResponse<T> extends ApiResponse<T> {
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
}

export interface ErrorData {
  message: string | null;
  status?: number;
}

export type ApiErrorResponse = ApiResponse<ErrorData> & {
  error?: ErrorData;
};

