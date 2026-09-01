import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { visitService } from "../services/visit.service";
import { invoiceService } from "@/features/invoice/services/invoice.service";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { sortStepsTopologically } from "@/shared/utils/flow.utils";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
  TouchableOpacity,
} from "react-native";

interface ActiveTicket {
  stepId: string;
  patientName: string;
  queueNumber: string;
  ticketCode: string;
  specialtyName: string;
  roomName: string;
  doctorName?: string;
  startTime: string;
  status: string;
}

const getFlowExamDate = (flow: any): string => {
  if (flow.date) {
    return flow.date.split("T")[0];
  }
  const bookingDate = flow.booking?.slot?.shift?.date;
  if (bookingDate) {
    return bookingDate.split("T")[0];
  }
  if (flow.steps && Array.isArray(flow.steps)) {
    for (const step of flow.steps) {
      const stepBookingDate = step.flow?.booking?.slot?.shift?.date || step.booking?.slot?.shift?.date;
      if (stepBookingDate) {
        return stepBookingDate.split("T")[0];
      }
    }
  }
  return flow.create_at ? flow.create_at.split("T")[0] : "";
};

export function ActiveTicketView() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ tab?: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);
  const [activeFlow, setActiveFlow] = useState<any | null>(null);

  // States for patient selection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  // States for flows and tabs
  const [allFlows, setAllFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"today" | "prescription" | "invoice">("today");

  // State for prescription
  const [prescription, setPrescription] = useState<any | null>(null);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  // State for invoice / billing
  const [visitInvoice, setVisitInvoice] = useState<any | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  useEffect(() => {
    if (searchParams?.tab === "prescription" || searchParams?.tab === "today" || searchParams?.tab === "invoice") {
      setSelectedTab(searchParams.tab as any);
    }
  }, [searchParams?.tab]);

  const selectFlow = useCallback((flow: any, patientName: string) => {
    setSelectedFlow(flow);
    setActiveFlow(flow);

    // Sắp xếp các bước theo cấu trúc tô-pô & trọng số trạng thái tiến độ
    const sortedSteps = sortStepsTopologically(flow.steps || []);

    // Tìm bước khám active hiện tại
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

    const finalActiveStep = currentActiveStep || activeSteps[0] || sortedSteps[0];

    const examStep =
      activeSteps.find(
        (s: any) => s.specialty_info?.specialty_name || s.room_info?.room_name || s.queues?.[0]?.queue_number
      ) ||
      sortedSteps.find(
        (s: any) => s.specialty_info?.specialty_name || s.room_info?.room_name || s.queues?.[0]?.queue_number
      ) ||
      finalActiveStep;

    if (finalActiveStep) {
      const queueNumber = examStep?.queues?.[0]?.queue_number || "--";
      const ticketCode =
        flow.ticket_code ||
        examStep?.queues?.[0]?.ticket_code ||
        finalActiveStep?.ticket_code ||
        examStep?.ticket_code ||
        finalActiveStep?.qr_text ||
        flow.flow_id ||
        "";
      const specialtyName =
        flow.booking?.package?.package_name ||
        flow.package_name ||
        examStep?.specialty_info?.specialty_name ||
        examStep?.step_name ||
        "Khám chuyên khoa";
      const roomName =
        flow.booking?.slot?.shift?.room?.room_name ||
        flow.booking?.room?.room_name ||
        flow.room ||
        examStep?.room_info?.room_name ||
        examStep?.room?.room_name ||
        examStep?.room_name ||
        finalActiveStep?.room_info?.room_name ||
        finalActiveStep?.room?.room_name ||
        finalActiveStep?.room_name ||
        "Đang xếp phòng";
      const doctorName =
        flow.booking?.slot?.shift?.staff?.full_name ||
        flow.booking?.staff?.full_name ||
        flow.doctor ||
        examStep?.room_info?.staff_name ||
        examStep?.staff?.full_name ||
        examStep?.doctor_name ||
        finalActiveStep?.room_info?.staff_name ||
        finalActiveStep?.doctor_name ||
        "Bác sĩ phụ trách";

      let startTimeStr = flow.booking?.slot?.start_time || "Đang xếp ca";
      if (startTimeStr === "Đang xếp ca" && flow.create_at) {
        const timeParts = flow.create_at.split("T")[1];
        if (timeParts) {
          startTimeStr = timeParts.substring(0, 5); // Lấy HH:MM
        }
      }

      setActiveTicket({
        stepId: finalActiveStep.step_id,
        patientName: patientName,
        queueNumber: queueNumber,
        ticketCode: ticketCode,
        specialtyName: specialtyName,
        roomName: roomName,
        doctorName: doctorName,
        startTime: startTimeStr,
        status: flow.status || "IN_PROGRESS",
      });
    } else {
      setActiveTicket(null);
    }
  }, []);

  // Lọc tất cả ca khám của ngày hôm nay
  const todayFlows = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const filtered = allFlows.filter((flow: any) => {
      const examDate = getFlowExamDate(flow);
      const isToday = examDate === todayStr;
      const isValidStatus =
        flow.status === "IN_PROGRESS" ||
        flow.status === "COMPLETED" ||
        flow.status === "FINISHED" ||
        flow.status === "CONFIRMED";
      return isToday && isValidStatus;
    });

    // Ưu tiên ca IN_PROGRESS lên đầu, sau đó sắp xếp theo thời gian tạo mới nhất
    return filtered.sort((a: any, b: any) => {
      if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
      if (b.status === "IN_PROGRESS" && a.status !== "IN_PROGRESS") return 1;
      const timeA = a.create_at || "";
      const timeB = b.create_at || "";
      return timeB.localeCompare(timeA);
    });
  }, [allFlows]);

  // Cầm booking_id hoặc session_id của CHÍNH PHIÊN KHÁM ĐÓ để lấy đơn thuốc duy nhất của ca khám này
  const loadPrescription = useCallback(async (patientId: string, flow: any) => {
    setIsLoadingPrescription(true);
    try {
      if (!flow) {
        setPrescription(null);
        return;
      }

      const flowBookingId = flow?.booking_id || flow?.booking?.booking_id;
      let targetSessionId = flow?.session_id || flow?.visit_session_id;

      // 1. Kiểm tra session_id trong từng bước khám của flow
      if (!targetSessionId && flow?.steps && Array.isArray(flow.steps)) {
        for (const st of flow.steps) {
          if (st.session_id || st.visit_session_id) {
            targetSessionId = st.session_id || st.visit_session_id;
            break;
          }
        }
      }

      // 2. Nếu chưa có session_id trực tiếp, cầm booking_id để tìm chính xác session tương ứng
      if (!targetSessionId && flowBookingId && patientId) {
        const sessions = await visitService.getVisitSessions(patientId);
        const sessionList = Array.isArray(sessions) ? sessions : (sessions as any)?.data || [];
        if (sessionList.length > 0) {
          const matchedSession = sessionList.find((s: any) => s.booking_id === flowBookingId);
          if (matchedSession) {
            targetSessionId = matchedSession.visit_session_id || matchedSession.session_id;
          }
        }
      }

      // 3. Gọi API đơn thuốc nếu tìm thấy đúng phiên khám của ca này
      if (targetSessionId) {
        const res = await visitService.getPrescriptionByVisitSession(targetSessionId);
        const presData = res?.data || res;
        setPrescription(
          presData && (presData.prescription_code || (presData.prescriptionDetails && presData.prescriptionDetails.length > 0))
            ? presData
            : null
        );
      } else {
        // Phiên khám này chưa có đơn thuốc -> Set null
        setPrescription(null);
      }
    } catch (err) {
      console.log("[ActiveTicketView] Error loading prescription for flow:", err);
      setPrescription(null);
    } finally {
      setIsLoadingPrescription(false);
    }
  }, []);

  // Lấy chi tiết hóa đơn & viện phí của chính phiên khám hôm nay
  const loadVisitInvoice = useCallback(async (patientId: string, flow: any) => {
    setIsLoadingInvoice(true);
    try {
      if (!flow || !patientId) {
        setVisitInvoice(null);
        return;
      }
      const flowBookingId = flow?.booking_id || flow?.booking?.booking_id;
      if (flowBookingId) {
        const res = await invoiceService.getPatientVisitBilling(patientId, flowBookingId);
        if (res?.data?.visit) {
          setVisitInvoice(res.data.visit);
          return;
        }
      }
      // Fallback: Lấy hóa đơn mới nhất từ tổng hợp
      const res = await invoiceService.getPatientBilling(patientId);
      if (res?.data?.visits && res.data.visits.length > 0) {
        setVisitInvoice(res.data.visits[0]);
      } else {
        setVisitInvoice(null);
      }
    } catch (err) {
      console.log("[ActiveTicketView] Error loading invoice for flow:", err);
      setVisitInvoice(null);
    } finally {
      setIsLoadingInvoice(false);
    }
  }, []);

  const loadTicketData = useCallback(
    async (patientId: string, patientName: string, showLoadingIndicator = true) => {
      if (showLoadingIndicator) setIsLoading(true);
      try {
        const response = await visitService.getActiveFlow(patientId);
        console.log("[TicketTab] getActiveFlow response:", JSON.stringify(response, null, 2));

        if (!response || !response.data || response.data.length === 0) {
          setAllFlows([]);
          setPrescription(null);
          setVisitInvoice(null);
          return;
        }

        setAllFlows(response.data);
      } catch (err) {
        console.error("[TicketTab] Lỗi tải phiếu khám:", err);
        setAllFlows([]);
        setPrescription(null);
        setVisitInvoice(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Sync selected flow when todayFlows changes
  useEffect(() => {
    if (todayFlows.length === 1) {
      selectFlow(todayFlows[0], selectedPatientName);
      if (selectedPatientId) {
        loadPrescription(selectedPatientId, todayFlows[0]);
        loadVisitInvoice(selectedPatientId, todayFlows[0]);
      }
    } else if (todayFlows.length > 1) {
      if (selectedFlow) {
        const matchedFlow = todayFlows.find((f: any) => f.flow_id === selectedFlow.flow_id);
        if (matchedFlow) {
          selectFlow(matchedFlow, selectedPatientName);
          if (selectedPatientId) {
            loadPrescription(selectedPatientId, matchedFlow);
            loadVisitInvoice(selectedPatientId, matchedFlow);
          }
          return;
        }
      }
      setActiveTicket(null);
      setActiveFlow(null);
      setPrescription(null);
      setVisitInvoice(null);
    } else {
      setActiveTicket(null);
      setActiveFlow(null);
      setPrescription(null);
      setVisitInvoice(null);
    }
  }, [todayFlows, selectedPatientName, selectFlow, selectedPatientId, loadPrescription, loadVisitInvoice, selectedFlow]);

  // Tự động kích hoạt Modal chọn bệnh nhân 1 lần khi mới vào
  useEffect(() => {
    setIsPatientModalVisible(true);
  }, []);

  const handleConfirmPatient = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setIsPatientModalVisible(false);
    setSelectedFlow(null);
    loadTicketData(patientId, patientName, true);
  };

  const handleRefresh = () => {
    if (selectedPatientId) {
      setIsRefreshing(true);
      loadTicketData(selectedPatientId, selectedPatientName, false);
      if (selectedTab === "prescription") {
        loadPrescription(selectedPatientId, activeFlow || selectedFlow);
      } else if (selectedTab === "invoice") {
        loadVisitInvoice(selectedPatientId, activeFlow || selectedFlow);
      }
    }
  };

  const handleGoToClinicalRoute = () => {
    if (!activeFlow) {
      Alert.alert("Thông báo", "Không tìm thấy dữ liệu lộ trình của phiếu khám hôm nay.");
      return;
    }
    router.push({
      pathname: "/(patient)/visit/clinical-route",
      params: {
        flowData: JSON.stringify(activeFlow),
        patientName: selectedPatientName,
        patientId: selectedPatientId || undefined,
      },
    });
  };

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "—";
    const parts = dateTimeStr.split("T");
    const dateStr = parts[0].split("-").reverse().join("/");
    const timeStr = parts[1] ? parts[1].substring(0, 5) : "";
    return `${dateStr} ${timeStr}`;
  };

  const qrImageUrl = activeTicket?.ticketCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      activeTicket.ticketCode
    )}`
    : "";

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Patient Picker Modal */}
      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => setIsPatientModalVisible(false)}
        onConfirm={handleConfirmPatient}
        selectedPatientId={selectedPatientId}
      />

      <View className="flex-1">
        {/* Header Area */}
        <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
          <Text className="text-white text-[18px] font-bold">
            Phiếu Khám Y Tế
          </Text>
          <TouchableOpacity
            onPress={() => setIsPatientModalVisible(true)}
            style={{ padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Subtitle hiển thị tên bệnh nhân đang chọn */}
        {selectedPatientName ? (
          <View className="bg-primary/10 px-5 py-2 flex-row items-center justify-between border-b border-[#84AFEB]/20">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <Ionicons name="person-circle-outline" size={16} color={Colors.primary} />
              <Text className="text-gray-700 text-xs font-medium" numberOfLines={1}>
                Đang xem: <Text className="font-bold text-gray-900">{selectedPatientName}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsPatientModalVisible(true)}
              className="bg-white/80 px-2 py-1 rounded-md border border-[#84AFEB]/30"
            >
              <Text className="text-primary text-[10px] font-bold">Đổi hồ sơ</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Tab Selection: [ Hôm nay | Đơn thuốc | Viện phí ] */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F3F4F6",
            padding: 4,
            borderRadius: 9999,
            marginHorizontal: 20,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedTab("today");
            }}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: selectedTab === "today" ? "#FFFFFF" : "transparent",
              shadowColor: selectedTab === "today" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 1.5,
              elevation: selectedTab === "today" ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: selectedTab === "today" ? Colors.primary : "#6B7280",
              }}
            >
              Hôm nay
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedTab("prescription");
              if (selectedPatientId) {
                loadPrescription(selectedPatientId, activeFlow || selectedFlow);
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: selectedTab === "prescription" ? "#FFFFFF" : "transparent",
              shadowColor: selectedTab === "prescription" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 1.5,
              elevation: selectedTab === "prescription" ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: selectedTab === "prescription" ? Colors.primary : "#6B7280",
              }}
            >
              Đơn thuốc
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedTab("invoice");
              if (selectedPatientId) {
                loadVisitInvoice(selectedPatientId, activeFlow || selectedFlow);
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: selectedTab === "invoice" ? "#FFFFFF" : "transparent",
              shadowColor: selectedTab === "invoice" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 1.5,
              elevation: selectedTab === "invoice" ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: selectedTab === "invoice" ? Colors.primary : "#6B7280",
              }}
            >
              Viện phí
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nội dung Tab */}
        {selectedTab === "today" ? (
          /* TAB HÔM NAY */
          isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-400 text-[12px] font-medium mt-3">
                Đang tải thông tin phiếu khám...
              </Text>
            </View>
          ) : todayFlows.length > 1 && !activeTicket ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1 px-5 mt-5"
              contentContainerStyle={{ paddingBottom: 50 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                />
              }
            >
              <View className="mb-4">
                <Text className="text-gray-800 text-[16px] font-bold">
                  Chọn Lượt Khám Hôm Nay
                </Text>
                <Text className="text-gray-400 text-xs mt-1 leading-[18px]">
                  Hồ sơ của {selectedPatientName} hiện có nhiều lượt khám hôm nay. Vui lòng chọn một lượt để xem phiếu khám:
                </Text>
              </View>

              {todayFlows.map((flowItem) => {
                const examStep =
                  flowItem.steps?.find((s: any) => s.specialty_info?.specialty_name) || flowItem.steps?.[0];
                const specialtyName =
                  examStep?.specialty_info?.specialty_name || examStep?.step_name || "Lượt khám y tế";
                const createdTime = flowItem.create_at?.split("T")[1]?.substring(0, 5) || "--:--";
                const isCompleted =
                  flowItem.status === "COMPLETED" || flowItem.status === "FINISHED";

                return (
                  <Pressable
                    key={flowItem.flow_id}
                    onPress={() => {
                      selectFlow(flowItem, selectedPatientName);
                      if (selectedPatientId) {
                        loadPrescription(selectedPatientId, flowItem);
                      }
                    }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm active:opacity-90 flex-row justify-between items-center"
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1.5">
                        <View
                          className={`px-2 py-0.5 rounded-full border ${isCompleted
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-blue-50 border-blue-100"
                            }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${isCompleted ? "text-emerald-700" : "text-primary"
                              }`}
                          >
                            {isCompleted ? "Đã hoàn thành" : "Đang diễn ra"}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-[11px] font-bold">
                          Lúc {createdTime}
                        </Text>
                      </View>
                      <Text className="text-gray-800 text-[14px] font-extrabold mb-1">
                        {specialtyName}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : activeTicket ? (
            <View className="flex-1 justify-between">
              {todayFlows.length > 1 && (
                <Pressable
                  onPress={() => {
                    setActiveTicket(null);
                    setSelectedFlow(null);
                  }}
                  className="mx-5 mt-4 bg-gray-100 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-75"
                >
                  <Ionicons name="swap-horizontal" size={14} color="#4B5563" />
                  <Text className="text-gray-700 text-xs font-bold">Đổi lượt khám khác</Text>
                </Pressable>
              )}

              {/* Scrollable Card Area */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1 px-5 mt-3"
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
                  <View className="bg-[#84AFEB]/10 flex-row items-center justify-between px-5 py-4 border-b border-[#84AFEB]/15">
                    <View className="flex-row items-center">
                      <View className="bg-primary/20 w-7 h-7 rounded-lg items-center justify-center mr-2">
                        <Ionicons name="medical" size={14} color={Colors.primary} />
                      </View>
                      <Text className="text-primary font-bold text-[14px]">
                        TriageFlowOPD
                      </Text>
                    </View>

                    {/* Badge trạng thái ca khám */}
                    <View
                      className={`px-2.5 py-0.5 rounded-full border ${activeTicket.status === "COMPLETED" || activeTicket.status === "FINISHED"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-blue-50 border-blue-200"
                        }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${activeTicket.status === "COMPLETED" || activeTicket.status === "FINISHED"
                            ? "text-emerald-700"
                            : "text-blue-700"
                          }`}
                      >
                        {activeTicket.status === "COMPLETED" || activeTicket.status === "FINISHED"
                          ? "ĐÃ HOÀN THÀNH"
                          : "ĐANG DIỄN RA"}
                      </Text>
                    </View>
                  </View>

                  {/* Nội dung chính */}
                  <View className="p-6 items-center">
                    <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      Số thứ tự
                    </Text>
                    <Text className="text-gray-800 text-[52px] font-black leading-none mb-6">
                      {activeTicket.queueNumber}
                    </Text>

                    {/* Bảng thông tin chi tiết */}
                    <View className="w-full bg-[#84AFEB]/10 rounded-[24px] p-5 border border-[#84AFEB]/20 mb-6">
                      <View className="flex-row mb-4">
                        {/* Cột trái: Chuyên khoa / Gói khám */}
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="medical" size={12} color="#6B7280" />
                            <Text className="text-gray-500 text-[11px] font-medium">Dịch vụ / Gói khám</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.specialtyName}
                          </Text>
                        </View>

                        {/* Cột phải: Phòng khám */}
                        <View className="flex-1 pl-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="location" size={12} color="#6B7280" />
                            <Text className="text-gray-500 text-[11px] font-medium">Phòng khám</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.roomName}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row mb-4">
                        {/* Cột trái: Bác sĩ phụ trách */}
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="person-circle" size={12} color="#6B7280" />
                            <Text className="text-gray-500 text-[11px] font-medium">Bác sĩ phụ trách</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.doctorName || "Bác sĩ chuyên khoa"}
                          </Text>
                        </View>

                        {/* Cột phải: Thời gian đăng ký */}
                        <View className="flex-1 pl-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="time" size={12} color="#6B7280" />
                            <Text className="text-gray-500 text-[11px] font-medium">Thời gian đăng ký</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.startTime}
                          </Text>
                        </View>
                      </View>

                      {/* Hàng 3: Bệnh nhân */}
                      <View className="pt-2 border-t border-[#84AFEB]/20">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1.5">
                            <Ionicons name="person" size={12} color="#6B7280" />
                            <Text className="text-gray-500 text-[11px] font-medium">Bệnh nhân:</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.patientName}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Dotted divider */}
                    <View className="w-full border-t border-dashed border-gray-200 my-4" />

                    {/* QR Code */}
                    <View className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm items-center">
                      <Image
                        source={{ uri: qrImageUrl }}
                        className="w-44 h-44"
                        resizeMode="contain"
                      />
                      {activeTicket.ticketCode ? (
                        <Text className="text-gray-800 text-[13px] font-black mt-3 tracking-wider text-center">
                          Mã phiếu: {activeTicket.ticketCode}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Nút xem lộ trình */}
                <View className="mt-6 gap-y-3 pb-8">
                  <AppButton
                    title="Lộ Trình Khám"
                    onPress={handleGoToClinicalRoute}
                  />
                </View>
              </ScrollView>
            </View>
          ) : (
            /* Trạng thái không có vé hôm nay */
            <View className="flex-1 justify-between px-6 py-12 items-center">
              <View className="flex-1 items-center justify-center">
                <View className="w-24 h-24 rounded-full bg-[#84AFEB]/10 items-center justify-center mb-6">
                  <Ionicons
                    name={!selectedPatientId ? "person-outline" : "ticket-outline"}
                    size={36}
                    color={Colors.primary}
                  />
                </View>
                <Text className="text-gray-800 text-[18px] font-extrabold mb-2 text-center">
                  {!selectedPatientId
                    ? "Chưa chọn hồ sơ bệnh nhân"
                    : "Không có phiếu khám hôm nay"}
                </Text>
                <Text className="text-gray-400 text-[13px] font-medium text-center px-4 leading-[20px]">
                  {selectedPatientName
                    ? `Hồ sơ ${selectedPatientName} chưa có lượt khám nào trong ngày hôm nay.`
                    : "Vui lòng chọn hồ sơ bệnh nhân để xem phiếu khám."}
                </Text>

                {!selectedPatientId && (
                  <TouchableOpacity
                    onPress={() => setIsPatientModalVisible(true)}
                    activeOpacity={0.8}
                    className="mt-6 bg-primary px-6 py-3 rounded-xl flex-row items-center gap-2 shadow-sm shadow-primary/30"
                  >
                    <Ionicons name="people" size={18} color="white" />
                    <Text className="text-white font-bold text-sm">Chọn hồ sơ bệnh nhân</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        ) : selectedTab === "prescription" ? (
          /* TAB ĐƠN THUỐC */
          isLoadingPrescription ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-400 text-[12px] font-medium mt-3">
                Đang tải đơn thuốc của phiên khám...
              </Text>
            </View>
          ) : prescription ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1 px-5 mt-4"
              contentContainerStyle={{ paddingBottom: 80 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                />
              }
            >
              {/* Header Đơn thuốc */}
              <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2.5 mb-3">
                  <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
                    <Ionicons name="receipt" size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-[16px] font-extrabold">
                      Đơn Thuốc Phiên Khám
                    </Text>
                    <Text className="text-gray-400 text-[11px] mt-0.5">
                      Mã đơn: {prescription.prescription_code || "—"}
                    </Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-2xl p-4 gap-2.5 border border-gray-100">
                  {prescription.doctor?.full_name && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500 text-xs font-medium">Bác sĩ kê đơn:</Text>
                      <Text className="text-gray-900 text-xs font-bold">
                        BS. {prescription.doctor.full_name}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-xs font-medium">Ngày kê đơn:</Text>
                    <Text className="text-gray-900 text-xs font-bold">
                      {formatDateTime(prescription.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Lời dặn / Chẩn đoán */}
              {prescription.diagnosis_note && (
                <View className="bg-blue-50/70 rounded-3xl p-5 border border-blue-100 shadow-sm mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="information-circle" size={18} color="#2563EB" />
                    <Text className="text-blue-900 text-[14px] font-bold">
                      Chẩn đoán & Lời dặn của Bác sĩ
                    </Text>
                  </View>
                  <Text className="text-blue-950 text-xs leading-[20px] font-medium pl-6">
                    {prescription.diagnosis_note}
                  </Text>
                </View>
              )}

              {/* Danh sách thuốc */}
              <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <Ionicons name="medkit" size={18} color={Colors.primary} />
                  <Text className="text-gray-900 text-[15px] font-bold">
                    Danh mục thuốc ({prescription.prescriptionDetails?.length || 0})
                  </Text>
                </View>

                {prescription.prescriptionDetails && prescription.prescriptionDetails.length > 0 ? (
                  <View className="gap-3">
                    {prescription.prescriptionDetails.map((item: any, idx: number) => {
                      const medicineName =
                        item.medicine?.medicine_name || item.medicine_name || `Thuốc ${idx + 1}`;
                      const unit = item.medicine?.unit || "Đơn vị";

                      return (
                        <View
                          key={item.prescription_detail_id || idx}
                          className="bg-gray-50 p-4 rounded-2xl border border-gray-100"
                        >
                          <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-900 text-[14px] font-bold flex-1 mr-2">
                              {idx + 1}. {medicineName}
                            </Text>
                            <View className="bg-blue-100 px-2.5 py-0.5 rounded-md">
                              <Text className="text-primary text-[11px] font-black">
                                SL: {item.quantity} {unit}
                              </Text>
                            </View>
                          </View>

                          {item.dosage_instruction && (
                            <Text className="text-gray-600 text-xs leading-[18px]">
                              {item.dosage_instruction}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text className="text-gray-400 text-xs text-center py-4">
                    Không có chi tiết danh mục thuốc.
                  </Text>
                )}
              </View>
            </ScrollView>
          ) : (
            /* Trạng thái chưa có đơn thuốc của phiên khám này */
            <View className="flex-1 justify-center items-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
                <Ionicons name="medkit-outline" size={36} color="#2563EB" />
              </View>
              <Text className="text-gray-900 text-base font-bold mb-1.5 text-center">
                Chưa có đơn thuốc của phiên khám này
              </Text>
              <Text className="text-gray-400 text-xs text-center px-6 leading-5">
                Bác sĩ đang thực hiện ca khám hoặc chưa hoàn tất kê đơn. Đơn thuốc sẽ xuất hiện tại đây ngay khi bác sĩ hoàn thành.
              </Text>
            </View>
          )
        ) : (
          /* TAB VIỆN PHÍ */
          isLoadingInvoice ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-400 text-[12px] font-medium mt-3">
                Đang tải thông tin viện phí của phiên khám...
              </Text>
            </View>
          ) : visitInvoice ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1 px-5 mt-4"
              contentContainerStyle={{ paddingBottom: 80 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                />
              }
            >
              {/* Bảng kê chi tiết dịch vụ */}
              <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <Ionicons name="list-outline" size={18} color={Colors.primary} />
                  <Text className="text-gray-900 text-[15px] font-bold">
                    Bảng kê dịch vụ ({visitInvoice.orders?.length || 0})
                  </Text>
                </View>

                {visitInvoice.orders && visitInvoice.orders.length > 0 ? (
                  <View className="gap-3">
                    {visitInvoice.orders.map((order: any, idx: number) => (
                      <View
                        key={order.service_order_id || idx}
                        className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100"
                      >
                        <View className="flex-row items-center pb-2 border-b border-gray-200">
                          <Text className="text-gray-900 text-xs font-bold flex-1" numberOfLines={1}>
                            {order.name || `Chỉ định #${idx + 1}`}
                          </Text>
                        </View>

                        {order.service_order_details && order.service_order_details.length > 0 ? (
                          order.service_order_details.map((detail: any, dIdx: number) => (
                            <View key={dIdx} className="flex-row justify-between items-center mt-1.5">
                              <Text className="text-gray-600 text-[11px] font-medium flex-1 mr-2" numberOfLines={1}>
                                • {detail.name || "Dịch vụ"}
                              </Text>
                              <Text className="text-gray-800 text-[11px] font-bold">
                                {(detail.sub_total || 0).toLocaleString("vi-VN")} đ
                              </Text>
                            </View>
                          ))
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-400 text-xs text-center py-4">
                    Không có chi tiết danh mục dịch vụ.
                  </Text>
                )}

                {/* Tổng kết tiền */}
                <View className="mt-4 pt-3 border-t border-gray-100 flex-row justify-between items-center">
                  <Text className="text-gray-900 text-sm font-black">Tổng cộng viện phí:</Text>
                  <Text className="text-primary text-lg font-black">
                    {(visitInvoice.total_amount || 0).toLocaleString("vi-VN")} đ
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            /* Trạng thái chưa có viện phí của phiên khám này */
            <View className="flex-1 justify-center items-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={36} color="#2563EB" />
              </View>
              <Text className="text-gray-900 text-base font-bold mb-1.5 text-center">
                Chưa có thông tin viện phí của phiên khám này
              </Text>
              <Text className="text-gray-400 text-xs text-center px-6 leading-5">
                Các khoản chi phí dịch vụ khám, xét nghiệm và thuốc sẽ hiển thị tại đây ngay khi bác sĩ chỉ định.
              </Text>
            </View>
          )
        )}
      </View>
    </ScreenWrapper>
  );
}
