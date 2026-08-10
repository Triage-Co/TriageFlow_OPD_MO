import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useOtpLogin } from "@/features/auth/hooks/useOtpLogin";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { showGlobalToast } from "@/shared/components/ToastProvider";

export function EmailOtpForm() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useOtpLogin();
  const [email, setEmail] = useState("");

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showGlobalToast("Vui lòng nhập email.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showGlobalToast("Định dạng email không hợp lệ.", "error");
      return;
    }

    clearError();
    const success = await sendOtp(email.trim());
    if (success) {
      router.push({
        pathname: "/(auth)/otp",
        params: { email: email.trim(), mode: "otp-login" },
      });
    }
  };

  return (
    <FormScrollContainer>
      <AuthHeader
        title="Đăng nhập OTP"
        subtitle="Nhập email đăng ký để nhận mã xác minh OTP"
        showBackButton
      />
      <View className="px-6 pt-6 flex-1">
        <FormErrorBanner error={error} />

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
    </FormScrollContainer>
  );
}
