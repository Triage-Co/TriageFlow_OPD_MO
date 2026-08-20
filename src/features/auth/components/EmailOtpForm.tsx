import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useOtpLogin } from "@/features/auth/hooks/useOtpLogin";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { validateEmailField } from "@/shared/utils/validation.utils";

export function EmailOtpForm() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useOtpLogin();
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
