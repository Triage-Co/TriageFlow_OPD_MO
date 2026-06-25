import { useAuthContext } from "@/features/auth/context/AuthContext";
import type { Gender } from "@/features/auth/types/auth.types";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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

/**
 * Personal Info screen – Thông tin cá nhân chi tiết
 * Hiển thị toàn bộ thông tin hồ sơ bệnh nhân từ API, cho phép chỉnh sửa họ tên, ngày sinh, giới tính
 */
export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { fetchProfile, editProfile, isLoading, isUpdating, error, clearError } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [gender, setGender] = useState<Gender | "">("");

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(2000, 0, 1));

  // Tải dữ liệu hồ sơ từ API khi mở màn hình
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await fetchProfile();
      if (profile) {
        setFullName(profile.fullName);
        setDob(profile.dob || "");
        setGender((profile.gender as Gender) || "");
        
        if (profile.dob) {
          const parts = profile.dob.split("-");
          if (parts.length === 3) {
            setPickerDate(
              new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            );
          }
        }
      }
    };
    loadProfile();
  }, [fetchProfile]);

  /** Khởi động dữ liệu chỉnh sửa khi bật chế độ edit */
  const handleStartEditing = () => {
    // Ưu tiên dữ liệu hiển thị lấy từ user context (nếu API chưa tải xong hoặc fallback)
    const currentProfile = user;
    if (currentProfile) {
      setFullName(currentProfile.fullName);
      setDob(currentProfile.dob || "");
      setGender((currentProfile.gender as Gender) || "");

      if (currentProfile.dob) {
        const parts = currentProfile.dob.split("-");
        if (parts.length === 3) {
          setPickerDate(
            new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
          );
        }
      }
    }
    clearError();
    setIsEditing(true);
  };

  /** Hủy bỏ quá trình chỉnh sửa */
  const handleCancelEditing = () => {
    setIsEditing(false);
    clearError();
  };

  /** Format Date → "YYYY-MM-DD" */
  const toApiDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  /** Format Date → "DD/MM/YYYY" */
  const toDisplayDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) {
      setPickerDate(selected);
      setDob(toApiDate(selected));
    }
  };

  /** Xử lý cập nhật thông tin qua API */
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên.");
      return;
    }
    if (!dob) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày sinh.");
      return;
    }
    if (!gender) {
      Alert.alert("Thông báo", "Vui lòng chọn giới tính.");
      return;
    }

    const success = await editProfile({
      fullName: fullName.trim(),
      dob,
      gender: gender as Gender,
    });

    if (success) {
      Alert.alert("Thành công", "Cập nhật thông tin hồ sơ thành công.");
      setIsEditing(false);
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

  /** Format ngày sinh từ YYYY-MM-DD sang dd/MM/yyyy */
  const formatDob = (dobString?: string) => {
    if (!dobString) return "—";
    try {
      const parts = dobString.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const date = new Date(dobString);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dobString;
    }
  };

  /** Map gender sang tiếng Việt */
  const formatGender = (genderVal?: string) => {
    if (!genderVal) return "—";
    if (genderVal === "MALE") return "Nam";
    if (genderVal === "FEMALE") return "Nữ";
    return genderVal;
  };

  /** Tạo mã BN từ user id (lấy 6 số cuối hoặc fallback) */
  const getPatientCode = (id?: string) => {
    if (!id) return "—";
    const numericPart = id.replace(/\D/g, "").slice(-7);
    return numericPart ? `BN${numericPart.padStart(6, "0")}` : `BN${id.slice(0, 6)}`;
  };

  // Trạng thái đang tải lần đầu và chưa có dữ liệu hiển thị
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
            <Text className="text-white text-[22px] font-extrabold tracking-tight mb-5">
              {isEditing ? "Chỉnh sửa thông tin" : "Thông tin cá nhân"}
            </Text>

            {/* ── Profile summary card ── */}
            <View className="bg-white/15 rounded-[20px] px-5 py-4">
              <View className="flex-row items-center gap-4">
                {/* Avatar */}
                <View className="bg-white w-[60px] h-[60px] rounded-2xl items-center justify-center">
                  <Text className="text-primary text-[22px] font-bold">
                    {getInitials(user?.fullName)}
                  </Text>
                </View>

                {/* Name + badge + ID */}
                <View className="flex-1">
                  <Text className="text-white text-[18px] font-bold">
                    {user?.fullName ?? "Bệnh nhân"}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1.5">
                    <View className="bg-white/25 rounded-full px-2.5 py-0.5">
                      <Text className="text-white text-[10px] font-semibold">
                        Bệnh nhân
                      </Text>
                    </View>
                    <Text className="text-white/70 text-[11px] font-medium">
                      ID: {getPatientCode(user?.id)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Phone + Email row */}
              <View className="flex-row items-center mt-4 pt-3 border-t border-white/15">
                <View className="flex-1 flex-row items-center gap-1.5">
                  <SymbolView
                    name={{ ios: "phone", android: "phone" }}
                    size={13}
                    tintColor="rgba(255,255,255,0.7)"
                  />
                  <Text className="text-white/80 text-[12px] font-medium">
                    {user?.phone ?? "—"}
                  </Text>
                </View>
                <View className="flex-1 flex-row items-center gap-1.5 justify-end">
                  <SymbolView
                    name={{ ios: "envelope", android: "mail" }}
                    size={13}
                    tintColor="rgba(255,255,255,0.7)"
                  />
                  <Text
                    className="text-white/80 text-[12px] font-medium"
                    numberOfLines={1}
                  >
                    {user?.email ?? "—"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Form thông tin chi tiết ── */}
          <View className="mx-5 mt-5 bg-white rounded-[20px] p-5 shadow shadow-black/5">
            <Text className="text-gray-800 text-[16px] font-bold mb-4">
              {isEditing ? "Nhập thông tin mới" : "Thông tin chi tiết"}
            </Text>

            {isEditing ? (
              // ── Giao diện Chỉnh sửa ──
              <View className="gap-3">
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
                    <Text className="text-red-500 text-xs">{error}</Text>
                  </View>
                ) : null}

                {/* Họ và tên input */}
                <View>
                  <Text className="text-gray-500 text-xs font-semibold mb-1.5 ml-1">
                    Họ và tên
                  </Text>
                  <AppInput
                    placeholder="Họ và tên của bạn"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (error) clearError();
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* Ngày sinh input */}
                <View className="mb-2">
                  <Text className="text-gray-500 text-xs font-semibold mb-1.5 ml-1">
                    Ngày sinh
                  </Text>
                  <Pressable
                    className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-4 h-[52px] active:opacity-75"
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text className={dob ? "flex-1 text-sm text-gray-800" : "flex-1 text-sm text-neutral-400"}>
                      {dob ? toDisplayDate(pickerDate) : "Chọn ngày sinh"}
                    </Text>
                    <Text className="text-base text-neutral-400">📅</Text>
                  </Pressable>

                  {showDatePicker && (
                    <View>
                      <DateTimePicker
                        value={pickerDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        onChange={onDateChange}
                        locale="vi"
                      />
                      {Platform.OS === "ios" && (
                        <Pressable
                          className="self-end px-5 py-2 mt-1 mb-2 active:opacity-70"
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text className="text-primary font-semibold text-base">Chọn</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {/* Giới tính input */}
                <View className="mb-4">
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

                {/* Nút lưu thay đổi */}
                <AppButton
                  title="Lưu thay đổi"
                  variant="primary"
                  isLoading={isUpdating}
                  onPress={handleSaveProfile}
                />
              </View>
            ) : (
              // ── Giao diện Xem thông tin (Nguyên bản Figma) ──
              <View>
                {/* Họ và tên */}
                <DetailField
                  iconName={{ ios: "person", android: "person" }}
                  label="Họ và tên"
                  value={user?.fullName ?? "—"}
                />

                {/* Ngày sinh + Giới tính (2 cột) */}
                <View className="flex-row gap-3 mt-3">
                  <View className="flex-1">
                    <DetailField
                      iconName={{ ios: "calendar", android: "calendar_today" }}
                      label="Ngày sinh"
                      value={formatDob(user?.dob)}
                    />
                  </View>
                  <View className="flex-1">
                    <DetailField
                      iconName={{ ios: "person.2", android: "group" }}
                      label="Giới tính"
                      value={formatGender(user?.gender)}
                    />
                  </View>
                </View>

                {/* CCCD/CMND */}
                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "creditcard", android: "badge" }}
                    label="CCCD/CMND"
                    value={user?.citizen_id ?? "—"}
                  />
                </View>

                {/* Số điện thoại */}
                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "phone", android: "phone" }}
                    label="Số điện thoại"
                    value={user?.phone ?? "—"}
                  />
                </View>

                {/* Email */}
                <View className="mt-3">
                  <DetailField
                    iconName={{ ios: "envelope", android: "mail" }}
                    label="Email"
                    value={user?.email ?? "—"}
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
