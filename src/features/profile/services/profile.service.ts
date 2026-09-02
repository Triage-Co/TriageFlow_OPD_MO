import {
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfileResponse,
} from "@/features/profile/types/profile.types";
import apiClient from "@/shared/services/api-client";

export const profileService = {
  
  async getProfile(): Promise<UserProfileResponse> {
    const response = await apiClient.get<UserProfileResponse>("/api/auth/profile");
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const payload = {
      user_name: data.user_name,
      gender: data.gender,
      phone: data.phone,
      avatar: data.avatar,
    };
    const response = await apiClient.patch<UpdateProfileResponse>("/api/auth/update", payload);
    return response.data;
  },
};
