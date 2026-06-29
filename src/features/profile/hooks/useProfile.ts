import { useAuthContext } from "@/features/auth/context/AuthContext";
import { UserProfile } from "@/features/auth/types/auth.types";
import { profileService } from "@/features/profile/services/profile.service";
import { UpdateProfileRequest } from "@/features/profile/types/profile.types";
import { useCallback, useState } from "react";

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const { updateUser } = useAuthContext();

  const clearError = useCallback(() => setError(null), []);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await profileService.getProfile();
      if (response.status === "success" || response.code === 200) {
        const apiData = response.data;
        const mappedData: UserProfile = {
          id: apiData.id,
          full_name: apiData.full_name || "",
          // Phản hồi trả về ngày sinh có thể bao gồm giờ, cần lấy YYYY-MM-DD
          dob: apiData.dob ? apiData.dob.split("T")[0] : "",
          gender: apiData.gender,
          citizen_id: apiData.citizen_id,
          phone: apiData.phone || "",
          email: apiData.email,
          role: apiData.role,
          createdAt: apiData.createdAt,
          updatedAt: apiData.updatedAt,
        };
        setProfileData(mappedData);

        // Đồng bộ thông tin mới nhất vào Auth Context
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
        // Đồng bộ dữ liệu state cục bộ
        setProfileData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...data,
            full_name: data.full_name || prev.full_name,
            phone: data.phone ?? prev.phone,
          };
        });

        // Đồng bộ dữ liệu sang Auth Context để hiển thị ở các màn hình khác
        updateUser({
          full_name: data.full_name,
          dob: data.dob,
          gender: data.gender,
          phone: data.phone,
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

  return {
    isLoading,
    isUpdating,
    error,
    profileData,
    clearError,
    fetchProfile,
    editProfile,
  };
}
