import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";

/**
 * Success screen – sau khi verify OTP thành công
 * UI theo Figma: vòng tròn xanh nhạt + checkmark xanh đậm, title, subtitle, button
 */
export default function SuccessScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace("/(patient)/(tabs)/home");
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center px-8">
        {/* Checkmark icon – vòng tròn xanh nhạt ngoài, xanh đậm trong */}
        <View
          className="bg-blue-100 rounded-full items-center justify-center mb-10"
          style={{ width: 130, height: 130 }}
        >
          <View
            className="bg-blue-400 rounded-full items-center justify-center"
            style={{ width: 86, height: 86 }}
          >
            {/* Dấu check thuần CSS – không cần icon library */}
            <View
              style={{
                width: 36,
                height: 22,
                borderLeftWidth: 4,
                borderBottomWidth: 4,
                borderColor: "#FFFFFF",
                transform: [{ rotate: "-45deg" }, { translateY: -4 }],
              }}
            />
          </View>
        </View>

        {/* Text */}
        <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
          Thành công!
        </Text>
        <Text className="text-gray-400 text-center text-sm leading-6">
          Chúc mừng! Bạn đã đăng ký{"\n"}tài khoản thành công.
        </Text>
      </View>

      {/* Button */}
      <View className="px-8 pb-10">
        <AppButton
          title="Tiếp tục"
          variant="primary"
          onPress={handleContinue}
        />
      </View>
    </ScreenWrapper>
  );
}
