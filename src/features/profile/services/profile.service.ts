import apiClient from "@/shared/services/api-client";
import {
  UserProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "@/features/profile/types/profile.types";

export const profileService = {
  /**
   * Lấy thông tin chi tiết hồ sơ bệnh nhân
   * GET /api/auth/profile
   */
  async getProfile(): Promise<UserProfileResponse> {
    const response = await apiClient.get<UserProfileResponse>("/api/auth/profile");
    return response.data;
  },

  /**
   * Cập nhật thông tin hồ sơ
   * PATCH /api/auth/update
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await apiClient.patch<UpdateProfileResponse>("/api/auth/update", data);
    return response.data;
  },
};
