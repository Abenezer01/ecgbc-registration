export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Builds a standardized query string for API requests.
 * Maps standard pagination, search, and sorting to conventional keys
 * and spreads additional filters.
 *
 * @param params QueryParams object
 * @returns Serialized URL search params string (e.g. "?_page=1&_limit=20&_search=foo&isActive=true")
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("_page", String(params.page));
  if (params.limit !== undefined) searchParams.set("_limit", String(params.limit));
  if (params.search) searchParams.set("_search", params.search);
  if (params.sort) searchParams.set("_sort", params.sort);
  if (params.order) searchParams.set("_order", params.order);

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
