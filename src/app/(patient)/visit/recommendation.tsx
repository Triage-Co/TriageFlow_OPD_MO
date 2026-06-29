import React from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";

export default function RecommendationScreen() {
  const router = useRouter();
  const { recommendation, isLoading, clearSession } = useTriage();

  const handleRestart = async () => {
    await clearSession();
    // Quay về màn hình chọn vùng đau trên Body Map
    router.replace("/(patient)/body-map");
  };

  const handleGoHome = async () => {
    await clearSession();
    // Quay về Trang chủ của bệnh nhân
    router.replace("/(patient)/(tabs)/home");
  };

  if (isLoading || !recommendation) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-500 text-[13px] font-medium mt-3">
            Đang tổng hợp kết quả chẩn đoán...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const specialist = recommendation?.recommended_specialist || (recommendation as any)?.recommendedSpecialist;
  const specialistName = specialist ? (specialist.nameVi || specialist.name) : "Khoa Nội tổng quát";
  const channelName = recommendation?.recommended_channel_vi || recommendation?.recommended_channel || (recommendation as any)?.recommendedChannelVi || (recommendation as any)?.recommendedChannel || "Khám trực tiếp";

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        {/* ── 1. HEADER ── */}
        <View className="bg-primary px-5 pt-12 pb-5 shadow-sm flex-row items-center justify-between">
          <Text className="text-white text-[16px] font-bold">Kết quả phân loại AI</Text>
          <Pressable onPress={handleGoHome} className="active:opacity-75">
            <SymbolView
              name={{ ios: "house.fill", android: "home" }}
              size={18}
              tintColor="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* ── 2. NỘI DUNG ĐỀ XUẤT KHOA KHÁM ── */}
        <View className="flex-1 px-5 pt-10 justify-center">
          <View className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-md items-center py-10 relative overflow-hidden">
            {/* Vòng tròn Icon y tế */}
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-6">
              <SymbolView
                name={{ ios: "stethoscope", android: "medical_services" }}
                size={28}
                tintColor="#547FB8"
              />
            </View>

            <Text className="text-gray-400 text-[12px] font-bold uppercase tracking-wider mb-2">
              Khoa khám đề xuất
            </Text>

            {/* Tên khoa chẩn đoán */}
            <Text className="text-[#3b5e94] text-[24px] font-extrabold text-center px-4 leading-8 mb-6">
              {specialistName}
            </Text>

            <View className="h-[1px] bg-gray-100 w-full mb-6" />

            {/* Chi tiết kênh đề xuất */}
            <View className="flex-row items-center gap-2 mb-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <SymbolView
                name={{ ios: "figure.walk", android: "directions_walk" }}
                size={14}
                tintColor="#6B7280"
              />
              <Text className="text-gray-600 text-[12px] font-semibold">
                Hình thức: {channelName}
              </Text>
            </View>

            {/* Lưu ý y tế */}
            <View className="bg-amber-50/70 border border-amber-100 p-4 rounded-[16px] flex-row gap-2.5 mt-2">
              <SymbolView
                name={{ ios: "exclamationmark.triangle.fill", android: "warning" }}
                size={14}
                tintColor="#D97706"
                style={{ marginTop: 2 }}
              />
              <Text className="text-amber-800 text-[11px] font-medium leading-4 flex-1">
                Lưu ý: Đây là đề xuất định hướng từ trợ lý AI dựa trên triệu chứng bạn khai báo, không thay thế cho chẩn đoán chuyên khoa chính thức từ bác sĩ điều trị.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. HÀNH ĐỘNG DƯỚI CÙNG ── */}
        <View className="px-5 pb-12 pt-3 bg-white border-t border-gray-50 gap-2.5">
          <AppButton
            title="Khám vùng đau khác (Làm lại)"
            onPress={handleRestart}
          />
          <AppButton
            title="Quay về Trang chủ"
            variant="secondary"
            onPress={handleGoHome}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
