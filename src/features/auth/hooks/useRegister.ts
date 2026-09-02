import { useState, useCallback } from "react";
import { registerService } from "@/features/auth/services/register.service";
import { RegisterRequest } from "@/features/auth/types/auth.types";
import { getErrorMessage } from "@/shared/utils/error.utils";

export interface UseRegisterReturn {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  register: (data: RegisterRequest) => Promise<boolean>;
}

export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await registerService.register(data);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Đăng ký thất bại."));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    register,
  };
}
