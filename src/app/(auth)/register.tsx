import { useRegister } from "@/features/auth/hooks/useRegister";
import type { Gender } from "@/features/auth/types/auth.types";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Register screen
 * UI theo Figma: back arrow, header card primary, form đầy đủ theo API
 * Fields: email, fullName, dob (YYYY-MM-DD), gender, citizen_id, password
 */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useRegister();

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    dob: "",        // YYYY-MM-DD – gửi lên API
    gender: "" as Gender | "",
    citizen_id: "",
    password: "",
  });

  // Date picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(2000, 0, 1));

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  /** Format Date → "YYYY-MM-DD" để gửi API */
  const toApiDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  /** Format Date → "DD/MM/YYYY" để hiển thị cho người dùng */
  const toDisplayDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) {
      setPickerDate(selected);
      setForm((prev) => ({ ...prev, dob: toApiDate(selected) }));
      if (error) clearError();
    }
  };

  const handleRegister = async () => {
    const { email, fullName, dob, gender, citizen_id, password } = form;

    if (!email.trim() || !fullName.trim() || !dob.trim() || !gender || !citizen_id.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (!dob) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày sinh.");
      return;
    }

    const success = await register({
      email: email.trim(),
      fullName: fullName.trim(),
      dob: dob.trim(),
      gender: gender as Gender,
      citizen_id: citizen_id.trim(),
      password,
      role: "USER",
    });

    if (success) {
      Alert.alert(
        "Đăng ký thành công",
        "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
        [{ text: "Đăng nhập ngay", onPress: () => router.replace("/(auth)/login") }]
      );
    }
  };

  return (
    <ScreenWrapper edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-primary rounded-b-[28px] px-6 pb-8" style={{ paddingTop: insets.top + 20 }}>
            <Pressable
              onPress={() => router.back()}
              className="mb-5 self-start active:opacity-70"
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Text className="text-[40px] text-white">←</Text>
            </Pressable>

            <Text className="text-[28px] font-extrabold text-white tracking-tight mb-1.5">
              Tạo tài khoản
            </Text>
            <Text className="text-[13px] text-white/80">
              Đăng ký để sử dụng đầy đủ tính năng
            </Text>
          </View>

          {/* ── Form ── */}
          <View className="px-6 pt-6 pb-8">
            {/* Error */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                <Text className="text-red-500 text-sm">{error}</Text>
              </View>
            ) : null}

            <AppInput
              placeholder="Họ và tên"
              value={form.fullName}
              onChangeText={update("fullName")}
              autoCapitalize="words"
            />

            <AppInput
              placeholder="Email"
              value={form.email}
              onChangeText={update("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {/* Ngày sinh – mở native date picker */}
            <Pressable
              className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-4 h-[52px] mb-3.5 active:opacity-75"
              onPress={() => setShowPicker(true)}
            >
              <Text
                className={
                  form.dob
                    ? "flex-1 text-sm text-neutral-700"
                    : "flex-1 text-sm text-neutral-400"
                }
              >
                {form.dob ? toDisplayDate(pickerDate) : "Ngày sinh"}
              </Text>
              <Text className="text-base text-neutral-400">📅</Text>
            </Pressable>

            {/* Native date picker */}
            {showPicker && (
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
                    className="self-end px-5 py-2.5 mt-1 mb-2 active:opacity-70"
                    onPress={() => setShowPicker(false)}
                  >
                    <Text className="text-primary font-semibold text-base">Chọn</Text>
                  </Pressable>
                )}
              </View>
            )}

            <AppInput
              placeholder="Số CCCD"
              value={form.citizen_id}
              onChangeText={update("citizen_id")}
              keyboardType="numeric"
            />

            {/* Giới tính – 2 nút toggle */}
            <View className="flex-row gap-3 mb-3.5">
              <Pressable
                className={
                  form.gender === "MALE"
                    ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                    : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
                }
                onPress={() => {
                  setForm((p) => ({ ...p, gender: "MALE" }));
                  if (error) clearError();
                }}
              >
                <Text
                  className={
                    form.gender === "MALE"
                      ? "text-primary font-bold text-sm"
                      : "text-neutral-400 font-medium text-sm"
                  }
                >
                  Nam
                </Text>
              </Pressable>
              <Pressable
                className={
                  form.gender === "FEMALE"
                    ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                    : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
                }
                onPress={() => {
                  setForm((p) => ({ ...p, gender: "FEMALE" }));
                  if (error) clearError();
                }}
              >
                <Text
                  className={
                    form.gender === "FEMALE"
                      ? "text-primary font-bold text-sm"
                      : "text-neutral-400 font-medium text-sm"
                  }
                >
                  Nữ
                </Text>
              </Pressable>
            </View>

            <AppInput
              placeholder="Mật khẩu"
              value={form.password}
              onChangeText={update("password")}
              secureTextEntry
            />

            <View className="mt-1.5">
              <AppButton
                title="Đăng ký"
                variant="primary"
                isLoading={isLoading}
                onPress={handleRegister}
              />
            </View>

            {/* Login link */}
            <View className="flex-row justify-center items-center mt-[18px]">
              <Text className="text-neutral-400 text-xs">Đã có tài khoản? </Text>
              <Pressable className="active:opacity-70" onPress={() => router.push("/(auth)/login")}>
                <Text className="text-primary font-semibold text-xs">Đăng nhập</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

