import { useAuthContext } from "@/features/auth/context/AuthContext";
import { UserProfile } from "@/features/auth/types/auth.types";
import { profileService } from "@/features/profile/services/profile.service";
import { UpdateProfileRequest } from "@/features/profile/types/profile.types";
import { avatarService } from "@/features/profile/services/avatar.service";
import { useCallback, useState } from "react";

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const { updateUser } = useAuthContext();

  const clearError = useCallback(() => setError(null), []);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await profileService.getProfile();
      console.log("[useProfile] fetchProfile response data:", JSON.stringify(response, null, 2));
      if (response.status === "success" || response.code === 200) {
        const apiData = response.data;
        const mappedData: UserProfile = {
          id: apiData.account_id || "",
          account_id: apiData.account_id,
          avatar: apiData.avatar || "",
          full_name: apiData.user_name || "",
          dob: "",
          gender: apiData.gender,
          citizen_id: "",
          phone: apiData.phone || "",
          email: apiData.email,
          role: apiData.role,
          is_banned: apiData.is_banned,
          createdAt: apiData.createdAt,
          updatedAt: apiData.updatedAt,
        };
        setProfileData(mappedData);

        
        updateUser(mappedData);
        return mappedData;
      }
      setError(response.message || "Lấy thông tin hồ sơ thất bại.");
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lấy thông tin hồ sơ thất bại.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

  const editProfile = useCallback(async (data: UpdateProfileRequest): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await profileService.updateProfile(data);
      if (response.status === "success" || response.code === 200) {
        
        setProfileData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            full_name: data.user_name || prev.full_name,
            gender: data.gender || prev.gender,
            phone: data.phone ?? prev.phone,
            avatar: data.avatar ?? prev.avatar,
          };
        });

        
        updateUser({
          full_name: data.user_name,
          gender: data.gender,
          phone: data.phone,
          avatar: data.avatar,
        });
        return true;
      }
      setError(response.message || "Cập nhật hồ sơ thất bại.");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [updateUser]);

  const uploadAvatar = useCallback(async (localUri: string): Promise<string | null> => {
    setIsUploadingAvatar(true);
    setError(null);
    try {
      const url = await avatarService.uploadAvatar(localUri);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload ảnh thất bại.");
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  return {
    isLoading,
    isUpdating,
    isUploadingAvatar,
    error,
    profileData,
    clearError,
    fetchProfile,
    editProfile,
    uploadAvatar,
  };
}
