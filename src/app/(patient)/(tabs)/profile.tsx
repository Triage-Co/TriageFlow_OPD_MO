import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter } from "expo-router";

/**
 * Profile tab – Hồ sơ bệnh nhân
 * Hiển thị thông tin user và nút Đăng xuất
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-blue-500 px-6 pt-8 pb-16 rounded-b-3xl items-center">
          <View className="bg-white/20 rounded-full w-20 h-20 items-center justify-center mb-3">
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {user?.fullName ?? "Bệnh nhân"}
          </Text>
          <Text className="text-blue-100 text-sm mt-1">
            {user?.phone ?? ""}
          </Text>
        </View>

        {/* Info Card */}
        <View className="mx-5 -mt-8 bg-white rounded-2xl shadow-sm p-5 mb-5" style={{ elevation: 4 }}>
          <Text className="text-gray-700 font-semibold mb-4">Thông tin cá nhân</Text>

          <InfoRow label="Họ và tên" value={user?.fullName} />
          <InfoRow label="Số điện thoại" value={user?.phone} />
          <InfoRow label="Số CCCD" value={user?.nationalId} />
          <InfoRow label="Số thẻ BHYT" value={user?.insuranceId} />
          <InfoRow label="Ngày sinh" value={user?.dateOfBirth} isLast />
        </View>

        {/* Account actions */}
        <View className="mx-5 bg-white rounded-2xl shadow-sm overflow-hidden mb-8" style={{ elevation: 2 }}>
          <ActionRow emoji="🔒" title="Đổi mật khẩu" />
          <View className="h-px bg-gray-100 mx-4" />
          <ActionRow emoji="🔔" title="Cài đặt thông báo" />
          <View className="h-px bg-gray-100 mx-4" />
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoading}
            className="flex-row items-center px-5 py-4 gap-3"
          >
            <Text style={{ fontSize: 20 }}>🚪</Text>
            <Text className="text-red-500 font-medium flex-1">Đăng xuất</Text>
            <Text className="text-gray-300">›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value?: string;
  isLast?: boolean;
}) {
  return (
    <View className={`py-3 ${!isLast ? "border-b border-gray-100" : ""}`}>
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      <Text className="text-sm text-gray-800">{value ?? "—"}</Text>
    </View>
  );
}

function ActionRow({ emoji, title }: { emoji: string; title: string }) {
  return (
    <TouchableOpacity className="flex-row items-center px-5 py-4 gap-3">
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text className="text-gray-700 font-medium flex-1">{title}</Text>
      <Text className="text-gray-300">›</Text>
    </TouchableOpacity>
  );
}
