import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Register screen
 * UI theo Figma: nền kem ấm, back arrow, "Tạo tài khoản", form đầy đủ
 * Không có illustration
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    nationalId: "",
    insuranceId: "",
    password: "",
  });

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleRegister = async () => {
    const { fullName, phone, dateOfBirth, nationalId, password } = form;

    if (!fullName.trim() || !phone.trim() || !dateOfBirth.trim() || !nationalId.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    const success = await register({
      fullName: fullName.trim(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth.trim(),
      nationalId: nationalId.trim(),
      insuranceId: form.insuranceId.trim() || undefined,
      password,
    });

    if (success) {
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: phone.trim() },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0E6D8" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22, color: "#3A2A1A" }}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Title block */}
          <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: "#1A1208",
                marginBottom: 6,
                letterSpacing: -0.3,
              }}
            >
              Tạo tài khoản
            </Text>
            <Text style={{ fontSize: 13, color: "#8A7060" }}>
              Đăng ký để sử dụng đầy đủ tính năng
            </Text>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            {/* Error */}
            {error ? (
              <View
                style={{
                  backgroundColor: "#FEE2E2",
                  borderWidth: 1,
                  borderColor: "#FCA5A5",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#EF4444", fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <AppInput
              placeholder="Họ và tên"
              value={form.fullName}
              onChangeText={update("fullName")}
              autoCapitalize="words"
            />

            <AppInput
              placeholder="Số điện thoại"
              value={form.phone}
              onChangeText={update("phone")}
              keyboardType="phone-pad"
            />

            <AppInput
              placeholder="mm/dd/yyyy"
              value={form.dateOfBirth}
              onChangeText={update("dateOfBirth")}
              keyboardType="numeric"
              rightIcon={
                <Text style={{ fontSize: 16, color: "#9CA3AF" }}>📅</Text>
              }
            />

            <AppInput
              placeholder="Số CCCD"
              value={form.nationalId}
              onChangeText={update("nationalId")}
              keyboardType="numeric"
            />

            <AppInput
              placeholder="Số thẻ BHYT"
              value={form.insuranceId}
              onChangeText={update("insuranceId")}
            />

            <AppInput
              placeholder="Mật khẩu"
              value={form.password}
              onChangeText={update("password")}
              secureTextEntry
            />

            <View style={{ marginTop: 6 }}>
              <AppButton
                title="Đăng ký"
                variant="primary"
                isLoading={isLoading}
                onPress={handleRegister}
              />
            </View>

            {/* Login link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 18,
              }}
            >
              <Text style={{ color: "#8A7060", fontSize: 13 }}>
                Đã có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={{ color: "#4A90C4", fontWeight: "600", fontSize: 13 }}>
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
