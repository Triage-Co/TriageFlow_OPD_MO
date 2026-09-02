import { useState, useCallback } from "react";
import { forgotPasswordService } from "@/features/auth/services/forgot-password.service";
import { getErrorMessage } from "@/shared/utils/error.utils";

export interface UseForgotPasswordReturn {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  sendForgotPasswordOtp: (email: string) => Promise<boolean>;
  verifyForgotPasswordOtp: (email: string, otp: string, password: string) => Promise<boolean>;
}

export function useForgotPassword(): UseForgotPasswordReturn {
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
      setError(getErrorMessage(err, "Gửi mã OTP thất bại."));
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
        new_password: password,
      });
      if (response.status === "success" || response.code === 200) {
        return true;
      }
      setError(response.message || "Xác thực OTP thất bại.");
      return false;
    } catch (err) {
      setError(getErrorMessage(err, "Xác thực OTP thất bại."));
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
