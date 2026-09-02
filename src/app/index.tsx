import { useEffect } from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/config/colors";

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
    <View className="flex-1 items-center justify-center bg-white">
      <Image
        source={require("../../assets/images/splash-icon.png")}
        style={{ width: 160, height: 160 }}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={Colors.primary} className="mt-6" />
    </View>
  );
}
