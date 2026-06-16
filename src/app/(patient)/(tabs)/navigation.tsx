import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NavigationScreen() {
  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 items-center justify-center px-8">
        <Text style={{ fontSize: 56 }} className="mb-4">🗺️</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2">Dẫn đường</Text>
        <Text className="text-gray-500 text-sm text-center leading-6">
          Bản đồ bệnh viện và chỉ đường đến phòng khám sẽ hiển thị ở đây. Tính năng đang được phát triển.
        </Text>
      </View>
    </SafeAreaView>
  );
}
