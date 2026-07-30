import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { doctorService } from "@/features/booking/services/doctor.service";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
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

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);
  const [activeFlow, setActiveFlow] = useState<any | null>(null);

  // States for patient selection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  // States for multiple flows support
  const [availableFlows, setAvailableFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);

  const selectFlow = useCallback((flow: any, patientName: string) => {
    setSelectedFlow(flow);
    setActiveFlow(flow);

    // Tìm bước khám active hiện tại
    const activeSteps = flow.steps.filter(
      (s: any) => s.step_status !== "COMPLETED" && s.step_status !== "CANCELLED"
    );

    const currentActiveStep = activeSteps.find((s: any) => {
      if (!s.depends_on || s.depends_on.length === 0) return true;
      return s.depends_on.every((depId: string) => {
        const depStep = flow.steps.find((fs: any) => fs.step_id === depId);
        return !depStep || depStep.step_status === "COMPLETED" || depStep.step_status === "CANCELLED";
      });
    });

    const finalActiveStep = currentActiveStep || activeSteps[0] || flow.steps[0];

    if (finalActiveStep) {
      const queueNumber = finalActiveStep.queues?.[0]?.queue_number || "--";
      const specialtyName = finalActiveStep.specialty_info?.specialty_name || finalActiveStep.step_name || "Khám bệnh";
      const roomName = finalActiveStep.room_info?.room_name || "Đang xếp phòng";
      
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

  const loadTicketData = useCallback(async (patientId: string, patientName: string, showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const response = await doctorService.getActiveFlow(patientId);
      
      if (!response || !response.data || response.data.length === 0) {
        setActiveTicket(null);
        setActiveFlow(null);
        setAvailableFlows([]);
        setSelectedFlow(null);
        return;
      }

      // Lấy ngày hôm nay định dạng YYYY-MM-DD
      const todayStr = new Date().toISOString().split("T")[0];

      // Lọc các flow đang diễn ra (IN_PROGRESS) được tạo ngày hôm nay
      const todayFlows = response.data.filter((flow: any) => {
        const flowDate = flow.create_at ? flow.create_at.split("T")[0] : "";
        return flow.status === "IN_PROGRESS" && flowDate === todayStr;
      });

      if (todayFlows.length === 0) {
        setActiveTicket(null);
        setActiveFlow(null);
        setAvailableFlows([]);
        setSelectedFlow(null);
        return;
      }

      setAvailableFlows(todayFlows);

      // Nếu chỉ có 1 flow, chọn luôn
      if (todayFlows.length === 1) {
        selectFlow(todayFlows[0], patientName);
      } else {
        // Có nhiều flow, nếu đã chọn một flow trước đó rồi, đồng bộ lại dữ liệu mới nhất của flow đó
        if (selectedFlow) {
          const matchedFlow = todayFlows.find((f: any) => f.flow_id === selectedFlow.flow_id);
          if (matchedFlow) {
            selectFlow(matchedFlow, patientName);
            return;
          }
        }
        // Chưa chọn flow nào hoặc flow cũ không tồn tại nữa, reset để hiện danh sách lựa chọn
        setActiveTicket(null);
        setActiveFlow(null);
      }
    } catch (err) {
      console.error("[TicketTab] Lỗi tải phiếu khám:", err);
      setActiveTicket(null);
      setActiveFlow(null);
      setAvailableFlows([]);
      setSelectedFlow(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFlow, selectFlow]);

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

        {isLoading ? (
          // Trạng thái Loading
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-[12px] font-medium mt-3">
              Đang tải thông tin phiếu khám...
            </Text>
          </View>
        ) : availableFlows.length > 1 && !activeTicket ? (
          // Trạng thái 1.5: Hồ sơ có nhiều lượt khám khác nhau trong ngày -> Hiện danh sách chọn
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
                Hồ sơ của {selectedPatientName} hiện có nhiều lượt khám đang diễn ra. Vui lòng chọn một lượt để xem phiếu khám và lộ trình chi tiết:
              </Text>
            </View>

            {availableFlows.map((flowItem) => {
              const firstStep = flowItem.steps?.[0];
              const specialtyName = firstStep?.specialty_info?.specialty_name || firstStep?.step_name || "Lượt khám y tế";
              
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
                      <Text className="text-gray-400 text-[11px] font-bold">Lúc {createdTime}</Text>
                    </View>
                    <Text className="text-gray-800 text-[14px] font-extrabold mb-1">
                      {specialtyName}
                    </Text>
                    <Text className="text-gray-400 text-[11px] font-medium">
                      Trạng thái: <Text className="text-primary font-bold">Đang diễn ra</Text>
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : activeTicket ? (
          // Trạng thái 1: Hiển thị Thẻ Phiếu Khám
          <View className="flex-1 justify-between">
            {availableFlows.length > 1 && (
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
                  title="Theo dõi hàng đợi"
                  onPress={() => Alert.alert("Thông báo", "Bạn đang ở trang theo dõi hàng đợi khám.")}
                />
                <AppButton
                  title="Lộ Trình Khám"
                  onPress={handleGoToClinicalRoute}
                />
              </View>
            </ScrollView>
          </View>
        ) : (
          // Trạng thái 2: CHƯA CÓ LỊCH HẸN KHÁM HÔM NAY (Placeholder)
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
                Không có phiếu khám hôm nay
              </Text>
              <Text className="text-gray-400 text-[13px] font-medium text-center px-4 leading-[20px]">
                {selectedPatientName
                  ? `Hồ sơ ${selectedPatientName} chưa có lịch hẹn khám bệnh nào trong ngày hôm nay.`
                  : "Bạn chưa chọn bệnh nhân hoặc chưa có lịch hẹn khám nào trong hôm nay."}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
