export interface GetOrdersRequest {
  page: number;

  pageSize: number;

  search?: string;

  status?: string;
}