import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/features/auth/services/auth.service";
import { TOKEN_KEY } from "@/shared/services/api-client";
import { UserProfile, LoginRequest } from "@/features/auth/types/auth.types";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setAuthData: (token: string, user: UserProfile) => Promise<void>;
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
          setToken(savedToken);
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch {
        // Token hết hạn hoặc không hợp lệ – xóa session
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const setAuthData = useCallback(
    async (newToken: string, newUser: UserProfile) => {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(newUser);
    },
    []
  );

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await authService.login(data);
      await setAuthData(response.accessToken, response.user);
    },
    [setAuthData]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Bỏ qua lỗi logout từ server
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
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
        setAuthData,
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
