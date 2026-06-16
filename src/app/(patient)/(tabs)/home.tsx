import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthContext } from "@/features/auth/context/AuthContext";

/**
 * Home tab – Trang chủ
 * Placeholder screen – chờ feature visit/appointment implement
 */
export default function HomeScreen() {
  const { user } = useAuthContext();

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-blue-500 px-6 pt-6 pb-10 rounded-b-3xl">
          <Text className="text-blue-100 text-sm mb-1">Xin chào 👋</Text>
          <Text className="text-white text-xl font-bold">
            {user?.fullName ?? "Bệnh nhân"}
          </Text>
          <Text className="text-blue-100 text-xs mt-1">
            Hệ thống TriageFlowOPD
          </Text>
        </View>

        {/* Quick actions */}
        <View className="px-5 -mt-5">
          <View className="bg-white rounded-2xl p-5 shadow-sm" style={{ elevation: 4 }}>
            <Text className="text-gray-700 font-semibold mb-4">Thao tác nhanh</Text>
            <View className="flex-row gap-3">
              <QuickAction emoji="🩺" title="Khám mới" />
              <QuickAction emoji="📅" title="Lịch hẹn" />
              <QuickAction emoji="💊" title="Gói khám" />
              <QuickAction emoji="🧪" title="Xét nghiệm" />
            </View>
          </View>
        </View>

        {/* Status placeholder */}
        <View className="px-5 mt-5">
          <Text className="text-gray-700 font-semibold mb-3">Lượt khám hôm nay</Text>
          <View className="bg-white rounded-2xl p-6 items-center shadow-sm" style={{ elevation: 2 }}>
            <Text style={{ fontSize: 40 }} className="mb-3">🏥</Text>
            <Text className="text-gray-500 text-sm text-center">
              Bạn chưa có lượt khám nào hôm nay.{"\n"}
              Nhấn "Khám mới" để bắt đầu.
            </Text>
          </View>
        </View>

        {/* Padding bottom */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ emoji, title }: { emoji: string; title: string }) {
  return (
    <TouchableOpacity className="flex-1 items-center gap-2">
      <View className="bg-blue-50 rounded-xl w-12 h-12 items-center justify-center">
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <Text className="text-xs text-gray-600 text-center">{title}</Text>
    </TouchableOpacity>
  );
}
