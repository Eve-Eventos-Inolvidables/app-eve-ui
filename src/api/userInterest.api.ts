import { INTEREST_URL } from "../constants/ms";
import type { GetUserInterestsRequest } from "../types/request";
import type {
  CreateUserInterestRequest,
  UserInterestDto,
} from "../types/userInterest.types";
import type { ApiPagedResponse, ApiResponse } from "../types/responses";
import { apiClient } from "./client";

export async function getUserInterests(
  params: GetUserInterestsRequest,
): Promise<ApiPagedResponse<UserInterestDto[]>> {
  const { data } = await apiClient.get<ApiPagedResponse<UserInterestDto[]>>(
    `${INTEREST_URL}/api/user-interests`,
    { params },
  );
  return data;
}

export async function createUserInterest(
  payload: CreateUserInterestRequest,
): Promise<ApiResponse<UserInterestDto>> {
  const { data } = await apiClient.post<ApiResponse<UserInterestDto>>(
    `${INTEREST_URL}/api/user-interests`,
    payload,
  );
  return data;
}
