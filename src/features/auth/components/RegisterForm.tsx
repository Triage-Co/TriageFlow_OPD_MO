import { useRegister } from "@/features/auth/hooks/useRegister";
import type { Gender } from "@/features/auth/types/auth.types";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { FormScrollContainer } from "@/shared/components/FormScrollContainer";
import { AuthHeader } from "@/shared/components/AuthHeader";
import { FormErrorBanner } from "@/shared/components/FormErrorBanner";
import { GenderToggle } from "@/shared/components/GenderToggle";
import { AppAlert } from "@/shared/utils/alert.utils";
import {
  validateConfirmPasswordField,
  validateEmailField,
  validatePasswordField,
  validatePhoneField,
  validateRequiredField,
} from "@/shared/utils/validation.utils";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export function RegisterForm() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { register, isLoading, error, clearError } = useRegister();

  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    gender: "" as Gender | "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) clearError();
  };

  const handleBlur = (field: keyof typeof form) => {
    let err: string | undefined;
    switch (field) {
      case "userName":
        err = validateRequiredField(form.userName, "tên người dùng");
        break;
      case "email":
        err = validateEmailField(form.email);
        break;
      case "phone":
        err = validatePhoneField(form.phone);
        break;
      case "password":
        err = validatePasswordField(form.password, 6);
        break;
      case "confirmPassword":
        err = validateConfirmPasswordField(form.password, form.confirmPassword);
        break;
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleRegister = async () => {
    const { email, userName, gender, phone, password, confirmPassword } = form;
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    const userNameErr = validateRequiredField(userName, "tên người dùng");
    if (userNameErr) nextErrors.userName = userNameErr;

    const emailErr = validateEmailField(email);
    if (emailErr) nextErrors.email = emailErr;

    const phoneErr = validatePhoneField(phone);
    if (phoneErr) nextErrors.phone = phoneErr;

    if (!gender) {
      nextErrors.gender = "Vui lòng chọn giới tính.";
    }

    const passwordErr = validatePasswordField(password, 6);
    if (passwordErr) nextErrors.password = passwordErr;

    const confirmErr = validateConfirmPasswordField(password, confirmPassword);
    if (confirmErr) nextErrors.confirmPassword = confirmErr;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    clearError();
    const success = await register({
      email: email.trim(),
      user_name: userName.trim(),
      gender: gender as Gender,
      phone: phone.trim(),
      password,
    });

    if (success) {
      AppAlert.info(
        "Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập.",
        "Đăng ký thành công",
        () => {
          router.replace("/(auth)/login");
        }
      );
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <FormScrollContainer ref={scrollRef}>
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
          onBlur={() => handleBlur("userName")}
          error={fieldErrors.userName}
          autoCapitalize="none"
        />

        <AppInput
          placeholder="Email"
          value={form.email}
          onChangeText={update("email")}
          onBlur={() => handleBlur("email")}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AppInput
          placeholder="Số điện thoại"
          value={form.phone}
          onChangeText={update("phone")}
          onBlur={() => handleBlur("phone")}
          error={fieldErrors.phone}
          keyboardType="phone-pad"
        />

        <GenderToggle
          value={form.gender}
          onChange={(gender) => update("gender")(gender)}
          error={fieldErrors.gender}
        />

        <AppInput
          placeholder="Mật khẩu"
          value={form.password}
          onChangeText={update("password")}
          onBlur={() => handleBlur("password")}
          onFocus={scrollToBottom}
          error={fieldErrors.password}
          secureTextEntry
        />

        <AppInput
          placeholder="Xác nhận mật khẩu"
          value={form.confirmPassword}
          onChangeText={update("confirmPassword")}
          onBlur={() => handleBlur("confirmPassword")}
          onFocus={scrollToBottom}
          error={fieldErrors.confirmPassword}
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
