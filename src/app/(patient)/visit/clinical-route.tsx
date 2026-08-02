import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { doctorService } from "@/features/booking/services/doctor.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  RefreshControl,
} from "react-native";

export default function ClinicalRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const patientName = (params.patientName as string) || "Bệnh nhân";
  const patientId = params.patientId as string;

  const [currentFlow, setCurrentFlow] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States for payment modal inside route timeline
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Khởi tạo flow từ tham số route hoặc tự động tải từ server nếu không truyền flowData
  useEffect(() => {
    if (params.flowData) {
      try {
        setCurrentFlow(JSON.parse(params.flowData as string));
      } catch (e) {
        console.error("Lỗi parse flowData trong ClinicalRouteScreen:", e);
      }
    } else if (patientId) {
      loadLatestFlow(true);
    }
  }, [params.flowData, patientId]);

  const loadLatestFlow = async (showIndicator = false) => {
    if (!patientId) return;
    if (showIndicator) {
      if (currentFlow) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
    }
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const response = await doctorService.getActiveFlow(patientId, todayStr);
      if (response && response.data && response.data.length > 0) {
        // Tìm flow đang chạy mới nhất của bệnh nhân
        const activeFlow = response.data.find((f: any) => f.status === "IN_PROGRESS");

        // Nếu không có flow hoạt động hôm nay, lấy flow đầu tiên trong danh sách
        setCurrentFlow(activeFlow || response.data[0]);
      } else {
        // Thử tìm trong lịch sử flow tổng quát nếu không có active
        const historyResponse = await doctorService.getPatientFlows(patientId);
        if (historyResponse && historyResponse.data && historyResponse.data.length > 0) {
          // Lấy cái mới nhất trong lịch sử
          const sortedHistory = [...historyResponse.data].sort((a: any, b: any) => {
            return new Date(b.create_at).getTime() - new Date(a.create_at).getTime();
          });
          // Đồng bộ với flow cũ đã chọn bằng cách so khớp ID
          const matched = sortedHistory.find((f: any) => f.flow_id === currentFlow?.flow_id);
          setCurrentFlow(matched || sortedHistory[0]);
        }
      }
    } catch (err) {
      console.log("Error refreshing clinical route flow:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadLatestFlow(true);
  };

  // Xác nhận thanh toán & cập nhật lại số thứ tự lộ trình khám
  const handleConfirmPayment = async () => {
    if (!selectedStep) return;
    setIsCheckingPayment(true);
    try {
      const res = await doctorService.getBookingGenerate(selectedStep.step_id);
      
      if (res && (res.code === 200 || res.status === "success" || res.data)) {
        const queueObj = Array.isArray(res.data?.queue) ? res.data.queue[0] : res.data;
        const queueNumber = queueObj?.queue_number ?? res.data?.queue_number ?? "";

        Alert.alert(
          "Thanh toán thành công",
          `Giao dịch đóng phí được duyệt. Số thứ tự khám của bạn tại bước này là: ${queueNumber}`,
          [
            {
              text: "Đồng ý",
              onPress: async () => {
                setSelectedStep(null);
                // Cập nhật lại lộ trình khám và lấy số thứ tự mới hiển thị lên timeline
                await loadLatestFlow(true);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Chưa nhận được thanh toán",
          "Hệ thống chưa ghi nhận giao dịch. Nếu đã chuyển khoản, vui lòng đợi 1-2 phút rồi thử lại."
        );
      }
    } catch (err) {
      console.error("[ClinicalRoute] Xác nhận đóng phí lỗi:", err);
      Alert.alert(
        "Chưa nhận được thanh toán",
        "Hệ thống chưa ghi nhận giao dịch. Nếu đã chuyển khoản, vui lòng đợi 1-2 phút rồi thử lại."
      );
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Định dạng ngày tạo của flow: YYYY-MM-DD -> DD/MM/YYYY
  const formattedDate = useMemo(() => {
    if (!currentFlow || !currentFlow.create_at) return "";
    const datePart = currentFlow.create_at.split("T")[0];
    if (!datePart) return "";
    return datePart.split("-").reverse().join("/");
  }, [currentFlow]);

  // Lọc danh sách steps để loại bỏ các bước CANCELLED hoặc không có tên
  const visibleSteps = useMemo(() => {
    if (!currentFlow || !currentFlow.steps) return [];
    return currentFlow.steps.filter((s: any) => s.step_status !== "CANCELLED" && s.step_name !== null);
  }, [currentFlow]);

  // Xác định bước khám hiện hành đang chạy
  const activeStepId = useMemo(() => {
    if (!currentFlow || !currentFlow.steps) return null;
    const activeSteps = currentFlow.steps.filter(
      (s: any) => s.step_status !== "COMPLETED" && s.step_status !== "CANCELLED"
    );
    const currentActiveStep = activeSteps.find((s: any) => {
      if (!s.depends_on || s.depends_on.length === 0) return true;
      return s.depends_on.every((depId: string) => {
        const depStep = currentFlow.steps.find((fs: any) => fs.step_id === depId);
        return !depStep || depStep.step_status === "COMPLETED" || depStep.step_status === "CANCELLED";
      });
    });
    return currentActiveStep?.step_id || activeSteps[0]?.step_id || null;
  }, [currentFlow]);

  const qrImageUrl = selectedStep?.qr_text
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        selectedStep.qr_text
      )}`
    : "";

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Header Area */}
      <View className="bg-primary pt-14 pb-5 flex-row items-center px-5 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="p-1 active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1 items-center mr-6">
          <Text className="text-white text-[17px] font-bold">Lộ Trình Khám</Text>
          <Text className="text-white/80 text-[12px] font-medium mt-0.5">
            {patientName} • {formattedDate}
          </Text>
        </View>
      </View>

      {/* Timeline Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-xs mt-3">Đang tải lộ trình khám...</Text>
        </View>
      ) : visibleSteps.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="trail-sign-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-400 text-sm mt-3 text-center">
            Không tìm thấy lộ trình chi tiết cho lượt khám này.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 50 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {visibleSteps.map((step: any, index: number) => {
            const isCompleted = step.step_status === "COMPLETED";
            const isPendingPayment = step.payment_status === "PENDING";
            const isActive = step.step_id === activeStepId;
            const isLast = index === visibleSteps.length - 1;

            // Xác định màu sắc/icon trạng thái
            let statusText = "Chờ thực hiện";
            let statusBg = "bg-gray-100";
            let statusTextColor = "text-gray-500";
            let iconName: any = "ellipse-outline";
            let iconColor = "#9CA3AF";
            let borderStyle = "border-gray-200";

            if (isCompleted) {
              statusText = "Hoàn thành";
              statusBg = "bg-green-50";
              statusTextColor = "text-green-600";
              iconName = "checkmark-circle";
              iconColor = "#10B981";
              borderStyle = "border-green-100";
            } else if (isPendingPayment) {
              statusText = "Chờ thanh toán";
              statusBg = "bg-amber-50";
              statusTextColor = "text-amber-600 border-amber-200";
              iconName = "card-outline";
              iconColor = "#F59E0B";
              borderStyle = "border-amber-200/50";
            } else if (isActive) {
              statusText = "Đang thực hiện";
              statusBg = "bg-blue-50";
              statusTextColor = "text-primary";
              iconName = "play-circle";
              iconColor = Colors.primary;
              borderStyle = "border-[#84AFEB]/30";
            }

            const roomName = step.room_info?.room_name || "Đang xếp phòng";
            const specialtyName = step.specialty_info?.specialty_name || "Phòng chức năng";
            const queueNumber = step.queues?.[0]?.queue_number;

            return (
              <View key={step.step_id} className="flex-row">
                {/* Cột trái: Nối đường vẽ timeline */}
                <View className="items-center mr-4 w-8">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center z-10 ${
                      isActive ? "bg-primary/20" : isCompleted ? "bg-green-100" : isPendingPayment ? "bg-amber-100" : "bg-gray-100"
                    }`}
                  >
                    <Ionicons name={iconName} size={isActive || isPendingPayment ? 20 : 16} color={iconColor} />
                  </View>
                  {!isLast && (
                    <View
                      className={`w-[2px] flex-grow my-1 ${
                        isCompleted ? "bg-green-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </View>

                {/* Cột phải: Thông tin Card */}
                <View className="flex-1 pb-6">
                  <View
                    className={`bg-white rounded-[20px] border p-4 shadow-sm active:opacity-95 ${borderStyle} ${
                      isActive ? "shadow-[#84AFEB]/10 border-primary" : ""
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-gray-800 text-[15px] font-bold flex-1 mr-2">
                        {step.step_name || specialtyName}
                      </Text>
                      <View className={`${statusBg} px-2.5 py-0.5 rounded-full border border-transparent`}>
                        <Text className={`${statusTextColor} text-[10px] font-bold`}>
                          {statusText}
                        </Text>
                      </View>
                    </View>

                    {/* Chi tiết phòng và số thứ tự */}
                    <View className="flex-row items-center gap-4 mt-1">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="location" size={13} color="#9CA3AF" />
                        <Text className="text-gray-500 text-[12px] font-semibold">
                          {roomName}
                        </Text>
                      </View>
                      {queueNumber && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="list" size={13} color="#9CA3AF" />
                          <Text className="text-gray-500 text-[12px] font-semibold">
                            Số thứ tự: <Text className="text-gray-800 font-bold">{queueNumber}</Text>
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Nút thanh toán trực tiếp từ timeline */}
                    {isPendingPayment && (
                      <Pressable
                        onPress={() => setSelectedStep(step)}
                        className="mt-3 bg-[#10B981] py-2 rounded-xl flex-row items-center justify-center gap-1 active:opacity-75"
                      >
                        <Ionicons name="card-outline" size={14} color="white" />
                        <Text className="text-white text-xs font-bold">Thanh toán ngay</Text>
                      </Pressable>
                    )}

                    {/* Hiển thị thêm thông tin chỉ đường hoặc ước tính cho bước đang chạy */}
                    {isActive && !isPendingPayment && (
                      <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between items-center">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="time-outline" size={12} color="#6B7280" />
                          <Text className="text-gray-400 text-[11px] font-medium">
                            Chờ ước tính: ~10 phút
                          </Text>
                        </View>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/(patient)/(tabs)/navigation",
                            })
                          }
                          className="bg-primary/10 px-3 py-1.5 rounded-full flex-row items-center gap-1 active:opacity-75"
                        >
                          <Ionicons name="navigate-outline" size={12} color={Colors.primary} />
                          <Text className="text-primary text-[11px] font-bold">Đường đi</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Payment QR Modal */}
      <Modal
        visible={!!selectedStep}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isCheckingPayment) setSelectedStep(null);
        }}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 space-y-6 max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
              <Text className="text-gray-800 text-lg font-bold">Quét Mã Chuyển Khoản</Text>
              <Pressable
                disabled={isCheckingPayment}
                onPress={() => setSelectedStep(null)}
                className="p-1 active:opacity-75"
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* QR Content */}
            <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
              <View className="items-center space-y-4">
                <Text className="text-gray-500 text-xs text-center px-4 leading-[18px]">
                  Mở ứng dụng ngân hàng và quét mã VietQR để đóng phí cho dịch vụ khám.
                </Text>

                {/* QR Image */}
                <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-md">
                  {qrImageUrl ? (
                    <Image
                      source={{ uri: qrImageUrl }}
                      className="w-52 h-52"
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="w-52 h-52 items-center justify-center bg-gray-50 rounded-xl">
                      <Text className="text-gray-400 text-xs font-semibold">Chưa có mã QR</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Dịch vụ</Text>
                    <Text className="text-gray-800 text-xs font-bold text-right flex-1 ml-4">
                      {selectedStep?.step_name || "Dịch vụ y tế"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Bệnh nhân</Text>
                    <Text className="text-gray-800 text-xs font-bold">{patientName}</Text>
                  </View>
                  <View className="border-t border-gray-100 my-1" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400 text-xs font-semibold">Trạng thái</Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time" size={13} color="#F59E0B" />
                      <Text className="text-[#F59E0B] text-xs font-bold">Chờ giao dịch</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Confirm Actions */}
              <View className="pt-2 gap-3 flex-row">
                <Pressable
                  disabled={isCheckingPayment}
                  onPress={() => setSelectedStep(null)}
                  className="flex-1 py-4 bg-gray-100 rounded-2xl items-center justify-center active:opacity-75"
                >
                  <Text className="text-gray-700 font-bold text-sm">Đóng</Text>
                </Pressable>
                <Pressable
                  disabled={isCheckingPayment}
                  onPress={handleConfirmPayment}
                  className="flex-[2] py-4 bg-primary rounded-2xl items-center justify-center flex-row gap-2 active:opacity-90"
                >
                  {isCheckingPayment ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-bold text-sm">Đang xác nhận...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <Text className="text-white font-bold text-sm">Tôi đã thanh toán xong</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
