import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TicketScreen() {
  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 items-center justify-center px-8">
        <Text style={{ fontSize: 56 }} className="mb-4">🎟️</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2">Phiếu khám</Text>
        <Text className="text-gray-500 text-sm text-center leading-6">
          Phiếu khám điện tử và số thứ tự hàng chờ sẽ hiển thị ở đây sau khi bạn tạo lượt khám.
        </Text>
      </View>
    </SafeAreaView>
  );
}
