import apiClient from "@/shared/services/api-client";
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
} from "@/features/auth/types/auth.types";

export const forgotPasswordService = {
  /**
   * Gửi mã OTP lấy lại mật khẩu
   * POST /api/auth/forgot
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>("/api/auth/forgot", data);
    return response.data;
  },

  /**
   * Xác thực mã OTP và cập nhật mật khẩu mới
   * POST /api/auth/forgot/verify
   */
  async verifyForgotPassword(data: ForgotPasswordVerifyRequest): Promise<ForgotPasswordVerifyResponse> {
    const response = await apiClient.post<ForgotPasswordVerifyResponse>("/api/auth/forgot/verify", data);
    return response.data;
  },
};
