import { showToast } from "@/components/ui/Toast";
import api from "./api";
import type { AxiosError } from "axios";

interface ApiOptions {
  /** If true, errors will not trigger a toast notification */
  suppressErrorToast?: boolean;
}

/**
 * Wrapper around the axios instance that automatically shows a toast on error.
 * Usage: const { get, post, put, patch, delete } = useApi();
 */
export function useApi() {
  const request = async <T>(
    method: "get" | "post" | "put" | "patch" | "delete",
    url: string,
    config: any = {},
    opts: ApiOptions = {}
  ): Promise<any> => {
    try {
      const methodMap = {
        get: api.get.bind(api),
        post: api.post.bind(api),
        put: api.put.bind(api),
        patch: api.patch.bind(api),
        delete: api.delete.bind(api),
      } as const;

      const response = await methodMap[method]<T>(url, config);
      // Return the full AxiosResponse so callers can use extractData/etc.
      return response;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; error?: string }>;
      const responseData = axiosError.response?.data as { message?: string; error?: string } | undefined;
      const message =
        responseData?.message ||
        responseData?.error ||
        axiosError.message ||
        "An unknown error occurred";

      if (!opts.suppressErrorToast) {
        showToast({
          variant: "error",
          title: "Error",
          description: message,
        });
      }
      throw err;
    }
  };

  return {
    get: <T>(url: string, config: any = {}, opts: ApiOptions = {}) =>
      request<T>("get", url, config, opts),
    post: <T>(url: string, data: any = {}, config: any = {}, opts: ApiOptions = {}) =>
      request<T>("post", url, { ...config, data }, opts),
    put: <T>(url: string, data: any = {}, config: any = {}, opts: ApiOptions = {}) =>
      request<T>("put", url, { ...config, data }, opts),
    patch: <T>(url: string, data: any = {}, config: any = {}, opts: ApiOptions = {}) =>
      request<T>("patch", url, { ...config, data }, opts),
    delete: <T>(url: string, config: any = {}, opts: ApiOptions = {}) =>
      request<T>("delete", url, config, opts),
  };
}