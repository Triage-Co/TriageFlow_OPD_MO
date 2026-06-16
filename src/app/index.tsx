import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/features/auth/context/AuthContext";

/**
 * index.tsx – Entry point của app
 * Kiểm tra session và redirect:
 *   - Đã login → /(patient)/(tabs)/home
 *   - Chưa login → /(auth)/welcome
 */
export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/(patient)/(tabs)/home");
    } else {
      router.replace("/(auth)/welcome");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View className="flex-1 items-center justify-center bg-blue-50">
      <ActivityIndicator size="large" color="#5B9BD5" />
    </View>
  );
}
