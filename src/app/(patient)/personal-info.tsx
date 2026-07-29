import { useAuthContext } from "@/features/auth/context/AuthContext";
import type { Gender } from "@/features/auth/types/auth.types";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

/**
 * Personal Info screen – Thông tin cá nhân chi tiết
 * Hiển thị toàn bộ thông tin hồ sơ bệnh nhân từ API, cho phép chỉnh sửa tên người dùng, giới tính, số điện thoại, avatar
 */
export default function PersonalInfoScreen() {
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

  /** Khởi động dữ liệu chỉnh sửa khi bật chế độ edit */
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

  /** Hủy bỏ quá trình chỉnh sửa */
  const handleCancelEditing = () => {
    setIsEditing(false);
    setLocalAvatarUri(null);
    clearError();
  };

  /** Xử lý mở thư viện ảnh chọn Avatar */
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cho phép truy cập thư viện ảnh trong Cài đặt.");
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
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    }
  };

  /** Xử lý cập nhật thông tin qua API */
  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên người dùng.");
      return;
    }
    if (!gender) {
      Alert.alert("Thông báo", "Vui lòng chọn giới tính.");
      return;
    }
    if (phone.trim() && !/^[0-9]{10,11}$/.test(phone.trim())) {
      Alert.alert("Thông báo", "Số điện thoại không hợp lệ (phải gồm 10-11 chữ số).");
      return;
    }

    const success = await editProfile({
      user_name: userName.trim(),
      gender: gender as Gender,
      phone: phone.trim() || undefined,
      avatar: avatar.trim() || undefined,
    });

    if (success) {
      Alert.alert("Thành công", "Cập nhật thông tin hồ sơ thành công.");
      setIsEditing(false);
      setLocalAvatarUri(null);
    } else {
      Alert.alert("Thất bại", error || "Cập nhật thông tin hồ sơ thất bại.");
    }
  };

  /** Trích xuất 2 chữ cái đầu in hoa */
  const getInitials = (name?: string) => {
    if (!name) return "BN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  /** Map gender sang tiếng Việt */
  const formatGender = (genderVal?: string) => {
    if (!genderVal) return "—";
    if (genderVal === "MALE") return "Nam";
    if (genderVal === "FEMALE") return "Nữ";
    return genderVal;
  };

  
  if (isLoading && !user) {
    return (
      <ScreenWrapper edges={["left", "right"]}>
        <StatusBar style="light" />
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#5B9BD5" />
          <Text className="text-gray-500 text-sm mt-3 font-medium">
            Đang tải thông tin hồ sơ...
          </Text>
        </View>
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
          {/* ── Header xanh ── */}
          <View className="bg-primary px-5 pt-14 pb-6">
            {/* Top bar: Quay lại + Chỉnh sửa / Hủy */}
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={() => (isEditing ? handleCancelEditing() : router.back())}
                className="flex-row items-center gap-1 active:opacity-70 p-1"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <SymbolView
                  name={{ ios: "chevron.left", android: "arrow_back" }}
                  size={24}
                  tintColor="#FFFFFF"
                />
                <Text className="text-white text-[16px] font-medium">
                  {isEditing ? "Hủy" : "Quay lại"}
                </Text>
              </Pressable>

              {!isEditing && (
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
              )}
            </View>

            {/* Title */}
            <Text className="text-white text-[22px] font-extrabold tracking-tight mb-5 text-center">
              {isEditing ? "Chỉnh sửa thông tin" : "Thông tin cá nhân"}
            </Text>

            {/* ── Profile summary card ── */}
            <View className="items-center py-2">
              {isEditing ? (
                <Pressable
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                  className="items-center"
                >
                  <View className="bg-white w-[90px] h-[90px] rounded-full items-center justify-center overflow-hidden shadow-sm relative">
                    {/* Render local preview if exists, otherwise current avatar URL, otherwise initials */}
                    {localAvatarUri ? (
                      <Image
                        source={{ uri: localAvatarUri }}
                        style={{ width: 90, height: 90 }}
                        contentFit="cover"
                        onError={(e) => console.error("[PersonalInfoScreen] Edit mode preview local localAvatarUri load error:", e.error)}
                      />
                    ) : avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={{ width: 90, height: 90 }}
                        contentFit="cover"
                        onError={(e) => console.error("[PersonalInfoScreen] Edit mode preview avatar load error:", e.error)}
                      />
                    ) : (
                      <Text className="text-primary text-[28px] font-bold">
                        {getInitials(userName)}
                      </Text>
                    )}

                    {/* Loading overlay khi đang upload */}
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
                      onError={(e) => console.error("[PersonalInfoScreen] View mode user.avatar load error:", e.error)}
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

          {/* ── Form thông tin chi tiết ── */}
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

                {/* Tên người dùng input */}
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

                {/* Giới tính input */}
                <View className="mb-1">
                  <Text className="text-gray-500 text-xs font-semibold mb-1.5 ml-1">
                    Giới tính
                  </Text>
                  <View className="flex-row gap-3">
                    <Pressable
                      className={
                        gender === "MALE"
                          ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                          : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
                      }
                      onPress={() => {
                        setGender("MALE");
                        if (error) clearError();
                      }}
                    >
                      <Text className={gender === "MALE" ? "text-primary font-bold text-sm" : "text-neutral-400 font-medium text-sm"}>
                        Nam
                      </Text>
                    </Pressable>
                    <Pressable
                      className={
                        gender === "FEMALE"
                          ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                          : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
                      }
                      onPress={() => {
                        setGender("FEMALE");
                        if (error) clearError();
                      }}
                    >
                      <Text className={gender === "FEMALE" ? "text-primary font-bold text-sm" : "text-neutral-400 font-medium text-sm"}>
                        Nữ
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Số điện thoại input */}
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

                {/* Nút lưu thay đổi */}
                <AppButton
                  title="Lưu thay đổi"
                  variant="primary"
                  isLoading={isUpdating || isUploadingAvatar}
                  disabled={isUploadingAvatar}
                  onPress={handleSaveProfile}
                />
              </View>
            ) : (
              // ── Giao diện Xem thông tin (Nguyên bản Figma) ──
              <View>
                {/* Tên người dùng */}
                <DetailField
                  iconName={{ ios: "person", android: "person" }}
                  label="Tên người dùng"
                  value={user?.full_name ?? "—"}
                />

                {/* Giới tính */}
                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "person.2", android: "group" }}
                    label="Giới tính"
                    value={formatGender(user?.gender)}
                  />
                </View>

                {/* Số điện thoại */}
                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "phone", android: "phone" }}
                    label="Số điện thoại"
                    value={user?.phone || "—"}
                  />
                </View>

                {/* Email */}
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

          {/* Bottom spacing */}
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

/** ── Detail field component ── */
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
