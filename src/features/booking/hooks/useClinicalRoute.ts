import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { doctorService } from "../services/doctor.service";
import { sortStepsTopologically } from "@/shared/utils/flow.utils";

export function useClinicalRoute() {
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

  const loadPendingServiceOrders = useCallback(async (showIndicator = false) => {
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
  }, [patientId]);

  const loadLatestFlow = useCallback(async (showIndicator = false) => {
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
  }, [patientId, currentFlow?.flow_id]);

  // Khởi tạo flow từ tham số route hoặc tự động tải từ server nếu không truyền flowData
  useEffect(() => {
    if (params.flowData) {
      try {
        setCurrentFlow(JSON.parse(params.flowData as string));
      } catch (e) {
        console.error("Lỗi parse flowData trong ClinicalRouteHook:", e);
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
  }, [selectedServiceOrder, patientId, loadPendingServiceOrders, loadLatestFlow]);

  const handleRefresh = useCallback(() => {
    loadLatestFlow(true);
    loadPendingServiceOrders(false);
  }, [loadLatestFlow, loadPendingServiceOrders]);

  // Xác nhận thanh toán & cập nhật lại số thứ tự lộ trình khám
  const handleConfirmPayment = useCallback(async () => {
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
  }, [selectedStep, loadLatestFlow]);

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

  const qrImageUrl = useMemo(() => {
    if (!selectedStep?.qr_text) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      selectedStep.qr_text
    )}`;
  }, [selectedStep?.qr_text]);

  return {
    patientName,
    patientId,
    currentFlow,
    isLoading,
    isRefreshing,
    selectedStep,
    setSelectedStep,
    isCheckingPayment,
    isServiceOrderModalVisible,
    setIsServiceOrderModalVisible,
    selectedServiceOrder,
    setSelectedServiceOrder,
    isFetchingServiceOrders,
    unpaidServiceOrders,
    formattedDate,
    visibleSteps,
    activeStepId,
    qrImageUrl,
    handleRefresh,
    handleConfirmPayment,
  };
}
