import { useAuthContext } from "@/features/auth/context/AuthContext";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/config/colors";

export function ProfileView() {
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
            router.replace("/(auth)/login");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return "BN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Immersive */}
        <View className="px-6 py-6 bg-primary">
          <Text className="text-white text-[24px] font-extrabold tracking-tight mb-5 mt-5">
            Hồ sơ cá nhân
          </Text>
          {/* Card thông tin bệnh nhân */}
          <View className="mx-1 bg-white rounded-[24px] p-5 flex-row items-center gap-4 shadow shadow-black/5">
            <View className="bg-primary w-16 h-16 rounded-2xl items-center justify-center shadow-sm overflow-hidden">
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                />
              ) : (
                <Text className="text-white text-xl font-bold">
                  {getInitials(user?.full_name)}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-gray-800 text-lg font-bold">
                {user?.full_name ?? "Bệnh nhân"}
              </Text>
              <View className="flex-row items-center gap-2 mt-1.5">
                <SymbolView
                  name={{ ios: "phone", android: "phone" }}
                  size={14}
                  tintColor="#9CA3AF"
                />
                <Text className="text-gray-500 text-xs font-medium">
                  {user?.phone || "—"}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-1">
                <SymbolView
                  name={{ ios: "envelope", android: "mail" }}
                  size={14}
                  tintColor="#9CA3AF"
                />
                <Text className="text-gray-500 text-xs font-medium">
                  {user?.email || "—"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Các tùy chọn */}
        <View className="mt-6 px-5 gap-3.5">
          <ActionCard
            iconName={{ ios: "person", android: "person" }}
            title="Thông tin cá nhân"
            onPress={() => router.push("/(patient)/triage/personal-info")}
          />
          <ActionCard
            iconName={{ ios: "shield", android: "shield" }}
            title="Thông tin bảo hiểm"
            onPress={() => { }}
          />
          <ActionCard
            iconName={{ ios: "clock", android: "history" }}
            title="Lịch sử khám bệnh"
            onPress={() => router.push("/(patient)/profile/history")}
          />
          <ActionCard
            iconName={{ ios: "person.3", android: "people" }}
            title="Hồ Sơ Khám Bệnh"
            onPress={() => router.push("/(patient)/triage/patient-list" as any)}
          />
          <ActionCard
            iconName={{ ios: "key", android: "key" }}
            title="Quên mật khẩu"
            onPress={() => router.push("/(auth)/forgot")}
          />
        </View>

        {/* Nút Đăng xuất */}
        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          className="flex-row items-center justify-center py-4 mt-1 mb-28 gap-2 active:opacity-70"
        >
          <SymbolView
            name={{ ios: "rectangle.portrait.and.arrow.right", android: "logout" }}
            size={18}
            tintColor="#EF4444"
          />
          <Text className="text-red-500 text-[15px] font-bold">Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

function ActionCard({
  iconName,
  title,
  onPress
}: {
  iconName: { ios: any; android: any };
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white px-4 py-8 rounded-[18px] flex-row items-center justify-between shadow shadow-black/5 active:opacity-75"
    >
      <View className="flex-row items-center gap-4">
        <SymbolView
          name={iconName}
          size={20}
          tintColor="#374151"
        />
        <Text className="text-gray-800 text-[15px] font-semibold">{title}</Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right" }}
        size={16}
        tintColor="#9CA3AF"
      />
    </Pressable>
  );
}
