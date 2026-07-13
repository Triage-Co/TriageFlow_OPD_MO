import { Colors } from "@/config/colors";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { bookingStorageService } from "@/features/booking/services/booking-storage.service";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";

interface ActiveTicket {
  stepId: string;
  patientName: string;
  queueNumber: string;
  specialtyName: string;
  roomName: string;
  startTime: string;
}

export default function TicketTabScreen() {
  const router = useRouter();
  const { fetchStepDetail, fetchBookingResult } = useBooking();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);

  // Hàm tải thông tin phiếu khám hiện tại từ bộ nhớ tạm và API
  const loadTicketData = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const activeBooking = await bookingStorageService.getActiveBookingStep();
      if (!activeBooking) {
        setActiveTicket(null);
        return;
      }

      const { stepId, patientName } = activeBooking;

      // 1. Tải chi tiết bước khám để lấy phòng ban, giờ khám
      const stepDetail = await fetchStepDetail(stepId);
      if (!stepDetail) {
        console.warn("[TicketTab] Không thể tải chi tiết bước khám.");
        return;
      }

      // 2. Lấy số thứ tự từ danh sách queues của step
      let queueNumber = stepDetail.queues?.[0]?.queue_number;

      // 3. Nếu queues chưa có số thứ tự, tiến hành gọi API generate để sinh số
      if (!queueNumber) {
        const bookingResult = await fetchBookingResult(stepId);
        if (bookingResult) {
          queueNumber = bookingResult.queue_number;
        }
      }

      // 4. Cập nhật giao diện Phiếu khám
      setActiveTicket({
        stepId,
        patientName,
        queueNumber: queueNumber || "--",
        specialtyName: stepDetail.flow?.booking?.slot?.shift?.room?.specialty?.specialty_name || "",
        roomName: stepDetail.flow?.booking?.slot?.shift?.room?.room_name || "",
        startTime: stepDetail.flow?.booking?.slot?.start_time || "",
      });
    } catch (err) {
      console.error("[TicketTab] Lỗi tải phiếu khám:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchStepDetail, fetchBookingResult]);

  // Load khi screen mount
  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  // Xử lý kéo xuống làm mới (Pull to refresh)
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTicketData(false);
  };

  const handleStartBooking = () => {
    router.push("/(patient)/body-map");
  };

  const handleGoToNavigationTab = () => {
    router.push("/(patient)/(tabs)/navigation");
  };

  // Tạo URL ảnh QR dựa trên số thứ tự
  const qrImageUrl = activeTicket
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      activeTicket.queueNumber || "0"
    )}`
    : "";

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style={activeTicket ? "light" : "dark"} />
      <View className="flex-1 justify-between">
        {isLoading ? (
          // Trạng thái Loading
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-[12px] font-medium mt-3">
              Đang tải thông tin phiếu khám...
            </Text>
          </View>
        ) : activeTicket ? (
          // Trạng thái 1: ĐÃ CÓ PHIẾU KHÁM TRONG NGÀY
          <View className="flex-1 justify-between">
            {/* Blue Header Area */}
            <View className="bg-primary pt-14 pb-5 items-center justify-center px-5 shadow-sm">
              <Text className="text-white text-[17px] font-bold">
                Phiếu khám của tôi
              </Text>
            </View>

            {/* Scrollable Card Area */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1 px-5 mt-5"
              contentContainerStyle={{ paddingBottom: 80 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                />
              }
            >
              <View className="bg-white rounded-[32px] border border-[#84AFEB]/30 shadow-lg shadow-black/5 overflow-hidden">
                {/* Header của thẻ */}
                <View className="bg-[#84AFEB]/10 flex-row items-center justify-center py-4 border-b border-[#84AFEB]/15">
                  <View className="bg-primary/20 w-7 h-7 rounded-lg items-center justify-center mr-2">
                    <SymbolView
                      name="plus.app.fill"
                      size={14}
                      tintColor={Colors.primary}
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
                    {activeTicket.queueNumber}
                  </Text>

                  {/* Bảng thông tin chi tiết (UI y hệt ảnh 2) */}
                  <View className="w-full bg-[#84AFEB]/10 rounded-[24px] p-5 border border-[#84AFEB]/20 mb-6">
                    <View className="flex-row mb-4">
                      {/* Cột trái: Chuyên khoa */}
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <SymbolView name="plus.square.fill" size={12} tintColor="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Chuyên khoa</Text>
                        </View>
                        <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                          {activeTicket.specialtyName || "Tổng quát"}
                        </Text>
                      </View>

                      {/* Cột phải: Phòng khám */}
                      <View className="flex-1 pl-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <SymbolView name="mappin.circle.fill" size={12} tintColor="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Phòng khám</Text>
                        </View>
                        <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                          {activeTicket.roomName || "Đang xếp phòng"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row">
                      {/* Cột trái: Thời gian bắt đầu */}
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <SymbolView name="clock.fill" size={12} tintColor="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Thời gian bắt đầu</Text>
                        </View>
                        <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                          {activeTicket.startTime || "Đang xếp ca"}
                        </Text>
                      </View>

                      {/* Cột phải: Bệnh nhân */}
                      <View className="flex-1 pl-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <SymbolView name="person.fill" size={12} tintColor="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Bệnh nhân</Text>
                        </View>
                        <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                          {activeTicket.patientName || "Bệnh nhân"}
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
              </View>
              {/* Các nút hành động dưới card */}
              <View className="mt-6 gap-y-3 pb-8">
                <AppButton
                  title="Theo dõi hàng đợi"
                  onPress={() => Alert.alert("Thông báo", "Bạn đang ở trang theo dõi hàng đợi khám.")}
                />
                <AppButton
                  title="Lộ Trình Khám"
                  onPress={handleGoToNavigationTab}
                />
              </View>
            </ScrollView>
          </View>
        ) : (
          // Trạng thái 2: CHƯA CÓ LỊCH HẸN KHÁM HÔM NAY (Placeholder)
          <View className="flex-1 justify-between px-6 py-12 items-center">
            <View className="flex-1 items-center justify-center">
              <View className="w-24 h-24 rounded-full bg-[#84AFEB]/10 items-center justify-center mb-6">
                <SymbolView
                  name="calendar.badge.exclamationmark"
                  size={36}
                  tintColor={Colors.primary}
                />
              </View>
              <Text className="text-gray-800 text-[18px] font-extrabold mb-2 text-center">
                Không có phiếu khám hôm nay
              </Text>
              <Text className="text-gray-400 text-[13px] font-medium text-center px-4 leading-[20px]">
                Bạn chưa có lịch hẹn khám bệnh nào trong ngày hôm nay. Vui lòng bắt đầu khai báo triệu chứng để được phân phòng khám tự động.
              </Text>
            </View>

            <View className="w-full">
              <AppButton
                title="Đặt lịch khám ngay"
                onPress={handleStartBooking}
              />
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
