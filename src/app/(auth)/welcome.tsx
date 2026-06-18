import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Dimensions, Image, Pressable, Text, View } from "react-native";

const { width } = Dimensions.get("window");
const ICON_CIRCLE = width * 0.52;

/**
 * Welcome / Intro screen
 * UI theo Figma "intro": icon AI, title, pagination dots, nút "Tiếp theo"
 * Bỏ qua hoặc Tiếp theo → chuyển đến màn Login
 */
export default function WelcomeScreen() {
  const router = useRouter();

  const goToLogin = () => router.replace("/(auth)/login");

  return (
    <ScreenWrapper>
      {/* Bỏ qua – top right */}
      <View className="items-end px-7 pt-4">
        <Pressable onPress={goToLogin} className="active:opacity-70" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text className="text-[15px] text-neutral-400">Bỏ qua</Text>
        </Pressable>
      </View>

      {/* Phần giữa: icon + text */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-5 items-center justify-center">
          <LinearGradient
            colors={["#FFFFFF", Colors.gradientStart, Colors.gradientMid]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            className="shadow shadow-black/10"
            style={{
              width: ICON_CIRCLE,
              height: ICON_CIRCLE,
              borderRadius: ICON_CIRCLE / 2,
              elevation: 4,
            }}
          >
            {/* Khung trong để ép icon nằm giữa vòng tròn */}
            <View className="h-full w-full flex-1 justify-center items-center">
              <AiHeadIcon />
            </View>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-neutral-700 text-center mb-3.5 tracking-tight">
          Ứng dụng điều phối {"\n"} khám ngoại trú
        </Text>

        {/* Subtitle */}
        <Text className="text-[14px] text-neutral-400 text-center leading-[22px] px-2">
          Đăng ký khám, theo dõi hàng chờ và điều hướng trong bệnh viện một cách dễ dàng.
        </Text>
      </View>

      {/* Phần dưới: dots + button */}
      <View className="px-7 pb-12">
        {/* Pagination dots */}
        <View className="flex-row justify-center items-center gap-2 mb-6">
          <View className="w-6 h-[7px] rounded-full bg-primary" />
          <View className="w-2 h-[7px] rounded-full bg-neutral-200" />
        </View>

        <AppButton title="Tiếp theo" variant="primary" onPress={goToLogin} />
      </View>
    </ScreenWrapper>
  );
}

/**
 * Icon AI – load từ assets/images/SVG.png
 */
function AiHeadIcon() {
  return (
    <Image
      source={require("../../../assets/images/SVG.png")}
      className="w-[90px] h-[90px]"
      resizeMode="contain"
    />
  );
}

