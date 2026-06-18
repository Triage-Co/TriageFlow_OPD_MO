import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginService, decodeSupabaseJwt } from "@/features/auth/services/login.service";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/shared/services/api-client";
import { UserProfile, LoginRequest } from "@/features/auth/types/auth.types";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loginWithToken: (token: string, refreshToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi động app – kiểm tra token đã lưu
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (savedToken) {
          const profile = decodeSupabaseJwt(savedToken);
          if (profile) {
            setToken(savedToken);
            setUser(profile);
          } else {
            throw new Error("Invalid token payload");
          }
        }
      } catch {
        // Token hết hạn hoặc không hợp lệ – xóa session
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const loginWithToken = useCallback(
    async (newToken: string, newRefreshToken: string) => {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      try {
        const profile = decodeSupabaseJwt(newToken);
        if (profile) {
          setToken(newToken);
          setUser(profile);
        } else {
          // null có thể do token không hợp lệ HOẶC do role không phải USER
          throw new Error(
            "Tài khoản này không có quyền truy cập ứng dụng bệnh nhân."
          );
        }
      } catch (error) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        throw error;
      }
    },
    []
  );

  const login = useCallback(
    async (data: LoginRequest) => {
      let response;
      if ("email" in data) {
        response = await loginService.loginWithEmail(data);
      } else {
        response = await loginService.loginWithCitizen(data);
      }
      if (response && response.data?.token) {
        await loginWithToken(response.data.token, response.data.refreshToken);
      } else {
        throw new Error("Không nhận được mã truy cập hợp lệ từ máy chủ.");
      }
    },
    [loginWithToken]
  );

  const logout = useCallback(async () => {
    try {
      await loginService.logout();
    } catch {
      // Bỏ qua lỗi logout từ server
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        loginWithToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext phải được dùng trong AuthProvider");
  }
  return context;
}


