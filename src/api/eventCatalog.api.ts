import { EVENT_URL } from "../constants/ms";
import type {
  BatchDto,
  SectorByBatchDto,
  SectorDto,
} from "../types/event.types";
import type { GetPagedItemsRequest } from "../types/request";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import { apiClient } from "./client";

export async function getSectors(
  params: GetPagedItemsRequest,
): Promise<ApiPagedResponse<SectorDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<SectorDto[]>>(
    `${EVENT_URL}/api/sector`,
    { params },
  );
  return data;
}

export async function getSectorById(
  id: number,
): Promise<ApiResponse<SectorDto>> {
  const { data } = await apiClient.get<ApiResponse<SectorDto>>(
    `${EVENT_URL}/api/sector/${id}`,
  );
  return data;
}

export async function getBatches(
  params: GetPagedItemsRequest,
): Promise<ApiPagedResponse<BatchDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<BatchDto[]>>(
    `${EVENT_URL}/api/batch`,
    { params },
  );
  return data;
}

export async function getBatchById(
  id: number,
): Promise<ApiResponse<BatchDto>> {
  const { data } = await apiClient.get<ApiResponse<BatchDto>>(
    `${EVENT_URL}/api/batch/${id}`,
  );
  return data;
}

export async function getPrices(
  params: GetPagedItemsRequest,
): Promise<ApiPagedResponse<SectorByBatchDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<SectorByBatchDto[]>>(
    `${EVENT_URL}/api/precio`,
    { params },
  );
  return data;
}

export async function getPriceById(
  id: number,
): Promise<ApiResponse<SectorByBatchDto>> {
  const { data } = await apiClient.get<ApiResponse<SectorByBatchDto>>(
    `${EVENT_URL}/api/precio/${id}`,
  );
  return data;
}
