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
 * Login screen
 * UI theo Figma: nền xanh nhạt toàn màn hình, logo + title trên, form bên dưới
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [phoneOrId, setPhoneOrId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!phoneOrId.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    clearError();
    const success = await login(phoneOrId.trim(), password);
    if (success) {
      router.replace("/(patient)/(tabs)/home");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#C2D9F0" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo row: icon vuông + "TriageFlowOPD" */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {/* Logo icon – hình vuông nhỏ xanh đậm */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#4A90C4",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Cross / plus shape */}
                <View style={{ position: "relative", width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ position: "absolute", width: 10, height: 2.5, backgroundColor: "#fff", borderRadius: 2 }} />
                  <View style={{ position: "absolute", width: 2.5, height: 10, backgroundColor: "#fff", borderRadius: 2 }} />
                </View>
              </View>
              <Text style={{ color: "#2A5F8A", fontSize: 14, fontWeight: "600" }}>
                TriageFlowOPD
              </Text>
            </View>
          </View>

          {/* Title block */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: "#1A2F45", marginBottom: 4, letterSpacing: -0.5 }}>
              Chào mừng
            </Text>
            <Text style={{ fontSize: 14, color: "#5A7A95" }}>
              Đăng nhập để tiếp tục
            </Text>
          </View>

          {/* Form area */}
          <View style={{ paddingHorizontal: 24, flex: 1 }}>
            {/* Demo hint – box nhạt hơn nền */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#AECDE8",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                gap: 8,
              }}
            >
              {/* Checkbox */}
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: "#6AACDA",
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#5B9BD5" }} />
              </View>
              <Text style={{ fontSize: 12, color: "#2A5F8A", flex: 1 }}>
                Demo: nhập bất kỳ thông tin nào để đăng nhập
              </Text>
            </TouchableOpacity>

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

            {/* Inputs */}
            <AppInput
              placeholder="Số điện thoại / CCCD"
              value={phoneOrId}
              onChangeText={setPhoneOrId}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <AppInput
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Quên mật khẩu */}
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginTop: -4, marginBottom: 20 }}
            >
              <Text style={{ color: "#4A90C4", fontSize: 13 }}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <AppButton
              title="Đăng nhập"
              variant="primary"
              isLoading={isLoading}
              onPress={handleLogin}
            />

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 20,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: "#9BBCD6" }} />
              <Text style={{ marginHorizontal: 14, color: "#5A7A95", fontSize: 13 }}>
                hoặc
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#9BBCD6" }} />
            </View>

            {/* Register link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                paddingBottom: 32,
              }}
            >
              <Text style={{ color: "#5A7A95", fontSize: 13 }}>
                Chưa có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={{ color: "#4A90C4", fontWeight: "600", fontSize: 13 }}>
                  Đăng ký ngay
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
