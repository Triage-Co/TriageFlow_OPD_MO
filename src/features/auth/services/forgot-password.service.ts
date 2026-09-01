import apiClient from "@/shared/services/api-client";
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
} from "@/features/auth/types/auth.types";

export const forgotPasswordService = {
  
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    console.log("\n================== [API FORGOT PASSWORD - SEND OTP] ==================");
    console.log("[forgotPasswordService] Request payload:", JSON.stringify(data, null, 2));
    try {
      const response = await apiClient.post<ForgotPasswordResponse>("/api/auth/forgot", data);
      console.log("[forgotPasswordService] Response status:", response.status);
      console.log("[forgotPasswordService] Response data:", JSON.stringify(response.data, null, 2));
      console.log("=======================================================================\n");
      return response.data;
    } catch (error: any) {
      console.error("[forgotPasswordService] SEND OTP ERROR:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      console.log("=======================================================================\n");
      throw error;
    }
  },

  async verifyForgotPassword(data: ForgotPasswordVerifyRequest): Promise<ForgotPasswordVerifyResponse> {
    console.log("\n================== [API FORGOT PASSWORD - VERIFY & RESET] ==================");
    console.log("[forgotPasswordService] Request URL: POST /api/auth/forgot/verify");
    console.log("[forgotPasswordService] Request payload:", JSON.stringify(data, null, 2));
    try {
      const response = await apiClient.post<ForgotPasswordVerifyResponse>("/api/auth/forgot/verify", data);
      console.log("[forgotPasswordService] Response status:", response.status);
      console.log("[forgotPasswordService] Response data:", JSON.stringify(response.data, null, 2));
      console.log("============================================================================\n");
      return response.data;
    } catch (error: any) {
      console.error("[forgotPasswordService] VERIFY & RESET ERROR:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        config: {
          url: error?.config?.url,
          baseURL: error?.config?.baseURL,
          method: error?.config?.method,
          data: error?.config?.data,
        },
      });
      console.log("============================================================================\n");
      throw error;
    }
  },
};
