import { Colors } from "@/config/colors";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import type { Gender } from "@/features/auth/types/auth.types";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { LoadingView } from "@/shared/components/LoadingView";
import { GenderToggle } from "@/shared/components/GenderToggle";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { AppAlert } from "@/shared/utils/alert.utils";
import { getInitials, formatGenderLabel } from "@/shared/utils/string.utils";
import { isValidVietnamesePhone } from "@/shared/utils/validation.utils";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

export function UserProfileView() {
  const router = useRouter();
  const { user } = useAuthContext();
  const {
    fetchProfile,
    editProfile,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    error,
    clearError,
    uploadAvatar,
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await fetchProfile();
      if (profile) {
        setUserName(profile.full_name);
        setGender((profile.gender as Gender) || "");
        setPhone(profile.phone || "");
        setAvatar(profile.avatar || "");
      }
    };
    loadProfile();
  }, [fetchProfile]);

  const handleStartEditing = () => {
    const currentProfile = user;
    if (currentProfile) {
      setUserName(currentProfile.full_name);
      setGender((currentProfile.gender as Gender) || "");
      setPhone(currentProfile.phone || "");
      setAvatar(currentProfile.avatar || "");
      setLocalAvatarUri(null); 
    }
    clearError();
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setLocalAvatarUri(null);
    clearError();
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      AppAlert.info("Vui lòng cho phép truy cập thư viện ảnh trong Cài đặt.", "Cần quyền truy cập");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setLocalAvatarUri(localUri); 

    const uploadedUrl = await uploadAvatar(localUri);
    if (uploadedUrl) {
      setAvatar(uploadedUrl); 
    } else {
      setLocalAvatarUri(null); 
    }
  };

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      AppAlert.info("Vui lòng nhập tên người dùng.");
      return;
    }
    if (!gender) {
      AppAlert.info("Vui lòng chọn giới tính.");
      return;
    }
    if (phone.trim() && !isValidVietnamesePhone(phone)) {
      AppAlert.info("Số điện thoại không hợp lệ (10 chữ số).");
      return;
    }

    const success = await editProfile({
      user_name: userName.trim(),
      gender: gender as Gender,
      phone: phone.trim() || undefined,
      avatar: avatar.trim() || undefined,
    });

    if (success) {
      showGlobalToast("Cập nhật thông tin hồ sơ thành công.", "success");
      setIsEditing(false);
      setLocalAvatarUri(null);
    }
  };

  if (isLoading && !user) {
    return (
      <ScreenWrapper edges={["left", "right"]}>
        <StatusBar style="light" />
        <LoadingView message="Đang tải thông tin hồ sơ..." color={Colors.primary} className="flex-1 items-center justify-center bg-gray-50" />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          
          <ScreenHeader
            title={isEditing ? "Chỉnh sửa thông tin" : "Thông tin cá nhân"}
            backText={isEditing ? "Hủy" : "Quay lại"}
            onBack={() => (isEditing ? handleCancelEditing() : router.back())}
            rightElement={
              !isEditing ? (
                <Pressable
                  onPress={handleStartEditing}
                  className="flex-row items-center gap-1.5 bg-white/20 rounded-full px-3.5 py-1.5 active:opacity-70"
                >
                  <SymbolView
                    name={{ ios: "pencil", android: "edit" }}
                    size={13}
                    tintColor="#FFFFFF"
                  />
                  <Text className="text-white text-[12px] font-semibold">
                    Chỉnh sửa
                  </Text>
                </Pressable>
              ) : undefined
            }
          />

          <View className="bg-primary px-5 pb-6">
            
            <View className="items-center py-2">
              {isEditing ? (
                <Pressable
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                  className="items-center"
                >
                  <View className="bg-white w-[90px] h-[90px] rounded-full items-center justify-center overflow-hidden shadow-sm relative">
                    {localAvatarUri ? (
                      <Image
                        source={{ uri: localAvatarUri }}
                        style={{ width: 90, height: 90 }}
                        contentFit="cover"
                      />
                    ) : avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={{ width: 90, height: 90 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text className="text-primary text-[28px] font-bold">
                        {getInitials(userName)}
                      </Text>
                    )}

                    {isUploadingAvatar && (
                      <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text className="text-white/80 text-[11px] font-semibold mt-2.5 flex-row items-center gap-1 active:opacity-75">
                    📷 Chạm để thay ảnh đại diện
                  </Text>
                </Pressable>
              ) : (
                <View className="bg-white w-[90px] h-[90px] rounded-full items-center justify-center overflow-hidden shadow-sm">
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={{ width: 90, height: 90 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="text-primary text-[28px] font-bold">
                      {getInitials(user?.full_name)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <View className="mx-5 mt-5 bg-white rounded-[20px] p-5 shadow shadow-black/5">
            <Text className="text-gray-800 text-[16px] font-bold mb-4">
              {isEditing ? "Nhập thông tin mới" : "Thông tin chi tiết"}
            </Text>

            {isEditing ? (
              <View className="gap-3">
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
                    <Text className="text-red-500 text-xs">{error}</Text>
                  </View>
                ) : null}

                <View>
                  <Text className="text-gray-500 text-xs font-semibold mb-1.5 ml-1">
                    Tên người dùng
                  </Text>
                  <AppInput
                    placeholder="Tên người dùng của bạn"
                    value={userName}
                    onChangeText={(text) => {
                      setUserName(text);
                      if (error) clearError();
                    }}
                    autoCapitalize="words"
                  />
                </View>

                <View className="mb-1">
                  <Text className="text-gray-500 text-xs font-semibold mb-1.5 ml-1">
                    Giới tính
                  </Text>
                  <GenderToggle
                    value={gender}
                    onChange={(g) => {
                      setGender(g);
                      if (error) clearError();
                    }}
                    className="mb-1"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-gray-500 text-xs font-semibold mb-1.5 ml-1">
                    Số điện thoại
                  </Text>
                  <AppInput
                    placeholder="Số điện thoại của bạn"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (error) clearError();
                    }}
                    keyboardType="phone-pad"
                  />
                </View>

                <AppButton
                  title="Lưu thay đổi"
                  variant="primary"
                  isLoading={isUpdating || isUploadingAvatar}
                  disabled={isUploadingAvatar}
                  onPress={handleSaveProfile}
                />
              </View>
            ) : (
              <View>
                
                <DetailField
                  iconName={{ ios: "person", android: "person" }}
                  label="Tên người dùng"
                  value={user?.full_name ?? "—"}
                />

                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "person.2", android: "group" }}
                    label="Giới tính"
                    value={formatGenderLabel(user?.gender)}
                  />
                </View>

                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "phone", android: "phone" }}
                    label="Số điện thoại"
                    value={user?.phone || "—"}
                  />
                </View>

                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "envelope", android: "mail" }}
                    label="Email"
                    value={user?.email || "—"}
                  />
                </View>
              </View>
            )}
          </View>

          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function DetailField({
  iconName,
  label,
  value,
}: {
  iconName: { ios: any; android: any };
  label: string;
  value: string;
}) {
  return (
    <View className="bg-[#F5F7FB] rounded-[14px] px-4 py-3.5">
      <View className="flex-row items-center gap-2 mb-1">
        <SymbolView name={iconName} size={13} tintColor="#9CA3AF" />
        <Text className="text-gray-400 text-[11px] font-medium">{label}</Text>
      </View>
      <Text className="text-gray-800 text-[15px] font-semibold ml-0.5">
        {value}
      </Text>
    </View>
  );
}
