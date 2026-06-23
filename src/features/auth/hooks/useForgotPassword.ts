import { useState, useCallback } from "react";
import { forgotPasswordService } from "@/features/auth/services/forgot-password.service";

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sendForgotPasswordOtp = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await forgotPasswordService.forgotPassword({ email });
      if (response.status === "success" || response.code === 200) {
        return true;
      }
      setError(response.message || "Gửi mã OTP thất bại.");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi mã OTP thất bại.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyForgotPasswordOtp = useCallback(async (
    email: string,
    otp: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await forgotPasswordService.verifyForgotPassword({
        email,
        otp,
        password,
      });
      if (response.status === "success" || response.code === 200) {
        return true;
      }
      setError(response.message || "Xác thực OTP thất bại.");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác thực OTP thất bại.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
  };
}
