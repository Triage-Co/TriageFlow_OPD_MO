import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { visitService } from "../services/visit.service";
import { useRouter } from "expo-router";
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
  specialtyName: string;
  roomName: string;
  startTime: string;
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

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);
  const [activeFlow, setActiveFlow] = useState<any | null>(null);

  // States for patient selection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  // States for multiple flows support
  const [allFlows, setAllFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"today" | "upcoming">("today");

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

    // Ưu tiên tìm trong danh sách các bước active trước, nếu không có mới tìm trong toàn bộ
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
      const specialtyName = examStep?.specialty_info?.specialty_name || examStep?.step_name || "Khám bệnh";
      const roomName = examStep?.room_info?.room_name || "Đang xếp phòng";

      let startTimeStr = "Đang xếp ca";
      if (flow.create_at) {
        const timeParts = flow.create_at.split("T")[1];
        if (timeParts) {
          startTimeStr = timeParts.substring(0, 5); // Lấy HH:MM
        }
      }

      setActiveTicket({
        stepId: finalActiveStep.step_id,
        patientName: patientName,
        queueNumber: queueNumber,
        specialtyName: specialtyName,
        roomName: roomName,
        startTime: startTimeStr,
      });
    } else {
      setActiveTicket(null);
    }
  }, []);

  const filterFlowsByTab = useCallback((flows: any[], tab: "today" | "upcoming") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    return flows.filter((flow: any) => {
      const examDate = getFlowExamDate(flow);
      if (tab === "today") {
        return examDate === todayStr && flow.status === "IN_PROGRESS";
      } else {
        return examDate >= tomorrowStr;
      }
    });
  }, []);

  const currentFlows = useMemo(() => {
    return filterFlowsByTab(allFlows, selectedTab);
  }, [allFlows, selectedTab, filterFlowsByTab]);

  const loadTicketData = useCallback(async (patientId: string, patientName: string, showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const response = await visitService.getActiveFlow(patientId);
      console.log("[TicketTab] getActiveFlow response:", JSON.stringify(response, null, 2));

      if (!response || !response.data || response.data.length === 0) {
        setAllFlows([]);
        return;
      }

      setAllFlows(response.data);
    } catch (err) {
      console.error("[TicketTab] Lỗi tải phiếu khám:", err);
      setAllFlows([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Sync selected flow when currentFlows changes
  useEffect(() => {
    if (currentFlows.length === 1) {
      selectFlow(currentFlows[0], selectedPatientName);
    } else if (currentFlows.length > 1) {
      if (selectedFlow) {
        const matchedFlow = currentFlows.find((f: any) => f.flow_id === selectedFlow.flow_id);
        if (matchedFlow) {
          selectFlow(matchedFlow, selectedPatientName);
          return;
        }
      }
      setActiveTicket(null);
      setActiveFlow(null);
    } else {
      setActiveTicket(null);
      setActiveFlow(null);
    }
  }, [currentFlows, selectedPatientName, selectFlow]);

  // Tự động kích hoạt Modal chọn bệnh nhân nếu chưa chọn
  useEffect(() => {
    if (!selectedPatientId) {
      setIsPatientModalVisible(true);
    }
  }, [selectedPatientId]);

  const handleConfirmPatient = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setIsPatientModalVisible(false);
    setSelectedFlow(null); // Reset flow đã chọn khi đổi bệnh nhân
    loadTicketData(patientId, patientName, true);
  };

  const handleRefresh = () => {
    if (selectedPatientId) {
      setIsRefreshing(true);
      loadTicketData(selectedPatientId, selectedPatientName, false);
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

  const qrImageUrl = activeTicket
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      activeTicket.queueNumber || "0"
    )}`
    : "";

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style={activeTicket ? "light" : "dark"} />

      {/* Patient selector modal */}
      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => {
          if (!selectedPatientId) {
            Alert.alert("Yêu cầu", "Vui lòng chọn hồ sơ bệnh nhân để tiếp tục.");
          } else {
            setIsPatientModalVisible(false);
          }
        }}
        onConfirm={handleConfirmPatient}
        selectedPatientId={selectedPatientId}
      />

      <View className="flex-1 justify-between">
        {/* Header Area */}
        <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
          <View className="w-10" />
          <Text className="text-white text-[17px] font-bold">
            Phiếu khám của tôi
          </Text>
          <Pressable
            onPress={() => setIsPatientModalVisible(true)}
            className="p-1 active:opacity-70"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people" size={22} color="white" />
          </Pressable>
        </View>

        {/* Sub-tabs for filtering Today vs Upcoming */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F3F4F6",
            padding: 4,
            borderRadius: 9999,
            marginLeft: 20,
            marginRight: 20,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedTab("today");
              setSelectedFlow(null);
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
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
                fontSize: 13,
                fontWeight: "bold",
                color: selectedTab === "today" ? Colors.primary : "#6B7280",
              }}
            >
              Hôm nay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedTab("upcoming");
              setSelectedFlow(null);
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: selectedTab === "upcoming" ? "#FFFFFF" : "transparent",
              shadowColor: selectedTab === "upcoming" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 1.5,
              elevation: selectedTab === "upcoming" ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: selectedTab === "upcoming" ? Colors.primary : "#6B7280",
              }}
            >
              Lịch hẹn
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-[12px] font-medium mt-3">
              Đang tải thông tin phiếu khám...
            </Text>
          </View>
        ) : currentFlows.length > 1 && !activeTicket ? (
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
                {selectedTab === "today" ? "Chọn Lượt Khám Hôm Nay" : "Chọn Lịch Hẹn Đăng Ký"}
              </Text>
              <Text className="text-gray-400 text-xs mt-1 leading-[18px]">
                {selectedTab === "today"
                  ? `Hồ sơ của ${selectedPatientName} hiện có nhiều lượt khám đang diễn ra hôm nay. Vui lòng chọn một lượt để xem phiếu khám:`
                  : `Hồ sơ của ${selectedPatientName} có nhiều lịch hẹn đăng ký sắp tới. Vui lòng chọn một lượt để xem chi tiết:`}
              </Text>
            </View>

            {currentFlows.map((flowItem) => {
              const examStep = flowItem.steps?.find((s: any) => s.specialty_info?.specialty_name) || flowItem.steps?.[0];
              const specialtyName = examStep?.specialty_info?.specialty_name || examStep?.step_name || "Lượt khám y tế";

              const examDate = getFlowExamDate(flowItem);
              let dateText = "";
              if (examDate) {
                const dateParts = examDate.split("-");
                if (dateParts.length === 3) {
                  dateText = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }
              }

              let createdTime = "";
              if (flowItem.create_at) {
                const parts = flowItem.create_at.split("T");
                const time = parts[1] ? parts[1].substring(0, 5) : "";
                createdTime = `${time}`;
              }

              return (
                <Pressable
                  key={flowItem.flow_id}
                  onPress={() => selectFlow(flowItem, selectedPatientName)}
                  className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm active:opacity-90 flex-row justify-between items-center"
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <View className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <Text className="text-primary text-[10px] font-bold">Lượt khám</Text>
                      </View>
                      <Text className="text-gray-400 text-[11px] font-bold">
                        {selectedTab === "today" ? `Lúc ${createdTime}` : `${dateText} - Lúc ${createdTime}`}
                      </Text>
                    </View>
                    <Text className="text-gray-800 text-[14px] font-extrabold mb-1">
                      {specialtyName}
                    </Text>
                    {selectedTab === "today" && (
                      <Text className="text-gray-400 text-[11px] font-medium">
                        Trạng thái: <Text className="text-primary font-bold">Đang diễn ra</Text>
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : activeTicket ? (
          <View className="flex-1 justify-between">
            {currentFlows.length > 1 && (
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
                    {activeTicket.queueNumber}
                  </Text>

                  {/* Bảng thông tin chi tiết */}
                  <View className="w-full bg-[#84AFEB]/10 rounded-[24px] p-5 border border-[#84AFEB]/20 mb-6">
                    <View className="flex-row mb-4">
                      {/* Cột trái: Chuyên khoa */}
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <Ionicons name="medical" size={12} color="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Chuyên khoa</Text>
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

                    <View className="flex-row">
                      {/* Cột trái: Thời gian đăng ký */}
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <Ionicons name="time" size={12} color="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Thời gian đăng ký</Text>
                        </View>
                        <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                          {activeTicket.startTime}
                        </Text>
                      </View>

                      {/* Cột phải: Bệnh nhân */}
                      <View className="flex-1 pl-2">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <Ionicons name="person" size={12} color="#6B7280" />
                          <Text className="text-gray-500 text-[11px] font-medium">Bệnh nhân</Text>
                        </View>
                        <Text className="text-gray-800 text-[13px] font-extrabold" numberOfLines={1}>
                          {activeTicket.patientName}
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
                  title="Lộ Trình Khám"
                  onPress={handleGoToClinicalRoute}
                />
              </View>
            </ScrollView>
          </View>
        ) : (
          <View className="flex-1 justify-between px-6 py-12 items-center">
            <View className="flex-1 items-center justify-center">
              <View className="w-24 h-24 rounded-full bg-[#84AFEB]/10 items-center justify-center mb-6">
                <Ionicons
                  name="calendar-outline"
                  size={36}
                  color={Colors.primary}
                />
              </View>
              <Text className="text-gray-800 text-[18px] font-extrabold mb-2 text-center">
                {selectedTab === "today" ? "Không có phiếu khám hôm nay" : "Không có lịch hẹn sắp tới"}
              </Text>
              <Text className="text-gray-400 text-[13px] font-medium text-center px-4 leading-[20px]">
                {selectedPatientName
                  ? selectedTab === "today"
                    ? `Hồ sơ ${selectedPatientName} chưa có lịch hẹn khám bệnh nào trong ngày hôm nay.`
                    : `Hồ sơ ${selectedPatientName} chưa có lịch hẹn khám bệnh nào sắp tới.`
                  : selectedTab === "today"
                    ? "Bạn chưa chọn bệnh nhân hoặc chưa có lịch hẹn khám nào trong hôm nay."
                    : "Bạn chưa chọn bệnh nhân hoặc chưa có lịch hẹn khám nào sắp tới."}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
