import { useEkyc } from "@/features/ekyc/hooks/useEkyc";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function EkycScreen() {
  const router = useRouter();
  const { isVerified, isLoading, handleLaunchEkyc, handleClearCache } = useEkyc();

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-gray-50"
      >
        {/* Header xanh tràn viền phẳng đáy */}
        <View className="bg-primary px-5 pt-14 pb-6">
          <View className="flex-row items-center gap-1 mb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center gap-1 active:opacity-70 p-1"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <SymbolView
                name={{ ios: "chevron.left", android: "arrow_back" }}
                size={24}
                tintColor="#FFFFFF"
              />
              <Text className="text-white text-[16px] font-medium">Quay lại</Text>
            </Pressable>
          </View>

          <Text className="text-white text-[22px] font-extrabold tracking-tight">
            Xác thực danh tính
          </Text>
        </View>

        {/* Nội dung chính */}
        <View className="flex-1 justify-center items-center px-6 py-10">
          <View className="w-full bg-white p-8 rounded-[24px] shadow-sm items-center border border-gray-100">
            {isVerified ? (
              // Trạng thái: ĐÃ XÁC THỰC
              <View className="w-full items-center">
                <View className="bg-emerald-50 p-6 rounded-full mb-6">
                  <SymbolView
                    name={{ ios: "checkmark.shield.fill", android: "verified_user" }}
                    size={72}
                    tintColor="#10B981"
                  />
                </View>

                <Text className="text-emerald-600 font-bold text-xs tracking-wider uppercase bg-emerald-50 px-4 py-2 rounded-full mb-4">
                  ✓ ĐÃ XÁC THỰC CCCD CHÍNH CHỦ
                </Text>

                <Text className="text-gray-800 text-lg font-bold text-center mb-2">
                  Xác thực thành công
                </Text>

                <Text className="text-gray-400 text-sm text-center mb-8 px-4 leading-5">
                  Tài khoản của bạn đã được liên kết và xác minh danh tính bằng CCCD thành công.
                </Text>

                <Pressable
                  onPress={handleClearCache}
                  className="w-full py-4 rounded-xl border border-red-200 active:bg-red-50 items-center justify-center"
                >
                  <Text className="text-red-500 font-bold text-[15px]">
                    Xóa xác thực (Quét lại từ đầu)
                  </Text>
                </Pressable>
              </View>
            ) : (
              // Trạng thái: CHƯA XÁC THỰC
              <View className="w-full items-center">
                <View className="bg-red-50 p-6 rounded-full mb-6">
                  <SymbolView
                    name={{ ios: "exclamationmark.shield.fill", android: "gpp_maybe" }}
                    size={72}
                    tintColor="#EF4444"
                  />
                </View>

                <Text className="text-red-500 font-bold text-xs tracking-wider uppercase bg-red-50 px-4 py-2 rounded-full mb-4">
                  CHƯA XÁC THỰC DANH TÍNH
                </Text>

                <Text className="text-gray-800 text-lg font-bold text-center mb-2">
                  Yêu cầu xác thực CCCD
                </Text>

                <Text className="text-gray-400 text-sm text-center mb-8 px-4 leading-5">
                  Vui lòng thực hiện xác thực căn cước công dân (eKYC) để hoàn thiện hồ sơ bệnh nhân chính xác nhất.
                </Text>

                <Pressable
                  onPress={handleLaunchEkyc}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl items-center justify-center flex-row gap-2 ${isLoading ? "bg-gray-300" : "bg-primary active:opacity-90"
                    }`}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <SymbolView
                        name={{ android: "camera_alt" }}
                        size={18}
                        tintColor="#FFFFFF"
                      />
                      <Text className="text-white font-bold text-[15px]">
                        Bắt đầu quét eKYC
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
