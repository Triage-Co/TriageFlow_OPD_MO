import { useLogin } from "@/features/auth/hooks/useLogin";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showGlobalToast("Vui lòng nhập đầy đủ thông tin.", "error");
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
          onChangeText={(v) => {
            setEmail(v);
            if (error) clearError();
          }}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
        />

        <AppInput
          placeholder="Mật khẩu"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) clearError();
          }}
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
