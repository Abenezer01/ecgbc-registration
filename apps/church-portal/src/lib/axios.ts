import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("church_portal_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("church_portal_refresh_token") : null;

      if (!refreshToken) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("church_portal_token");
          localStorage.removeItem("church_portal_refresh_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1";
        const res = await axios.post(`${API_URL}/church-auth/refresh`, { refreshToken });
        const data = res.data?.data;
        
        if (data?.accessToken && data?.refreshToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem("church_portal_token", data.accessToken);
            localStorage.setItem("church_portal_refresh_token", data.refreshToken);
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          processQueue(null, data.accessToken);
          return api(originalRequest);
        } else {
          throw new Error("Invalid refresh response");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("church_portal_token");
          localStorage.removeItem("church_portal_refresh_token");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
