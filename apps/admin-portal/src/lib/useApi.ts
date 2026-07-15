import { showToast } from "@/components/ui/Toast";
import api, { AxiosInstance } from "./api";
import { AxiosError } from "axios";

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
    method: keyof AxiosInstance,
    url: string,
    config: any = {},
    opts: ApiOptions = {}
  ): Promise<any> => {
    try {
      const response = await api[method]<T>(url, config);
      // Return the full AxiosResponse so callers can use extractData/etc.
      return response;
    } catch (err) {
      const axiosError = err as AxiosError;
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "An unknown error occurred";

      if (!opts.suppressErrorToast) {
        showToast({
          variant: "destructive",
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