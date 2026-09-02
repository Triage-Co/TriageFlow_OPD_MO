import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { PrescriptionDetailView } from "@/shared/components/PrescriptionDetailView";
import { visitService } from "../services/visit.service";
import { doctorService } from "@/features/booking/services/doctor.service";
import { invoiceService } from "@/features/invoice/services/invoice.service";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { sortStepsTopologically } from "@/shared/utils/flow.utils";
import { formatVND, getQrCodeUrl } from "@/shared/utils/string.utils";
import { formatDateTime, formatDate } from "@/shared/utils/date.utils";
import { AppAlert } from "@/shared/utils/alert.utils";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";

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

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  const [allFlows, setAllFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"today" | "prescription" | "invoice">("today");

  const [prescription, setPrescription] = useState<any | null>(null);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

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

    const sortedSteps = sortStepsTopologically(flow.steps || []);

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

    const rootExamStep =
      flow.steps?.find(
        (s: any) =>
          (!s.depends_on || s.depends_on.length === 0) &&
          s.step_type !== "PAYMENT" &&
          !s.step_name?.toLowerCase().startsWith("thanh toán") &&
          (s.staff_info || s.specialty_info || s.room_info || s.room_id)
      ) ||
      flow.steps?.find(
        (s: any) =>
          s.step_type !== "PAYMENT" &&
          !s.step_name?.toLowerCase().startsWith("thanh toán") &&
          (s.staff_info || s.specialty_info || s.room_info)
      );

    const examStep =
      rootExamStep ||
      activeSteps.find(
        (s: any) => s.specialty_info?.specialty_name || s.room_info?.room_name || s.staff_info?.full_name
      ) ||
      sortedSteps.find(
        (s: any) => s.specialty_info?.specialty_name || s.room_info?.room_name || s.staff_info?.full_name
      ) ||
      finalActiveStep;

    // 2. Helper lấy queue hợp lệ: Lọc bỏ CANCELLED, lấy queue mới nhất theo thời gian
    const getValidQueue = (step: any) => {
      if (!step?.queues || !Array.isArray(step.queues) || step.queues.length === 0) return null;
      const validQueues = step.queues.filter((q: any) => q.status !== "CANCELLED");
      if (validQueues.length === 0) return null;
      const sorted = [...validQueues].sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.enqueued_at || 0).getTime();
        const timeB = new Date(b.created_at || b.enqueued_at || 0).getTime();
        return timeB - timeA;
      });
      return sorted[0];
    };

    if (finalActiveStep) {
      const activeQueue =
        getValidQueue(currentActiveStep) ||
        getValidQueue(rootExamStep) ||
        getValidQueue(examStep) ||
        getValidQueue(finalActiveStep);

      const queueNumber = activeQueue?.queue_number || "--";
      const ticketCode =
        flow.ticket_code ||
        activeQueue?.ticket_code ||
        finalActiveStep?.ticket_code ||
        examStep?.ticket_code ||
        finalActiveStep?.qr_text ||
        flow.flow_id ||
        "";

      const specialtyName =
        rootExamStep?.specialty_info?.specialty_name ||
        examStep?.specialty_info?.specialty_name ||
        finalActiveStep?.specialty_info?.specialty_name ||
        flow.booking?.package?.package_name ||
        flow.package_name ||
        rootExamStep?.step_name ||
        examStep?.step_name ||
        "Khám chuyên khoa";

      const roomName =
        rootExamStep?.room_info?.room_name ||
        examStep?.room_info?.room_name ||
        finalActiveStep?.room_info?.room_name ||
        flow.booking?.slot?.shift?.room?.room_name ||
        flow.booking?.room?.room_name ||
        flow.room ||
        rootExamStep?.room_name ||
        examStep?.room_name ||
        finalActiveStep?.room_name ||
        "Đang xếp phòng";

      const doctorName =
        rootExamStep?.staff_info?.full_name ||
        examStep?.staff_info?.full_name ||
        finalActiveStep?.staff_info?.full_name ||
        flow.booking?.slot?.shift?.staff?.full_name ||
        flow.booking?.staff?.full_name ||
        flow.doctor ||
        rootExamStep?.staff?.full_name ||
        examStep?.staff?.full_name ||
        rootExamStep?.doctor_name ||
        examStep?.doctor_name ||
        "Bác sĩ phụ trách";

      const currentStepId = finalActiveStep.step_id;

      setActiveTicket({
        stepId: currentStepId,
        patientName: patientName,
        queueNumber: queueNumber,
        ticketCode: ticketCode,
        specialtyName: specialtyName,
        roomName: roomName,
        doctorName: doctorName,
        startTime: flow.booking?.slot?.start_time || "Đang xếp ca",
        status: flow.status || "IN_PROGRESS",
      });
      const targetStepId = rootExamStep?.step_id || examStep?.step_id || currentStepId;
      if (targetStepId) {
        doctorService
          .getStepDetail(targetStepId, { skipGlobalToast: true } as any)
          .then((res: any) => {
            const sDetail = res?.data || res;
            const slot = sDetail?.flow?.booking?.slot || sDetail?.booking?.slot;
            if (slot && slot.start_time) {
              const timeStr = slot.start_time;
              setActiveTicket((prev) => (prev ? { ...prev, startTime: timeStr } : null));
            }
          })
          .catch((err) => {
            console.log("[ActiveTicketView] fetch step detail error:", err);
          });
      }
    } else {
      setActiveTicket(null);
    }
  }, []);

  const todayFlows = useMemo(() => {
    const filtered = allFlows.filter((flow: any) => {
      const isValidStatus =
        flow.status === "IN_PROGRESS" ||
        flow.status === "CONFIRMED" ||
        flow.status === "PENDING" ||
        flow.status === "COMPLETED" ||
        flow.status === "FINISHED";
      return isValidStatus;
    });

    return filtered.sort((a: any, b: any) => {
      if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
      if (b.status === "IN_PROGRESS" && a.status !== "IN_PROGRESS") return 1;
      const timeA = a.create_at || "";
      const timeB = b.create_at || "";
      return timeB.localeCompare(timeA);
    });
  }, [allFlows]);

  const loadPrescription = useCallback(async (patientId: string, flow: any) => {
    setIsLoadingPrescription(true);
    try {
      if (!flow) {
        setPrescription(null);
        return;
      }

      const flowBookingId = flow?.booking_id || flow?.booking?.booking_id;
      let targetSessionId = flow?.session_id || flow?.visit_session_id;

      if (!targetSessionId && flow?.steps && Array.isArray(flow.steps)) {
        for (const st of flow.steps) {
          if (st.session_id || st.visit_session_id) {
            targetSessionId = st.session_id || st.visit_session_id;
            break;
          }
        }
      }

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

      if (targetSessionId) {
        const res = await visitService.getPrescriptionByVisitSession(targetSessionId);
        const presData = res?.data || res;
        setPrescription(
          presData && (presData.prescription_code || (presData.prescriptionDetails && presData.prescriptionDetails.length > 0))
            ? presData
            : null
        );
      } else {

        setPrescription(null);
      }
    } catch (err) {
      console.log("[ActiveTicketView] Error loading prescription for flow:", err);
      setPrescription(null);
    } finally {
      setIsLoadingPrescription(false);
    }
  }, []);

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
      AppAlert.info("Không tìm thấy dữ liệu lộ trình của phiếu khám này.");
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

  const qrImageUrl = getQrCodeUrl(activeTicket?.ticketCode || "", 250);

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => setIsPatientModalVisible(false)}
        onConfirm={handleConfirmPatient}
        selectedPatientId={selectedPatientId}
      />

      <View className="flex-1">

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
              Phiếu khám
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
              Hóa đơn
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "today" ? (

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
                  Chọn Lượt Khám
                </Text>
                <Text className="text-gray-400 text-xs mt-1 leading-[18px]">
                  Hồ sơ của {selectedPatientName} hiện có nhiều lượt khám. Vui lòng chọn một lượt để xem phiếu khám:
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
                <View className="bg-white rounded-[28px] border border-[#84AFEB]/30 shadow-md shadow-black/5 overflow-hidden">

                  {/* Header vé */}
                  <View className="bg-[#84AFEB]/10 flex-row items-center justify-between px-5 py-3.5 border-b border-[#84AFEB]/15">
                    <View className="flex-row items-center">
                      <View className="bg-primary/20 w-7 h-7 rounded-lg items-center justify-center mr-2">
                        <Ionicons name="medical" size={14} color={Colors.primary} />
                      </View>
                      <Text className="text-primary font-black text-[14px] tracking-wide">
                        TriageFlow OPD
                      </Text>
                    </View>

                    <View
                      className={`px-3 py-1 rounded-full border ${activeTicket.status === "COMPLETED" || activeTicket.status === "FINISHED"
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

                  {/* Thân vé */}
                  <View className="px-5 pt-5 pb-4 items-center">
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "800",
                        color: "#94A3B8",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      SỐ THỨ TỰ CỦA BẠN
                    </Text>

                    <Text
                      style={{
                        fontSize: 76,
                        fontWeight: "900",
                        color: "#0F172A",
                        lineHeight: 84,
                        marginVertical: 6,
                        textAlign: "center",
                      }}
                    >
                      {activeTicket.queueNumber}
                    </Text>

                    {/* Khung thông tin 2x2 */}
                    <View className="w-full bg-[#F8FAFC] rounded-[22px] p-4 border border-gray-100">
                      {/* Hàng 1: Phòng khám & Bác sĩ */}
                      <View className="flex-row pb-3.5 border-b border-gray-100">
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="location" size={13} color={Colors.primary} />
                            <Text className="text-gray-400 text-[11px] font-semibold">Phòng khám</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={2}>
                            {activeTicket.roomName}
                          </Text>
                        </View>

                        <View className="flex-1 pl-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="person-circle" size={13} color={Colors.primary} />
                            <Text className="text-gray-400 text-[11px] font-semibold">Bác sĩ phụ trách</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.doctorName || "Bác sĩ chuyên khoa"}
                          </Text>
                        </View>
                      </View>

                      {/* Hàng 2: Giờ vào khám & Ngày khám */}
                      <View className="flex-row py-3.5 border-b border-gray-100">
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="time" size={13} color={Colors.primary} />
                            <Text className="text-gray-400 text-[11px] font-semibold">Giờ vào khám</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {activeTicket.startTime}
                          </Text>
                        </View>

                        <View className="flex-1 pl-2">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="calendar" size={13} color={Colors.primary} />
                            <Text className="text-gray-400 text-[11px] font-semibold">Ngày khám</Text>
                          </View>
                          <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                            {formatDate(getFlowExamDate(activeFlow)) || "--"}
                          </Text>
                        </View>
                      </View>

                      {/* Hàng 3: Bệnh nhân */}
                      <View className="pt-3">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1.5">
                            <Ionicons name="person" size={13} color={Colors.primary} />
                            <Text className="text-gray-400 text-[11px] font-semibold">Bệnh nhân:</Text>
                          </View>
                          <Text className="text-gray-900 text-[13px] font-black" numberOfLines={1}>
                            {activeTicket.patientName}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Vết cắt vé bán nguyệt & Đường kẻ đứt nét */}
                  <View className="relative w-full my-1 justify-center">
                    <View className="w-full border-t border-dashed border-gray-200" />
                    <View className="absolute -left-3 top-1/2 -mt-3 w-6 h-6 rounded-full bg-[#F3F4F6] border-r border-[#84AFEB]/30" />
                    <View className="absolute -right-3 top-1/2 -mt-3 w-6 h-6 rounded-full bg-[#F3F4F6] border-l border-[#84AFEB]/30" />
                  </View>

                  {/* Mã QR */}
                  <View className="p-5 items-center">
                    <View className="bg-white p-4 rounded-[22px] border border-gray-100 shadow-sm items-center justify-center">
                      <Image
                        source={{ uri: qrImageUrl }}
                        style={{ width: 170, height: 170 }}
                        contentFit="contain"
                      />
                      {activeTicket.ticketCode ? (
                        <View className="mt-3 bg-gray-50 px-3.5 py-1 rounded-full border border-gray-100">
                          <Text className="text-gray-700 text-[12px] font-black tracking-wider text-center">
                            Mã vé: {activeTicket.ticketCode}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-gray-400 text-[11px] font-medium text-center mt-3">
                      Xuất trình mã này tại quầy tiếp nhận hoặc cửa phòng khám
                    </Text>
                  </View>
                </View>

                <View className="mt-6 gap-y-3 pb-8">
                  <AppButton
                    title="Lộ Trình Khám"
                    onPress={handleGoToClinicalRoute}
                  />
                </View>
              </ScrollView>
            </View>
          ) : (

            <View className="flex-1 justify-center items-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
                <Ionicons
                  name={!selectedPatientId ? "person-outline" : "ticket-outline"}
                  size={36}
                  color="#2563EB"
                />
              </View>
              <Text className="text-gray-900 text-base font-bold text-center">
                {!selectedPatientId
                  ? "Chưa chọn hồ sơ bệnh nhân"
                  : "Chưa có phiếu khám"}
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
          )
        ) : selectedTab === "prescription" ? (

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
              <PrescriptionDetailView prescription={prescription} />
            </ScrollView>
          ) : (

            <View className="flex-1 justify-center items-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
                <Ionicons name="medkit-outline" size={36} color="#2563EB" />
              </View>
              <Text className="text-gray-900 text-base font-bold text-center">
                Chưa có đơn thuốc
              </Text>
            </View>
          )
        ) : (

          isLoadingInvoice ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-400 text-[12px] font-medium mt-3">
                Đang tải thông tin hóa đơn...
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
                                {formatVND(detail.sub_total)}
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

                <View className="mt-4 pt-3 border-t border-gray-100 flex-row justify-between items-center">
                  <Text className="text-gray-900 text-sm font-black">Tổng cộng hóa đơn:</Text>
                  <Text className="text-primary text-lg font-black">
                    {formatVND(visitInvoice.total_amount)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : (

            <View className="flex-1 justify-center items-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={36} color="#2563EB" />
              </View>
              <Text className="text-gray-900 text-base font-bold text-center">
                Chưa có hóa đơn
              </Text>
            </View>
          )
        )}
      </View>
    </ScreenWrapper>
  );
}
