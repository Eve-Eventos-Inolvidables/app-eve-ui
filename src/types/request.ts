export interface PagedRequest {
  page?: number;
  size?: number;
}

export type GetPagedItemsRequest = PagedRequest;

export interface PagedSortedRequest extends PagedRequest {
  sort?: string;
}

export interface PagedRequestByName extends PagedSortedRequest {
  name?: string;
}

export interface GetEventsRequest extends PagedRequestByName {
  categoryId?: number;
  visibleStart?: string;
  dateFrom?: string;
  dateBefore?: string;
}

export type GetEventCategoriesRequest = PagedSortedRequest;

export interface GetUserInterestsRequest extends PagedRequest {
  userId?: number;
  categoryId?: number;
}
