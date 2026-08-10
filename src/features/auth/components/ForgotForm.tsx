import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { AppAlert } from "@/shared/utils/alert.utils";

export function ForgotForm() {
  const router = useRouter();
  const { sendForgotPasswordOtp, isLoading, error, clearError } = useForgotPassword();
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
    const success = await sendForgotPasswordOtp(email.trim());
    if (success) {
      AppAlert.info(
        "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
        "Thành công",
        () => {
          router.push({
            pathname: "/(auth)/forgot-verify",
            params: { email: email.trim() },
          });
        }
      );
    }
  };

  return (
    <FormScrollContainer>
      <AuthHeader
        title="Quên mật khẩu"
        subtitle="Nhập email của bạn để nhận mã OTP lấy lại mật khẩu"
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
