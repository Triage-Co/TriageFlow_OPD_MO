import { useRegister } from "@/features/auth/hooks/useRegister";
import type { Gender } from "@/features/auth/types/auth.types";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
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
 * UI theo Figma: back arrow, header card primary, form đầy đủ theo API mới nhất
 * Fields: email, userName, gender, phone, password
 */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useRegister();

  const [form, setForm] = useState({
    email: "",
    userName: "",
    gender: "" as Gender | "",
    phone: "",
    password: "",
  });

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleRegister = async () => {
    const { email, userName, gender, phone, password } = form;

    if (!email.trim() || !userName.trim() || !gender || !phone.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    const success = await register({
      email: email.trim(),
      user_name: userName.trim(),
      gender: gender as Gender,
      phone: phone.trim(),
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
              placeholder="Tên người dùng"
              value={form.userName}
              onChangeText={update("userName")}
              autoCapitalize="none"
            />

            <AppInput
              placeholder="Email"
              value={form.email}
              onChangeText={update("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <AppInput
              placeholder="Số điện thoại"
              value={form.phone}
              onChangeText={update("phone")}
              keyboardType="phone-pad"
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

