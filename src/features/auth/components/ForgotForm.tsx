import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { AppAlert } from "@/shared/utils/alert.utils";
import { validateEmailField } from "@/shared/utils/validation.utils";

export function ForgotForm() {
  const router = useRouter();
  const { sendForgotPasswordOtp, isLoading, error, clearError } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (emailError) setEmailError(undefined);
    if (error) clearError();
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmailField(email));
  };

  const handleSendOtp = async () => {
    const err = validateEmailField(email);
    if (err) {
      setEmailError(err);
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
          onChangeText={handleEmailChange}
          onBlur={handleEmailBlur}
          error={emailError}
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
