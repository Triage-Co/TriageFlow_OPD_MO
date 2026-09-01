import { useLogin } from "@/features/auth/hooks/useLogin";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { validateEmailField } from "@/shared/utils/validation.utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
    if (error) clearError();
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
    if (error) clearError();
  };

  const handleEmailBlur = () => {
    const err = validateEmailField(email);
    setFieldErrors((prev) => ({ ...prev, email: err }));
  };

  const handlePasswordBlur = () => {
    const err = !password.trim() ? "Vui lòng nhập mật khẩu." : undefined;
    setFieldErrors((prev) => ({ ...prev, password: err }));
  };

  const handleLogin = async () => {
    const emailErr = validateEmailField(email);
    const passwordErr = !password.trim() ? "Vui lòng nhập mật khẩu." : undefined;

    const nextErrors: { email?: string; password?: string } = {};
    if (emailErr) nextErrors.email = emailErr;
    if (passwordErr) nextErrors.password = passwordErr;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    clearError();
    const success = await login({ email: email.trim(), password });
    if (success) {
      router.replace("/(patient)/(tabs)/home");
    }
  };

  return (
    <FormScrollContainer>
      <AuthHeader
        title="Chào mừng"
        subtitle="Đăng nhập để tiếp tục"
        showLogo
      />

      <View className="px-6 pt-6 flex-1">
        <FormErrorBanner error={error} />

        <AppInput
          placeholder="Email của bạn"
          value={email}
          onChangeText={handleEmailChange}
          onBlur={handleEmailBlur}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
        />

        <AppInput
          placeholder="Mật khẩu"
          value={password}
          onChangeText={handlePasswordChange}
          onBlur={handlePasswordBlur}
          error={fieldErrors.password}
          secureTextEntry
        />

        <View className="mt-1.5">
          <AppButton
            title="Đăng nhập"
            variant="primary"
            isLoading={isLoading}
            onPress={handleLogin}
          />
        </View>

        <View className="mt-3">
          <AppButton
            title="Đăng nhập bằng mã OTP qua Email"
            variant="primary"
            onPress={() => router.push("/(auth)/email-otp")}
          />
        </View>

        <Pressable
          onPress={() => router.push("/(auth)/forgot")}
          className="self-end mt-3.5 mb-2.5 active:opacity-70"
        >
          <Text className="text-primary text-xs">Quên mật khẩu?</Text>
        </Pressable>

        <View className="flex-row items-center my-5">
          <View className="flex-1 h-[1px] bg-neutral-200" />
          <Text className="mx-3.5 text-neutral-400 text-xs">hoặc</Text>
          <View className="flex-1 h-[1px] bg-neutral-200" />
        </View>

        <View className="flex-row justify-center items-center pb-8">
          <Text className="text-neutral-400 text-xs">Chưa có tài khoản? </Text>
          <Pressable className="active:opacity-70" onPress={() => router.push("/(auth)/register")}>
            <Text className="text-primary font-semibold text-xs">Đăng ký ngay</Text>
          </Pressable>
        </View>
      </View>
    </FormScrollContainer>
  );
}
