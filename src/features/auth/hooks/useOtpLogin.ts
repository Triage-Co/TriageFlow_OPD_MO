import { useState, useCallback } from "react";
import { otpService } from "@/features/auth/services/otp.service";
import { useAuthContext } from "@/features/auth/context/AuthContext";

export function useOtpLogin() {
  const { loginWithToken } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sendOtp = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await otpService.sendLoginOtp({ email });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi mã OTP.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtpLogin = useCallback(
    async (email: string, otp: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await otpService.verifyLoginOtp({ email, otp });
        if (response && response.data?.token) {
          await loginWithToken(response.data.token, response.data.refreshToken);
          return true;
        }
        throw new Error("Không nhận được token xác thực.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xác thực OTP thất bại.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithToken]
  );

  return {
    isLoading,
    error,
    clearError,
    sendOtp,
    verifyOtpLogin,
  };
}
