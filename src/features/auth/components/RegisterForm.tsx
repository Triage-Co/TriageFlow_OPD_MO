import { useRegister } from "@/features/auth/hooks/useRegister";
import type { Gender } from "@/features/auth/types/auth.types";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { GenderToggle } from "@/shared/components/GenderToggle";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { AppAlert } from "@/shared/utils/alert.utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function RegisterForm() {
  const router = useRouter();
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
      showGlobalToast("Vui lòng điền đầy đủ các trường bắt buộc.", "error");
      return;
    }

    if (password.length < 6) {
      showGlobalToast("Mật khẩu phải có ít nhất 6 ký tự.", "error");
      return;
    }

    const success = await register({
      email: email.trim(),
      user_name: userName.trim(),
      gender: gender as Gender,
      phone: phone.trim(),
      password,
    });

    if (success) {
      AppAlert.info(
        "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
        "Đăng ký thành công",
        () => {
          router.replace("/(auth)/login");
        }
      );
    }
  };

  return (
    <FormScrollContainer>
      <AuthHeader
        title="Tạo tài khoản"
        subtitle="Đăng ký để sử dụng đầy đủ tính năng"
        showBackButton
      />
      <View className="px-6 pt-6 pb-8">
        <FormErrorBanner error={error} />

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

        <GenderToggle
          value={form.gender}
          onChange={(gender) => {
            setForm((p) => ({ ...p, gender }));
            if (error) clearError();
          }}
        />

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

        <View className="flex-row justify-center items-center mt-[18px]">
          <Text className="text-neutral-400 text-xs">Đã có tài khoản? </Text>
          <Pressable className="active:opacity-70" onPress={() => router.push("/(auth)/login")}>
            <Text className="text-primary font-semibold text-xs">Đăng nhập</Text>
          </Pressable>
        </View>
      </View>
    </FormScrollContainer>
  );
}
