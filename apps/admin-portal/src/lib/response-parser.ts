import { AxiosResponse } from "axios";

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiData<T = any> {
  status: "success" | "error";
  data?: T;
  message?: string;
  meta?: ApiMeta;
}

/**
 * Safely extract data from API response
 * Handles both standard format { data: { data: ... } } and direct format { data: ... }
 */
export function extractData<T = any>(res: AxiosResponse): T {
  // Try standard format: res.data.data
  if (res.data && typeof res.data === "object" && "data" in res.data) {
    const nestedData = (res.data as ApiData<T>).data;
    if (nestedData !== undefined) {
      return nestedData as T;
    }
  }
  // Fallback to direct data
  return res.data as T;
}

/**
 * Safely extract meta from API response
 * Handles both nested format { data: { data: { meta: ... } } } and direct format { data: { meta: ... } }
 */
export function extractMeta(res: AxiosResponse): ApiMeta | undefined {
  // Try nested format: res.data.data.meta
  if (res.data && typeof res.data === "object" && "data" in res.data) {
    const nestedData = (res.data as ApiData).data;
    if (nestedData && typeof nestedData === "object" && "meta" in nestedData) {
      return (nestedData as { meta?: ApiMeta }).meta;
    }
  }
  // Try direct format: res.data.meta
  if (res.data && typeof res.data === "object" && "meta" in res.data) {
    return (res.data as { meta?: ApiMeta }).meta;
  }
  return undefined;
}

/**
 * Extract paginated data with meta
 */
export function extractPaginatedData<T = any>(res: AxiosResponse): {
  data: T;
  meta: ApiMeta | undefined;
} {
  return {
    data: extractData<T>(res),
    meta: extractMeta(res),
  };
}

/**
 * Extract message from API response
 */
export function extractMessage(res: AxiosResponse): string | undefined {
  if (res.data && typeof res.data === "object") {
    return (res.data as { message?: string }).message;
  }
  return undefined;
}
