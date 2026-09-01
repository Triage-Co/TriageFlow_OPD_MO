import { useState, useCallback } from "react";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { LoginRequest } from "@/features/auth/types/auth.types";
import { getErrorMessage } from "@/shared/utils/error.utils";

export function useLogin() {
  const { login, isLoading: sessionLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleLogin = useCallback(
    async (requestData: LoginRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await login(requestData);
        return true;
      } catch (err) {
        setError(getErrorMessage(err, "Đăng nhập thất bại."));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  return {
    isLoading: isLoading || sessionLoading,
    error,
    clearError,
    login: handleLogin,
  };
}
