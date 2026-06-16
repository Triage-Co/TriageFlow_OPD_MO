import { useState, useCallback } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import {
  RegisterRequest,
  OtpVerifyRequest,
  ResendOtpRequest,
} from "@/features/auth/types/auth.types";

/**
 * Hook cho các thao tác Auth (register, verifyOtp, resendOtp)
 * Login và logout được xử lý trực tiếp qua useAuthContext
 */
export function useAuth() {
  const { login, logout, isLoading: sessionLoading, setAuthData } = useAuthContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (data: OtpVerifyRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.verifyOtp(data);
        await setAuthData(response.accessToken, response.user);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mã OTP không đúng.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthData]
  );

  const resendOtp = useCallback(async (data: ResendOtpRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resendOtp(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại OTP.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = useCallback(
    async (phoneOrNationalId: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await login({ phoneOrNationalId, password });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    isLoading: isLoading || sessionLoading,
    error,
    clearError,
    register,
    verifyOtp,
    resendOtp,
    login: handleLogin,
    logout: handleLogout,
  };
}
