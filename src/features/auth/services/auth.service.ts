import apiClient from "@/shared/services/api-client";
import {
  RegisterRequest,
  OtpVerifyRequest,
  ResendOtpRequest,
  LoginRequest,
  AuthResponse,
  UserProfile,
} from "@/features/auth/types/auth.types";

export const authService = {
  /**
   * Đăng ký tài khoản mới
   * POST /auth/register
   */
  async register(data: RegisterRequest): Promise<void> {
    await apiClient.post("/auth/register", data);
  },

  /**
   * Xác minh OTP sau đăng ký
   * POST /auth/verify-otp
   */
  async verifyOtp(data: OtpVerifyRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/verify-otp",
      data
    );
    return response.data;
  },

  /**
   * Gửi lại mã OTP
   * POST /auth/resend-otp
   */
  async resendOtp(data: ResendOtpRequest): Promise<void> {
    await apiClient.post("/auth/resend-otp", data);
  },

  /**
   * Đăng nhập
   * POST /auth/login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  /**
   * Đăng xuất
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  /**
   * Lấy thông tin user hiện tại
   * GET /auth/profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/auth/profile");
    return response.data;
  },
};
