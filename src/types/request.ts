export interface PagedRequest {
  page?: number;
  size?: number;
}

export interface PagedSortedRequest extends PagedRequest {
  sort?: string;
}

export interface PagedRequestByName extends PagedSortedRequest {
  name?: string;
}

export interface GetEventsRequest extends PagedRequestByName {
  categoryId?: number;
  visibleStart?: string;
}
