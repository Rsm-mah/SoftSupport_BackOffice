export interface SoftSupportApiResponse<T> {
  success: boolean;
  message: string;
  messageArguments?: Record<string, unknown> | null;
  data: T;
  timestamp: string;
}

export interface SoftSupportPagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const SOFTSUPPORT_DEFAULT_PAGE_SIZE = 10;
