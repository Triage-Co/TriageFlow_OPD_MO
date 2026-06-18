import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_TIMEOUT_MS } from "@/config/env";

export const TOKEN_KEY = "auth_access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor – gắn Bearer token nếu có
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag để theo dõi quá trình refresh token
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

// Response interceptor – tự động refresh token khi nhận lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tránh vòng lặp vô hạn nếu API refresh hoặc login trả 401
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login")
    ) {
      if (isRefreshing) {
        // Nếu đang refresh token, đẩy request này vào hàng đợi chờ token mới
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
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi axios riêng biệt để tránh chạy qua interceptors hoặc gây loop
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data?.data || {};

        if (newToken) {
          await AsyncStorage.setItem(TOKEN_KEY, newToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
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

        // Xóa token và buộc đăng xuất
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

        return Promise.reject(refreshError);
      }
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Đã xảy ra lỗi, vui lòng thử lại.";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

