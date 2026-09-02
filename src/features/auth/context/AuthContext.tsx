import { decodeSupabaseJwt, loginService } from "@/features/auth/services/login.service";
import { LoginRequest, UserProfile } from "@/features/auth/types/auth.types";
import { setOnSessionExpired } from "@/shared/services/api-client";
import {
  getAccessToken,
  setAuthTokens,
  clearTokens,
} from "@/shared/utils/token-storage";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loginWithToken: (token: string, refreshToken: string) => Promise<void>;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOnSessionExpired(() => {
      setToken(null);
      setUser(null);
      showGlobalToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "info");
      try {
        router.replace("/(auth)/login");
      } catch (err) {
        console.warn("[AuthContext] Navigation on session expired failed:", err);
      }
    });

    return () => {
      setOnSessionExpired(null);
    };
  }, [router]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await getAccessToken();
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
        await clearTokens();
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
      await setAuthTokens(newToken, newRefreshToken);
      try {
        const profile = decodeSupabaseJwt(newToken);
        if (profile) {
          setToken(newToken);
          setUser(profile);
        } else {
          throw new Error(
            "Tài khoản này không có quyền truy cập ứng dụng bệnh nhân."
          );
        }
      } catch (error) {
        await clearTokens();
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
      const accessToken = response?.data?.access_token || response?.data?.token;
      const refreshToken = response?.data?.refresh_token || "";

      if (accessToken) {
        await loginWithToken(accessToken, refreshToken);
      } else {
        throw new Error("Không nhận được mã truy cập hợp lệ từ máy chủ.");
      }
    },
    [loginWithToken]
  );

  const logout = useCallback(async () => {
    try {
      const currentToken = token || (await getAccessToken());
      if (currentToken) {
        await loginService.logout(currentToken);
      }
    } catch {
      
    } finally {
      await clearTokens();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const updateUser = useCallback((updatedFields: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
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
        updateUser,
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
