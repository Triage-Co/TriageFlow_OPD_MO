import { View, Text } from "react-native";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";

export default function ScanScreen() {
  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center px-8">
        <Text style={{ fontSize: 56 }} className="mb-4">📷</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2">Quét mã QR</Text>
        <Text className="text-gray-500 text-sm text-center leading-6">
          Quét mã QR tại các điểm kiểm tra trong bệnh viện để cập nhật vị trí và nhận hướng dẫn tiếp theo.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
