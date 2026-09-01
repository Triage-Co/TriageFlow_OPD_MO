import axios from "axios";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/shared/utils/token-storage";

export { TOKEN_KEY, REFRESH_TOKEN_KEY };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_TIMEOUT_MS = process.env.EXPO_PUBLIC_API_TIMEOUT_MS
  ? parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 10)
  : 15000;

let onSessionExpiredCallback: (() => void) | null = null;

export const setOnSessionExpired = (callback: (() => void) | null) => {
  onSessionExpiredCallback = callback;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const rawData = response.data?.data || response.data || {};
        const newToken = rawData.access_token || rawData.token;
        const newRefreshToken = rawData.refresh_token || rawData.refreshToken;

        if (newToken) {
          await setAccessToken(newToken);
          if (newRefreshToken) {
            await setRefreshToken(newRefreshToken);
          }

          apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          processQueue(null, newToken);
          isRefreshing = false;

          return apiClient(originalRequest);
        } else {
          throw new Error("Invalid token refresh response");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        await clearTokens();

        if (onSessionExpiredCallback) {
          onSessionExpiredCallback();
        }

        return Promise.reject(refreshError);
      }
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Đã xảy ra lỗi, vui lòng thử lại.";

    const config = error?.config;
    const isAuthRequest = config?.url?.includes("/api/auth/") && !config?.url?.includes("/api/auth/logout");
    const shouldSkipToast = config?.skipGlobalToast || isAuthRequest;

    if (!shouldSkipToast) {
      showGlobalToast(message, "error");
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
