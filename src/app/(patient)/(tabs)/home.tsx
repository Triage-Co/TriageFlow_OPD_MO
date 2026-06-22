import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

/**
 * Home screen – Trang chủ của bệnh nhân
 * Thiết kế tỉ mỉ theo Figma, sử dụng 100% NativeWind
 */
export default function HomeScreen() {
  const { user } = useAuthContext();
  const router = useRouter();

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        
        {/* ── Header Immersive (Nền primary tràn viền) ── */}
        <View className="bg-primary rounded-b-[36px] px-6 pt-14 pb-8 shadow-md">
          <View className="flex-row items-center justify-between">
            {/* Trái: Avatar và lời chào */}
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-2xl">👤</Text>
              </View>
              <View>
                <Text className="text-white/80 text-xs font-medium">Xin chào,</Text>
                <Text className="text-white text-lg font-bold mt-0.5">
                  {user?.fullName ?? "Nguyễn Thị Lan"}
                </Text>
              </View>
            </View>

            {/* Phải: Chuông thông báo kèm số badge */}
            <Pressable className="w-10 h-10 rounded-full bg-white/20 items-center justify-center relative active:opacity-80">
              <Text className="text-lg text-white">🔔</Text>
              <View className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full w-[18px] h-[18px] items-center justify-center border-2 border-primary">
                <Text className="text-[9px] text-white font-extrabold">2</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── Thao tác nhanh (Quick Actions) ── */}
        <View className="flex-row justify-around items-center px-5 py-6 gap-4">
          {/* Nút 1: Đặt lịch khám */}
          <Pressable 
            onPress={() => router.push("/(patient)/body-map")}
            className="items-center gap-2 flex-1 active:opacity-75"
          >
            <View className="bg-purple-100/70 w-14 h-14 rounded-2xl items-center justify-center">
              {/* Dựng hình chiếc thẻ nằm ngang */}
              <View className="w-7 h-5 bg-purple-500 rounded justify-center items-center relative shadow-sm">
                <View className="absolute top-1 left-0.5 right-0.5 h-[2px] bg-white/40" />
                <View className="w-1.5 h-1.5 rounded-full bg-white/60 absolute bottom-1 right-1" />
              </View>
            </View>
            <Text className="text-xs text-gray-700 font-semibold text-center">Đặt lịch khám</Text>
          </Pressable>

          {/* Nút 2: Phiếu khám */}
          <Pressable 
            onPress={() => router.push("/(patient)/(tabs)/ticket")}
            className="items-center gap-2 flex-1 active:opacity-75"
          >
            <View className="bg-blue-100/70 w-14 h-14 rounded-2xl items-center justify-center">
              <Image 
                source={require("../../../../assets/images/Phieukham.png")}
                className="w-6 h-6"
                style={{ tintColor: "#2563EB" }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-xs text-gray-700 font-semibold text-center">Phiếu khám</Text>
          </Pressable>

          {/* Nút 3: Dẫn đường */}
          <Pressable 
            onPress={() => router.push("/(patient)/(tabs)/navigation")}
            className="items-center gap-2 flex-1 active:opacity-75"
          >
            <View className="bg-orange-100/70 w-14 h-14 rounded-2xl items-center justify-center">
              <Image 
                source={require("../../../../assets/images/DanDuong.png")}
                className="w-6 h-6"
                style={{ tintColor: "#EA580C" }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-xs text-gray-700 font-semibold text-center">Dẫn đường</Text>
          </Pressable>
        </View>

        {/* ── Banner Đặt Khám ── */}
        <View className="px-5 mb-6">
          <Pressable 
            onPress={() => router.push("/(patient)/body-map")}
            className="bg-primary rounded-[24px] p-5 flex-row items-center justify-between shadow-sm shadow-primary/20 active:opacity-90"
          >
            <View className="flex-1 pr-4">
              <Text className="text-white/80 text-[12px] font-medium">Chưa đặt khám?</Text>
              <Text className="text-white text-[20px] font-extrabold mt-0.5">Đặt Khám</Text>
              <Text className="text-white/95 text-[11px] mt-1.5 leading-4">
                Mô tả triệu chứng để được hỗ trợ
              </Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white text-lg font-bold">›</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Section: Thông báo ── */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-800 text-[16px] font-bold">Thông báo</Text>
            <Pressable className="active:opacity-75">
              <Text className="text-primary text-[13px] font-semibold">Xem tất cả</Text>
            </Pressable>
          </View>

          {/* List thông báo */}
          <View className="gap-3">
            {/* Thông báo 1 */}
            <View className="bg-white rounded-2xl p-4 flex-row items-start gap-3 shadow shadow-black/5">
              <View className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5" />
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-semibold leading-5">
                  Còn 2 người trước bạn tại phòng khám Nội
                </Text>
                <Text className="text-gray-400 text-xs mt-1">5 phút trước</Text>
              </View>
            </View>

            {/* Thông báo 2 */}
            <View className="bg-white rounded-2xl p-4 flex-row items-start gap-3 shadow shadow-black/5">
              <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-semibold leading-5">
                  Thanh toán xét nghiệm máu đã xác nhận
                </Text>
                <Text className="text-gray-400 text-xs mt-1">23 phút trước</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section: Mẹo sức khỏe ── */}
        <View className="px-5 mb-8">
          <Text className="text-gray-800 text-[16px] font-bold mb-3">Mẹo sức khỏe</Text>
          <View className="bg-amber-100/70 border border-amber-200/50 rounded-2xl p-5 flex-row items-center gap-4">
            <Text className="text-4xl text-amber-500">🧡</Text>
            <View className="flex-1">
              <Text className="text-amber-900 text-sm font-bold">
                Uống đủ 2L nước mỗi ngày
              </Text>
              <Text className="text-amber-800/80 text-xs mt-1 leading-[18px]">
                Giúp cơ thể duy trì hoạt động tối ưu và tăng cường miễn dịch.
              </Text>
            </View>
          </View>
        </View>

        {/* Tạo khoảng trống dưới cùng để tránh bị đè bởi Floating TabBar */}
        <View className="h-24" />
      </ScrollView>
    </ScreenWrapper>
  );
}
