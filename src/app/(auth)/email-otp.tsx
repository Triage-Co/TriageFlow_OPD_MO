import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useOtpLogin } from "@/features/auth/hooks/useOtpLogin";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";

/**
 * Screen nhập Email để nhận OTP đăng nhập
 */
export default function EmailOtpScreen() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useOtpLogin();
  const [email, setEmail] = useState("");

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email.");
      return;
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Thông báo", "Định dạng email không hợp lệ.");
      return;
    }

    clearError();
    const success = await sendOtp(email.trim());
    if (success) {
      // Navigate sang màn otp.tsx kèm email và mode
      router.push({
        pathname: "/(auth)/otp",
        params: { email: email.trim(), mode: "otp-login" },
      });
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header card màu primary ── */}
          <View className="bg-primary rounded-b-[28px] px-6 pt-5 pb-8">
            <Pressable
              onPress={() => router.back()}
              className="mb-5 self-start active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text className="text-2xl text-white">←</Text>
            </Pressable>

            <Text className="text-[28px] font-extrabold text-white tracking-tight mb-1.5">
              Đăng nhập OTP
            </Text>
            <Text className="text-[13px] text-white/80">
              Nhập email đăng ký để nhận mã xác minh OTP
            </Text>
          </View>

          {/* ── Form area ── */}
          <View className="px-6 pt-6 flex-1">
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-500 text-sm">{error}</Text>
              </View>
            ) : null}

            <AppInput
              placeholder="Nhập email của bạn"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) clearError();
              }}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />

            <View className="mt-2.5">
              <AppButton
                title="Gửi mã OTP"
                variant="primary"
                isLoading={isLoading}
                onPress={handleSendOtp}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

