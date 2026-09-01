import { useState, useCallback } from "react";
import { otpService } from "@/features/auth/services/otp.service";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { getErrorMessage } from "@/shared/utils/error.utils";

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
      setError(getErrorMessage(err, "Không thể gửi mã OTP."));
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
        const accessToken = response?.data?.access_token || response?.data?.token;
        const refreshToken = response?.data?.refresh_token || "";

        if (accessToken) {
          await loginWithToken(accessToken, refreshToken);
          return true;
        }
        throw new Error("Không nhận được token xác thực.");
      } catch (err) {
        setError(getErrorMessage(err, "Xác thực OTP thất bại."));
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
