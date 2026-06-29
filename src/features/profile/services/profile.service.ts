import {
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfileResponse,
} from "@/features/profile/types/profile.types";
import apiClient from "@/shared/services/api-client";

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
    const payload = {
      full_name: data.full_name,
      dob: data.dob,
      gender: data.gender,
      phone: data.phone,
    };
    const response = await apiClient.patch<UpdateProfileResponse>("/api/auth/update", payload);
    return response.data;
  },
};
