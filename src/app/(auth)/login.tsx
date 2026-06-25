import { useLogin } from "@/features/auth/hooks/useLogin";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useLogin();

  const [activeTab, setActiveTab] = useState<"email" | "citizen">("email");
  const [email, setEmail] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (activeTab === "email") {
      if (!email.trim() || !password.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
        return;
      }
      clearError();
      const success = await login({ email: email.trim(), password });
      if (success) {
        router.replace("/(patient)/(tabs)/home");
      }
    } else {
      if (!citizenId.trim() || !password.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
        return;
      }
      clearError();
      const success = await login({ citizen_id: citizenId.trim(), password });
      if (success) {
        router.replace("/(patient)/(tabs)/home");
      }
    }
  };

  return (
    <ScreenWrapper edges={["bottom", "left", "right"]}>
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
          <View className="bg-primary rounded-b-[28px] px-6 pb-9 shadow-sm" style={{ paddingTop: insets.top + 24 }}>
            {/* Logo row */}
            <View className="flex-row items-center gap-2 mb-7">
              <View className="w-8 h-8 bg-white/25 rounded-lg items-center justify-center relative">
                <View className="absolute w-3.5 h-[3px] bg-white rounded-sm" />
                <View className="absolute w-[3px] h-3.5 bg-white rounded-sm" />
              </View>
              <Text className="text-white text-sm font-semibold">TriageFlowOPD</Text>
            </View>

            {/* Title + subtitle */}
            <Text className="text-[34px] font-extrabold text-white tracking-tighter mb-1.5">
              Chào mừng
            </Text>
            <Text className="text-[14px] text-white/80">Đăng nhập để tiếp tục</Text>
          </View>

          {/* ── Form area ── */}
          <View className="px-6 pt-6 flex-1">
            {/* Error */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-500 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Tab Selector */}
            <View className="flex-row gap-3 mb-[18px]">
              <Pressable
                className={
                  activeTab === "email"
                    ? "flex-1 h-12 rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                    : "flex-1 h-12 rounded-xl border border-neutral-200 bg-neutral-100 items-center justify-center active:opacity-90"
                }
                onPress={() => {
                  setActiveTab("email");
                  if (error) clearError();
                }}
              >
                <Text
                  className={
                    activeTab === "email"
                      ? "text-primary text-[14px] font-bold"
                      : "text-neutral-700 text-[14px] font-medium opacity-60"
                  }
                >
                  Email
                </Text>
              </Pressable>
              <Pressable
                className={
                  activeTab === "citizen"
                    ? "flex-1 h-12 rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                    : "flex-1 h-12 rounded-xl border border-neutral-200 bg-neutral-100 items-center justify-center active:opacity-90"
                }
                onPress={() => {
                  setActiveTab("citizen");
                  if (error) clearError();
                }}
              >
                <Text
                  className={
                    activeTab === "citizen"
                      ? "text-primary text-[14px] font-bold"
                      : "text-neutral-700 text-[14px] font-medium opacity-60"
                  }
                >
                  Số CCCD
                </Text>
              </Pressable>
            </View>

            {/* Inputs dựa trên activeTab */}
            {activeTab === "email" ? (
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
            ) : (
              <AppInput
                placeholder="Số CMND/CCCD"
                value={citizenId}
                onChangeText={(v) => {
                  setCitizenId(v);
                  if (error) clearError();
                }}
                keyboardType="numeric"
              />
            )}

            <AppInput
              placeholder="Mật khẩu"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) clearError();
              }}
              secureTextEntry
            />

            {/* Nút đăng nhập */}
            <View className="mt-1.5">
              <AppButton
                title="Đăng nhập"
                variant="primary"
                isLoading={isLoading}
                onPress={handleLogin}
              />
            </View>

            {/* Nút đăng nhập bằng OTP */}
            <View className="mt-3">
              <AppButton
                title="Đăng nhập bằng mã OTP qua Email"
                variant="primary"
                onPress={() => router.push("/(auth)/email-otp")}
              />
            </View>

            {/* Quên mật khẩu */}
            <Pressable
              onPress={() => router.push("/(auth)/forgot")}
              className="self-end mt-3.5 mb-2.5 active:opacity-70"
            >
              <Text className="text-primary text-xs">Quên mật khẩu?</Text>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-[1px] bg-neutral-200" />
              <Text className="mx-3.5 text-neutral-400 text-xs">hoặc</Text>
              <View className="flex-1 h-[1px] bg-neutral-200" />
            </View>

            {/* Register link */}
            <View className="flex-row justify-center items-center pb-8">
              <Text className="text-neutral-400 text-xs">Chưa có tài khoản? </Text>
              <Pressable className="active:opacity-70" onPress={() => router.push("/(auth)/register")}>
                <Text className="text-primary font-semibold text-xs">Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}


