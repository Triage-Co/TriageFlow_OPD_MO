import apiClient from "@/shared/services/api-client";
import { RegisterRequest, RegisterResponse } from "@/features/auth/types/auth.types";

export const registerService = {
  
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>("/api/auth/register", data);
    return response.data;
  },
};
