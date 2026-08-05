import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { doctorService } from "@/features/booking/services/doctor.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import { sortStepsTopologically } from "@/shared/utils/flow.utils";
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

  // States for pending service orders (unpaid bills from doctor)
  const [pendingServiceOrders, setPendingServiceOrders] = useState<any[]>([]);
  const [isServiceOrderModalVisible, setIsServiceOrderModalVisible] = useState(false);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<any | null>(null);
  const [isFetchingServiceOrders, setIsFetchingServiceOrders] = useState(false);

  const loadPendingServiceOrders = async (showIndicator = false) => {
    if (!patientId) return;
    if (showIndicator) setIsFetchingServiceOrders(true);
    try {
      const response = await doctorService.getPendingServiceOrders(patientId);
      const data = response?.data || response || [];
      setPendingServiceOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Error loading pending service orders:", err);
      setPendingServiceOrders([]);
    } finally {
      setIsFetchingServiceOrders(false);
    }
  };

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
    if (patientId) {
      loadPendingServiceOrders(true);
    }
  }, [params.flowData, patientId]);

  // Vòng lặp tự động kiểm tra trạng thái thanh toán (polling 3s) của đơn dịch vụ chỉ định
  useEffect(() => {
    if (!selectedServiceOrder || !patientId) return;

    let intervalId: ReturnType<typeof setInterval>;

    const checkPayment = async () => {
      try {
        const response = await doctorService.getPendingServiceOrders(patientId);
        const data = response?.data || response || [];
        const pendingOrders = Array.isArray(data) ? data : [];

        // Tìm xem đơn hàng hiện tại có còn nằm trong danh sách pending không
        const currentOrder = pendingOrders.find(
          (order: any) => order.service_order_id === selectedServiceOrder.service_order_id
        );

        // Kiểm tra xem đơn hàng đó đã thanh toán hết các chi tiết chưa (hoặc không còn trong pending)
        const isPaid = !currentOrder || (
          Array.isArray(currentOrder.serviceOrderDetails) &&
          currentOrder.serviceOrderDetails.every((detail: any) => detail.status === 'PAID')
        );

        if (isPaid) {
          clearInterval(intervalId);
          Alert.alert(
            "Thanh toán thành công",
            "Đóng phí dịch vụ chỉ định thành công!",
            [
              {
                text: "Đồng ý",
                onPress: () => {
                  setSelectedServiceOrder(null);
                  setIsServiceOrderModalVisible(false);
                  loadPendingServiceOrders(true);
                  loadLatestFlow(true);
                }
              }
            ]
          );
        }
      } catch (err) {
        console.log("Error polling service order payment status:", err);
      }
    };

    checkPayment();
    intervalId = setInterval(checkPayment, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedServiceOrder, patientId]);

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
    loadPendingServiceOrders(false);
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

  // Lọc danh sách steps để loại bỏ các bước CANCELLED hoặc không có tên, kết hợp sắp xếp topo theo phụ thuộc
  const visibleSteps = useMemo(() => {
    if (!currentFlow || !currentFlow.steps) return [];
    const sorted = sortStepsTopologically(currentFlow.steps);
    return sorted.filter((s: any) => s.step_status !== "CANCELLED" && s.step_name !== null);
  }, [currentFlow]);

  // Xác định bước khám hiện hành đang chạy dựa trên sắp xếp topo
  const activeStepId = useMemo(() => {
    if (!currentFlow || !currentFlow.steps) return null;
    const sortedSteps = sortStepsTopologically(currentFlow.steps);
    const activeSteps = sortedSteps.filter(
      (s: any) => s.step_status !== "COMPLETED" && s.step_status !== "CANCELLED"
    );
    const currentActiveStep = activeSteps.find((s: any) => {
      if (!s.depends_on || s.depends_on.length === 0) return true;
      return s.depends_on.every((depId: string) => {
        const depStep = sortedSteps.find((fs: any) => fs.step_id === depId);
        return !depStep || depStep.step_status === "COMPLETED" || depStep.step_status === "CANCELLED";
      });
    });
    return currentActiveStep?.step_id || activeSteps[0]?.step_id || null;
  }, [currentFlow]);

  // Trích xuất mã ca khám (activeBookingId) một cách tối ưu nhất từ currentFlow
  const activeBookingId = useMemo(() => {
    if (!currentFlow) return null;
    
    // 1. Kiểm tra trực tiếp trên root của flow
    if (currentFlow.booking_id) return currentFlow.booking_id;
    if (currentFlow.bookingId) return currentFlow.bookingId;
    
    // 2. Kiểm tra trong object booking lồng ghép (Cấu trúc phổ biến trên Mobile)
    if (currentFlow.booking?.booking_id) return currentFlow.booking.booking_id;
    if (currentFlow.booking?.bookingId) return currentFlow.booking.bookingId;
    if (currentFlow.booking?.id) return currentFlow.booking.id;
    
    // 3. Kiểm tra trong các bước khám steps
    if (Array.isArray(currentFlow.steps) && currentFlow.steps.length > 0) {
      for (const step of currentFlow.steps) {
        if (step.booking_id) return step.booking_id;
        if (step.bookingId) return step.bookingId;
        if (step.flow?.booking_id) return step.flow.booking_id;
        if (step.flow?.booking?.booking_id) return step.flow.booking.booking_id;
        if (step.flow?.booking?.id) return step.flow.booking.id;
        if (step.flow_id) return step.flow_id;
      }
    }
    
    // 4. Fallback cuối cùng về flow_id
    if (currentFlow.flow_id) return currentFlow.flow_id;
    if (currentFlow.id) return currentFlow.id;
    
    return null;
  }, [currentFlow]);

  // Lọc danh sách đơn chưa thanh toán theo booking_id của ca khám hiện tại
  const unpaidServiceOrders = useMemo(() => {
    return pendingServiceOrders.filter((order: any) => {
      if (activeBookingId && order.booking_id !== activeBookingId) {
        return false;
      }
      return order.serviceOrderDetails?.some((detail: any) => detail.status === "PENDING");
    });
  }, [pendingServiceOrders, activeBookingId]);

  const qrImageUrl = selectedStep?.qr_text
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        selectedStep.qr_text
      )}`
    : "";

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Header Area */}
      <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="p-1 active:opacity-70 w-10 items-start"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-white text-[17px] font-bold">Lộ Trình Khám</Text>
          <Text className="text-white/80 text-[12px] font-medium mt-0.5">
            {patientName} • {formattedDate}
          </Text>
        </View>
        <Pressable
          onPress={() => setIsServiceOrderModalVisible(true)}
          className="p-1 active:opacity-70 w-10 items-end relative"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="wallet-outline" size={24} color="white" />
          {unpaidServiceOrders.length > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-[16px] items-center justify-center px-1">
              <Text className="text-[10px] text-white font-extrabold">{unpaidServiceOrders.length}</Text>
            </View>
          )}
        </Pressable>
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

      {/* Modal 1: Danh sách đơn dịch vụ chỉ định (ServiceOrderModal) */}
      <Modal
        visible={isServiceOrderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsServiceOrderModalVisible(false);
        }}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 space-y-6 max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <Ionicons name="basket-outline" size={20} color={Colors.primary} />
                <View>
                  <Text className="text-gray-800 text-[16px] font-extrabold uppercase">Các mục cần thanh toán</Text>
                  <Text className="text-gray-400 text-[10px] font-bold">Danh sách dịch vụ chỉ định từ Bác sĩ</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setIsServiceOrderModalVisible(false)}
                className="p-1 active:opacity-75"
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* List Content */}
            {isFetchingServiceOrders ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text className="text-gray-400 text-xs font-semibold mt-3">Đang tải danh sách dịch vụ...</Text>
              </View>
            ) : unpaidServiceOrders.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
                {unpaidServiceOrders.map((order: any) => {
                  const pendingDetails = order.serviceOrderDetails?.filter((d: any) => d.status === "PENDING") || [];
                  const displayTotal = pendingDetails.reduce((sum: number, detail: any) => sum + (detail.price_at_order * (detail.quantity || 1)), 0);

                  return (
                    <View key={order.service_order_id} className="bg-gray-50/50 border border-gray-100 rounded-3xl p-5 space-y-4">
                      {/* Order Info */}
                      <View className="flex-row justify-between items-center">
                        <View className="bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Text className="text-amber-800 text-[10px] font-bold">Chờ thanh toán</Text>
                        </View>
                        <Text className="text-gray-400 text-[10px] font-semibold">
                          Ngày tạo: {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "---"}
                        </Text>
                      </View>

                      <View className="border-t border-gray-200 border-dashed my-1" />

                      {/* Detail items */}
                      <View className="space-y-2">
                        {pendingDetails.map((detail: any) => (
                          <View key={detail.service_order_detail_id} className="flex-row justify-between items-start">
                            <View className="max-w-[70%] space-y-0.5">
                              <Text className="text-gray-800 text-xs font-extrabold">
                                {detail.name || order.name || "Dịch vụ y tế"}
                              </Text>
                              <Text className="text-gray-400 text-[10px] font-bold">
                                Số lượng: {detail.quantity || 1}
                              </Text>
                            </View>
                            <Text className="text-gray-700 text-xs font-black">
                              {(detail.price_at_order * (detail.quantity || 1)).toLocaleString("vi-VN")} đ
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Total & Pay button */}
                      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200/60 mt-1">
                        <View className="space-y-0.5">
                          <Text className="text-gray-400 text-[10px] font-bold uppercase">Tổng thanh toán</Text>
                          <Text className="text-gray-900 text-base font-black">
                            {displayTotal.toLocaleString("vi-VN")} đ
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => {
                            setSelectedServiceOrder({
                              ...order,
                              total_price: displayTotal,
                            });
                          }}
                          className="bg-primary px-5 py-2.5 rounded-xl flex-row items-center gap-1.5 active:opacity-75 shadow-sm shadow-primary/20"
                        >
                          <Ionicons name="card-outline" size={14} color="white" />
                          <Text className="text-white text-xs font-extrabold">Thanh toán QR</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="py-20 items-center justify-center space-y-2">
                <Text className="text-3xl">🎉</Text>
                <Text className="text-gray-800 font-extrabold text-sm">Bạn đã đóng hết phí chỉ định</Text>
                <Text className="text-gray-400 text-xs font-semibold text-center px-6">
                  Không tìm thấy yêu cầu thanh toán dịch vụ nào đang chờ xử lý.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 2: Quét mã QR thanh toán đơn dịch vụ chỉ định (ServiceOrderPaymentQrModal) */}
      <Modal
        visible={!!selectedServiceOrder}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedServiceOrder(null);
        }}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 space-y-6 max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
              <Text className="text-gray-800 text-lg font-bold">Thanh Toán Đơn Chỉ Định</Text>
              <Pressable
                onPress={() => setSelectedServiceOrder(null)}
                className="p-1 active:opacity-75"
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Scrollable Content */}
            {selectedServiceOrder && (
              <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
                <View className="items-center space-y-4">
                  <Text className="text-gray-500 text-xs text-center px-4 leading-[18px]">
                    Quét mã VietQR dưới đây bằng ứng dụng ngân hàng của bạn để thanh toán đơn dịch vụ chỉ định.
                  </Text>

                  {/* QR Image */}
                  <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-md">
                    {selectedServiceOrder.qr_code ? (
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            selectedServiceOrder.qr_code
                          )}`,
                        }}
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
                      <Text className="text-gray-400 text-xs">Số tiền</Text>
                      <Text className="text-primary text-xs font-extrabold">
                        {selectedServiceOrder.total_price ? selectedServiceOrder.total_price.toLocaleString("vi-VN") : 0} đ
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
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text className="text-primary text-xs font-bold">Đang chờ thanh toán...</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Close Button */}
                <View className="pt-2">
                  <Pressable
                    onPress={() => setSelectedServiceOrder(null)}
                    className="w-full py-4 bg-gray-100 rounded-2xl items-center justify-center active:opacity-75"
                  >
                    <Text className="text-gray-700 font-bold text-sm">Đóng</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
