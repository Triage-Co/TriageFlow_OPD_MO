import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * index.tsx – Entry point của app
 * Kiểm tra session và redirect:
 *   - Đã login → /(patient)/(tabs)/home
 *   - Chưa login:
 *       + Chưa xem Onboarding → /(auth)/welcome
 *       + Đã xem Onboarding → /(auth)/login
 */
export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;

    const checkRedirect = async () => {
      if (isAuthenticated) {
        router.replace("/(patient)/(tabs)/home");
      } else {
        try {
          const hasSeen = await AsyncStorage.getItem("HAS_SEEN_ONBOARDING");
          if (hasSeen === "true") {
            router.replace("/(auth)/login");
          } else {
            router.replace("/welcome");
          }
        } catch (err) {
          console.warn("[Entry] Error checking onboarding state:", err);
          router.replace("/welcome");
        }
      }
    };

    checkRedirect();
  }, [isAuthenticated, isLoading, router]);

  return (
    <View className="flex-1 items-center justify-center bg-blue-50">
      <ActivityIndicator size="large" color="#5B9BD5" />
    </View>
  );
}
