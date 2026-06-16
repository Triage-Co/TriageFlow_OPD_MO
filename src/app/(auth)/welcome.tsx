import { View, Text, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/shared/components/AppButton";

const { width } = Dimensions.get("window");

/**
 * Welcome / Splash screen
 * UI theo Figma: illustration trên, title + desc giữa, 2 button dưới
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Illustration area */}
      <View className="flex-1 items-center justify-center px-8 pt-10">
        <Image
          source={require("../../../assets/images/splash-illustration.png")}
          style={{ width: width * 0.65, height: width * 0.65 }}
          resizeMode="contain"
        />
      </View>

      {/* Content area */}
      <View className="px-8 pb-2">
        <Text
          className="text-2xl font-bold text-center text-gray-800 mb-3"
          style={{ lineHeight: 34 }}
        >
          Ứng dụng điều phối{"\n"}khám ngoại trú
        </Text>
        <Text className="text-center text-gray-400 text-sm leading-6 px-2">
          Đăng ký tài khoản, theo dõi lịch khám và điều hướng trong bệnh viện với cách dễ dàng.
        </Text>
      </View>

      {/* Buttons */}
      <View className="px-8 pb-10 pt-8 gap-3">
        <AppButton
          title="Đăng Ký"
          variant="primary"
          onPress={() => router.push("/(auth)/register")}
        />

        {/* Đăng Nhập là text-only link theo Figma */}
        <TouchableOpacity
          className="items-center py-3"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-gray-500 text-base font-medium">Đăng Nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
