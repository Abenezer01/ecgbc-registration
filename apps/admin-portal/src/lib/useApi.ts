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
  const handleError = (err: unknown, opts: ApiOptions): never => {
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
  };

  return {
    get: <T>(url: string, config: any = {}, opts: ApiOptions = {}) =>
      api.get<T>(url, config).catch((err) => handleError(err, opts)),
    post: <T>(url: string, data: any = {}, config: any = {}, opts: ApiOptions = {}) =>
      api.post<T>(url, data, config).catch((err) => handleError(err, opts)),
    put: <T>(url: string, data: any = {}, config: any = {}, opts: ApiOptions = {}) =>
      api.put<T>(url, data, config).catch((err) => handleError(err, opts)),
    patch: <T>(url: string, data: any = {}, config: any = {}, opts: ApiOptions = {}) =>
      api.patch<T>(url, data, config).catch((err) => handleError(err, opts)),
    delete: <T>(url: string, config: any = {}, opts: ApiOptions = {}) =>
      api.delete<T>(url, config).catch((err) => handleError(err, opts)),
  };
}