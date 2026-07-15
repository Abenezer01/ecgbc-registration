import axios from "axios";

// Use import.meta.env for Vite environment variables
// Default to empty string to allow proxying when running in dev mode without explicit URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// Attach token on every request (in case it was set after instance creation)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      const message = error.response?.data?.message;
      if (token && (message === 'The token is invalid' || message === 'Your not logged in')) {
        const { store } = await import('../store/store');
        const { logout } = await import('../store/features/auth.slice');
        console.log('axios interceptor (forced logout due to invalid token)');
        store.dispatch(logout());
      } else {
        console.log('axios interceptor (401 ignored - no token yet or benign)');
      }
    }
    return Promise.reject(error);
  }
);

export default api;