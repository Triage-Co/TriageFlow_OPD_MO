import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";

const RESEND_COUNTDOWN = 60;

/**
 * Screen nhập mã OTP và mật khẩu mới để hoàn tất đặt lại mật khẩu
 */
export default function ForgotVerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const {
    verifyForgotPasswordOtp,
    sendForgotPasswordOtp,
    isLoading,
    error,
    clearError,
  } = useForgotPassword();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const canResend = countdown <= 0;

  // Countdown timer cho nút gửi lại mã OTP
  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendOtp = useCallback(async () => {
    if (!canResend || !email) return;
    clearError();

    const success = await sendForgotPasswordOtp(email);
    if (success) {
      Alert.alert("Thông báo", "Mã OTP mới đã được gửi thành công.");
      setCountdown(RESEND_COUNTDOWN);
      setOtp("");
    }
  }, [canResend, email, sendForgotPasswordOtp, clearError]);

  const handleVerifyAndReset = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin email.");
      return;
    }

    if (!otp.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ các thông tin.");
      return;
    }

    if (otp.trim().length !== 8) {
      Alert.alert("Thông báo", "Mã OTP phải có độ dài đúng 8 chữ số.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu xác nhận không khớp.");
      return;
    }

    clearError();
    const success = await verifyForgotPasswordOtp(email, otp.trim(), password);
    if (success) {
      Alert.alert(
        "Thành công",
        "Lấy lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
        [
          {
            text: "Đăng nhập",
            onPress: () => {
              // Redirect về trang đăng nhập
              router.replace("/(auth)/login");
            },
          },
        ]
      );
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
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Text className="text-[40px] text-white">←</Text>
            </Pressable>

            <Text className="text-[28px] font-extrabold text-white tracking-tight mb-1.5">
              Xác thực OTP
            </Text>
            <Text className="text-[13px] text-white/80">
              Nhập mã OTP được gửi tới {email} để thay đổi mật khẩu
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
              label="Mã xác thực OTP (8 chữ số)"
              placeholder="Nhập 8 chữ số OTP"
              value={otp}
              onChangeText={(v) => {
                setOtp(v.replace(/[^0-9]/g, "").slice(0, 8));
                if (error) clearError();
              }}
              keyboardType="number-pad"
              maxLength={8}
            />

            <AppInput
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) clearError();
              }}
              secureTextEntry
            />

            <AppInput
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (error) clearError();
              }}
              secureTextEntry
            />

            {/* Resend OTP Row */}
            <View className="flex-row justify-between items-center mb-6 px-1">
              <Pressable
                onPress={handleResendOtp}
                disabled={!canResend || isLoading}
                className={canResend ? "active:opacity-70" : ""}
              >
                <Text
                  className={`text-sm font-semibold ${
                    canResend ? "text-primary" : "text-gray-400"
                  }`}
                >
                  Gửi lại mã OTP
                </Text>
              </Pressable>

              {!canResend ? (
                <Text className="text-gray-400 text-sm">
                  Gửi lại sau 0:{countdown.toString().padStart(2, "0")}
                </Text>
              ) : null}
            </View>

            <View className="mt-2.5 pb-8">
              <AppButton
                title="Đặt lại mật khẩu"
                variant="primary"
                isLoading={isLoading}
                onPress={handleVerifyAndReset}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
