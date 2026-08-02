import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  BackHandler,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { useBooking } from "@/features/booking/hooks/useBooking";

interface TicketData {
  queueNumber: string;
  specialtyName: string;
  roomName: string;
  startTime: string;
  patientName: string;
}

export default function TicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fetchStepDetail, fetchBookingResult } = useBooking();

  const stepId = params.stepId as string | undefined;

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadTicketDetails = async () => {
      if (!stepId) {
        
        setTicketData({
          queueNumber: (params.queueNumber as string) || "--",
          specialtyName: (params.specialtyName as string) || "Tổng quát",
          roomName: (params.roomName as string) || "Đang xếp phòng",
          startTime: (params.startTime as string) || "Đang xếp ca",
          patientName: (params.patientName as string) || "Bệnh nhân",
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const stepDetail = await fetchStepDetail(stepId);
        if (!active) return;

        if (stepDetail) {
          let qNum: string | undefined = stepDetail.queues?.[0]?.queue_number;
          if (!qNum) {
            const bookingResult = await fetchBookingResult(stepId);
            if (bookingResult && active) {
              qNum = bookingResult.queue?.queue_number || bookingResult.queue_number;
            }
          }

          if (active) {
            setTicketData({
              queueNumber: qNum || "--",
              specialtyName: stepDetail.flow?.booking?.slot?.shift?.room?.specialty?.specialty_name || (params.specialtyName as string) || "Tổng quát",
              roomName: stepDetail.flow?.booking?.slot?.shift?.room?.room_name || (params.roomName as string) || "Đang xếp phòng",
              startTime: stepDetail.flow?.booking?.slot?.start_time || (params.startTime as string) || "Đang xếp ca",
              patientName: (params.patientName as string) || "Bệnh nhân",
            });
          }
        } else if (active) {
          
          setTicketData({
            queueNumber: (params.queueNumber as string) || "--",
            specialtyName: (params.specialtyName as string) || "Tổng quát",
            roomName: (params.roomName as string) || "Đang xếp phòng",
            startTime: (params.startTime as string) || "Đang xếp ca",
            patientName: (params.patientName as string) || "Bệnh nhân",
          });
        }
      } catch (err) {
        console.error("[TicketScreen] Lỗi khi tải chi tiết phiếu khám:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadTicketDetails();

    return () => {
      active = false;
    };
  }, [stepId]);

  const queueNumber = ticketData?.queueNumber || (params.queueNumber as string) || "--";
  const specialtyName = ticketData?.specialtyName || (params.specialtyName as string) || "Tổng quát";
  const roomName = ticketData?.roomName || (params.roomName as string) || "Đang xếp phòng";
  const startTime = ticketData?.startTime || (params.startTime as string) || "Đang xếp ca";
  const patientName = ticketData?.patientName || (params.patientName as string) || "Bệnh nhân";

  
  useEffect(() => {
    const backAction = () => {
      router.replace("/(patient)/(tabs)/home");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <StatusBar style="light" />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-[12px] font-medium mt-3">
            Đang tải thông tin phiếu khám...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleGoHome = () => {
    router.replace("/(patient)/(tabs)/home");
  };

  const handleGoToTicketTab = () => {
    router.replace("/(patient)/(tabs)/ticket");
  };

  const handleGoToNavigationTab = () => {
    router.push("/(patient)/(tabs)/navigation");
  };

  const handleStartBooking = () => {
    router.replace("/(patient)/(tabs)/home");
  };

  // Tạo URL ảnh QR dựa trên số thứ tự
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    queueNumber || "0"
  )}`;

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 justify-between">
        {/* ── 1. BLUE HEADER AREA ── */}
        <View className="bg-primary pt-12 pb-5 items-center justify-center px-5 shadow-sm">
          <Text className="text-white text-[17px] font-bold">
            Phiếu khám của tôi
          </Text>
        </View>

        {/* ── 2. SCROLLABLE CARD AREA ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5 mt-5"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Phiếu khám Card */}
          <View className="bg-white rounded-[32px] border border-[#84AFEB]/30 shadow-lg shadow-black/5 overflow-hidden">
            {/* Header của thẻ */}
            <View className="bg-[#84AFEB]/10 flex-row items-center justify-center py-4 border-b border-[#84AFEB]/15">
              <View className="bg-primary/20 w-7 h-7 rounded-lg items-center justify-center mr-2">
                <Ionicons
                  name="medical"
                  size={14}
                  color={Colors.primary}
                />
              </View>
              <Text className="text-primary font-bold text-[14px]">
                TriageFlowOPD
              </Text>
            </View>

            {/* Nội dung chính */}
            <View className="p-6 items-center">
              <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                Số thứ tự
              </Text>
              <Text className="text-gray-800 text-[52px] font-black leading-none mb-6">
                {queueNumber || "0"}
              </Text>

              {/* Bảng thông tin chi tiết (UI y hệt ảnh 2) */}
              <View className="w-full bg-[#84AFEB]/10 rounded-[24px] p-5 border border-[#84AFEB]/20 mb-6">
                <View className="flex-row mb-4">
                  {/* Cột trái: Chuyên khoa */}
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Ionicons name="medical" size={12} color="#6B7280" />
                      <Text className="text-gray-500 text-[11px] font-medium">Chuyên khoa</Text>
                    </View>
                    <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                      {specialtyName || "Tổng quát"}
                    </Text>
                  </View>

                  {/* Cột phải: Phòng khám */}
                  <View className="flex-1 pl-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Ionicons name="location" size={12} color="#6B7280" />
                      <Text className="text-gray-500 text-[11px] font-medium">Phòng khám</Text>
                    </View>
                    <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                      {roomName || "Đang xếp phòng"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row">
                  {/* Cột trái: Thời gian bắt đầu */}
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Ionicons name="time" size={12} color="#6B7280" />
                      <Text className="text-gray-500 text-[11px] font-medium">Thời gian bắt đầu</Text>
                    </View>
                    <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                      {startTime || "Đang xếp ca"}
                    </Text>
                  </View>

                  {/* Cột phải: Bệnh nhân */}
                  <View className="flex-1 pl-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Ionicons name="person" size={12} color="#6B7280" />
                      <Text className="text-gray-500 text-[11px] font-medium">Bệnh nhân</Text>
                    </View>
                    <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                      {patientName || "Bệnh nhân"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Dotted divider */}
              <View className="w-full border-t border-dashed border-gray-200 my-4" />

              <Text className="text-gray-400 text-[11px] font-medium text-center mb-4">
                Quét để cập nhật vị trí và lộ trình
              </Text>

              {/* QR Code */}
              <View className="bg-white p-3 rounded-[20px] border border-gray-100 shadow-sm">
                <Image
                  source={{ uri: qrImageUrl }}
                  className="w-44 h-44"
                  resizeMode="contain"
                />
              </View>
            </View>
            {/* Các nút hành động dưới card */}
            <View className="mt-6 gap-y-3 pb-8">
              <AppButton
                title="Theo dõi hàng đợi"
                onPress={handleGoToTicketTab}
              />
              <AppButton
                title="Lộ Trình Khám"
                onPress={handleGoToNavigationTab}
              />
              <AppButton
                title="Về Trang Chủ"
                variant="ghost"
                onPress={handleGoHome}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
