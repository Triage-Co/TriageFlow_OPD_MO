import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const TOKEN_KEY = "auth_access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";

const isWeb = Platform.OS === "web";

/**
 * Lấy Access Token từ SecureStore (có fallback về AsyncStorage & migration tự động)
 */
export async function getAccessToken(): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  try {
    const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (secureToken) {
      return secureToken;
    }

    // Migration nếu trước đó đã lưu ở AsyncStorage
    const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(TOKEN_KEY);
      return legacyToken;
    }

    return null;
  } catch (error) {
    console.warn("[TokenStorage] Error getting access token from SecureStore, fallback to AsyncStorage:", error);
    return AsyncStorage.getItem(TOKEN_KEY);
  }
}

/**
 * Lưu Access Token vào SecureStore
 */
export async function setAccessToken(token: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn("[TokenStorage] Error setting access token in SecureStore, fallback to AsyncStorage:", error);
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Lấy Refresh Token từ SecureStore (có fallback về AsyncStorage & migration tự động)
 */
export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  try {
    const secureToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (secureToken) {
      return secureToken;
    }

    const legacyToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (legacyToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      return legacyToken;
    }

    return null;
  } catch (error) {
    console.warn("[TokenStorage] Error getting refresh token from SecureStore, fallback to AsyncStorage:", error);
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Lưu Refresh Token vào SecureStore
 */
export async function setRefreshToken(token: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }

  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.warn("[TokenStorage] Error setting refresh token in SecureStore, fallback to AsyncStorage:", error);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/**
 * Lưu cả Access Token và Refresh Token đồng thời
 */
export async function setAuthTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await setAccessToken(accessToken);
  if (refreshToken) {
    await setRefreshToken(refreshToken);
  }
}

/**
 * Xóa sạch tất cả token khi logout hoặc khi phiên đăng nhập hết hạn
 */
export async function clearTokens(): Promise<void> {
  try {
    if (!isWeb) {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    }
  } catch (error) {
    console.warn("[TokenStorage] Error clearing SecureStore tokens:", error);
  } finally {
    // Luôn đảm bảo xóa cả AsyncStorage nếu có
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
  }
}
