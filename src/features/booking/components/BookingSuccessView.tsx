import React from "react";
import { View, Text, ScrollView, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";

export function BookingSuccessView() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const queueId = params.queueId as string;
  const queueNumber = params.queueNumber as string;
  const status = params.status as string;
  const doctorName = params.doctorName as string;
  const specialtyName = (params.packageName as string) || (params.specialtyName as string) || "Khám chuyên khoa";
  const roomName = params.roomName as string;
  const selectedDate = params.selectedDate as string;
  const slotTime = params.slotTime as string;
  const bookingId = (params.ticketCode as string) || (params.bookingId as string);

  const getStatusLabel = (s: string) => {
    switch (s?.toUpperCase()) {
      case "PENDING":
        return "Đang xử lý";
      case "CONFIRMED":
        return "Đã xác nhận";
      default:
        return "Đã thanh toán";
    }
  };

  React.useEffect(() => {
    const backAction = () => {
      router.replace("/(patient)/(tabs)/home");
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  const handleGoHome = () => {
    router.replace("/(patient)/(tabs)/home");
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          
          <View className="items-center pt-16 pb-6">
            <View className="w-20 h-20 rounded-full bg-emerald-50 items-center justify-center mb-4 border border-emerald-100">
              <SymbolView
                name="checkmark.seal.fill"
                size={44}
                tintColor="#10B981"
              />
            </View>
            <Text className="text-gray-800 text-[22px] font-extrabold text-center px-5">
              Đặt lịch thành công!
            </Text>
            <Text className="text-gray-400 text-[13px] font-medium text-center mt-1 px-5">
              Hệ thống đã ghi nhận lịch hẹn khám của bạn
            </Text>
          </View>

          <View className="mx-5 bg-white rounded-[24px] p-6 border border-emerald-100 shadow-sm items-center mb-4 relative overflow-hidden">
            <View className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-50/50 rounded-full" />
            
            <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              Số thứ tự của bạn
            </Text>
            
            <View className="w-24 h-24 rounded-full bg-emerald-500/10 items-center justify-center mb-4 border border-emerald-500/20">
              <Text className="text-emerald-600 text-[38px] font-black">
                {queueNumber || "0"}
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-emerald-700 text-[11px] font-bold">
                {getStatusLabel(status)}
              </Text>
            </View>
          </View>

          <View className="mx-5 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-6">
            <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-4">
              Chi tiết lịch khám
            </Text>

            <View className="gap-y-3.5">
              <View className="flex-row justify-between items-start">
                <Text className="text-gray-400 text-[12px] font-medium">Bác sĩ khám</Text>
                <Text className="text-gray-800 text-[13px] font-bold text-right flex-1 ml-6">
                  {doctorName || "Bác sĩ phụ trách"}
                </Text>
              </View>

              <View className="flex-row justify-between items-start">
                <Text className="text-gray-400 text-[12px] font-medium">Dịch vụ / Gói khám</Text>
                <Text className="text-gray-800 text-[13px] font-bold text-right flex-1 ml-6">
                  {specialtyName}
                </Text>
              </View>

              {roomName ? (
                <View className="flex-row justify-between items-start">
                  <Text className="text-gray-400 text-[12px] font-medium">Phòng khám</Text>
                  <Text className="text-gray-800 text-[13px] font-bold text-right flex-1 ml-6">
                    {roomName}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row justify-between items-start">
                <Text className="text-gray-400 text-[12px] font-medium">Thời gian khám</Text>
                <Text className="text-gray-800 text-[13px] font-bold text-right flex-1 ml-6">
                  {slotTime ? `${slotTime} - ` : ""}{selectedDate}
                </Text>
              </View>

              {bookingId ? (
                <View className="flex-row justify-between items-start border-t border-gray-50 pt-3.5">
                  <Text className="text-gray-400 text-[12px] font-medium">Mã phiếu khám</Text>
                  <Text className="text-gray-700 text-[12px] font-semibold text-right">
                    {bookingId}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="mx-5 bg-blue-50/50 rounded-[18px] p-4 border border-blue-50/70 flex-row gap-3">
            <SymbolView name="info.circle.fill" size={16} tintColor={Colors.primary} />
            <View className="flex-1">
              <Text className="text-primary text-[12px] font-bold mb-0.5">Lưu ý quan trọng</Text>
              <Text className="text-gray-600 text-[11px] font-medium leading-[16px]">
                Vui lòng đến trước giờ khám ít nhất 15 phút tại bàn tiếp đón chuyên khoa để thực hiện quét thẻ, đối chiếu CCCD và đo sinh hiệu trước khi vào phòng khám.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="px-5 pb-12 pt-4 bg-white border-t border-gray-50">
          <AppButton
            title="Về Trang Chủ"
            onPress={handleGoHome}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
