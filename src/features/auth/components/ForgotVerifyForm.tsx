import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { AppAlert } from "@/shared/utils/alert.utils";

const RESEND_COUNTDOWN = 60;

export function ForgotVerifyForm() {
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
      showGlobalToast("Mã OTP mới đã được gửi thành công.", "success");
      setCountdown(RESEND_COUNTDOWN);
      setOtp("");
    }
  }, [canResend, email, sendForgotPasswordOtp, clearError]);

  const handleVerifyAndReset = async () => {
    if (!email) {
      showGlobalToast("Không tìm thấy thông tin email.", "error");
      return;
    }

    if (!otp.trim() || !password.trim() || !confirmPassword.trim()) {
      showGlobalToast("Vui lòng điền đầy đủ các thông tin.", "error");
      return;
    }

    if (otp.trim().length !== 8) {
      showGlobalToast("Mã OTP phải có độ dài đúng 8 chữ số.", "error");
      return;
    }

    if (password.length < 6) {
      showGlobalToast("Mật khẩu mới phải có ít nhất 6 ký tự.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showGlobalToast("Mật khẩu xác nhận không khớp.", "error");
      return;
    }

    clearError();
    const success = await verifyForgotPasswordOtp(email, otp.trim(), password);
    if (success) {
      AppAlert.info(
        "Lấy lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
        "Thành công",
        () => {
          router.replace("/(auth)/login");
        }
      );
    }
  };

  return (
    <FormScrollContainer>
      <AuthHeader
        title="Xác thực OTP"
        subtitle={`Nhập mã OTP được gửi tới ${email} để thay đổi mật khẩu`}
        showBackButton
      />

      <View className="px-6 pt-6 flex-1">
        <FormErrorBanner error={error} />

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

        <View className="flex-row justify-between items-center mb-6 px-1">
          <Pressable
            onPress={handleResendOtp}
            disabled={!canResend || isLoading}
            className={canResend ? "active:opacity-70" : ""}
          >
            <Text
              className={`text-sm font-semibold ${canResend ? "text-primary" : "text-gray-400"
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
    </FormScrollContainer>
  );
}
