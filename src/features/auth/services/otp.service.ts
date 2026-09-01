import apiClient from "@/shared/services/api-client";
import { OtpSendRequest, OtpVerifyLoginRequest, LoginResponse } from "@/features/auth/types/auth.types";

export const otpService = {
  
  async sendLoginOtp(data: OtpSendRequest): Promise<any> {
    const response = await apiClient.post<any>("/api/auth/otp/send", data);
    return response.data;
  },

  async verifyLoginOtp(data: OtpVerifyLoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/otp/verify", data);
    return response.data;
  },
};
