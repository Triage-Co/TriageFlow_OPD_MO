import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export function SuccessView() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace("/(patient)/(tabs)/home");
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="bg-blue-100 rounded-full items-center justify-center mb-10"
          style={{ width: 130, height: 130 }}
        >
          <View
            className="bg-blue-400 rounded-full items-center justify-center"
            style={{ width: 86, height: 86 }}
          >
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

        <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
          Thành công!
        </Text>
        <Text className="text-gray-400 text-center text-sm leading-6">
          Chúc mừng! Bạn đã đăng ký{"\n"}tài khoản thành công.
        </Text>
      </View>

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
