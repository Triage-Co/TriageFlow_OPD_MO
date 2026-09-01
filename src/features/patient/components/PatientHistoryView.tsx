import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { visitService } from "@/features/visit/services/visit.service";
import { TimelineStepCard } from "@/features/visit/components/TimelineStepCard";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { formatVND as formatCurrency } from "@/shared/utils/string.utils";
import { formatDateTime } from "@/shared/utils/date.utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";

type DetailTabType = "record" | "route" | "prescription";

export function PatientHistoryView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visitSessions, setVisitSessions] = useState<any[]>([]);
  const [patientFlows, setPatientFlows] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState<DetailTabType>("record");
  const [sessionPrescription, setSessionPrescription] = useState<any | null>(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  const loadHistoryData = useCallback(async (patientId: string, showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const [sessionsData, flowsData] = await Promise.allSettled([
        visitService.getVisitSessions(patientId),
        visitService.getPatientFlows(patientId),
      ]);

      if (sessionsData.status === "fulfilled") {
        const rawSessions: any = sessionsData.value;
        const sessionsList = Array.isArray(rawSessions)
          ? rawSessions
          : Array.isArray(rawSessions?.data)
          ? rawSessions.data
          : [];
        
        const sortedSessions = [...sessionsList].sort((a: any, b: any) => {
          return new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime();
        });
        setVisitSessions(sortedSessions);
      } else {
        setVisitSessions([]);
      }

      if (flowsData.status === "fulfilled") {
        const rawFlows: any = flowsData.value;
        const flowsList = Array.isArray(rawFlows)
          ? rawFlows
          : Array.isArray(rawFlows?.data)
          ? rawFlows.data
          : [];
        setPatientFlows(flowsList);
      } else {
        setPatientFlows([]);
      }
    } catch (err) {
      console.error("[HistoryScreen] Lỗi tải lịch sử khám bệnh:", err);
      setVisitSessions([]);
      setPatientFlows([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsPatientModalVisible(true);
  }, []);

  const handleConfirmPatient = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setIsPatientModalVisible(false);
    loadHistoryData(patientId, true);
  };

  const handleRefresh = () => {
    if (selectedPatientId) {
      setIsRefreshing(true);
      loadHistoryData(selectedPatientId, false);
    }
  };

  const handleViewSessionDetails = async (session: any) => {
    setSelectedSession(session);
    setActiveTab("record");
    setIsDetailModalVisible(true);
    setSessionPrescription(null);
    setIsLoadingModalData(true);

    try {
      const presData = await visitService.getPrescriptionByVisitSession(session.visit_session_id);
      const prescriptionObject = presData?.data || presData;
      setSessionPrescription(prescriptionObject);
    } catch {
      setSessionPrescription(null);
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const currentSessionFlow = useMemo(() => {
    if (!selectedSession || !patientFlows || patientFlows.length === 0) return null;
    
    if (selectedSession.booking_id) {
      const matchedByBooking = patientFlows.find(
        (f: any) => f.booking_id === selectedSession.booking_id
      );
      if (matchedByBooking) return matchedByBooking;
    }

    if (selectedSession.visit_date) {
      const sessionDateStr = new Date(selectedSession.visit_date).toISOString().split("T")[0];
      const matchedByDate = patientFlows.find((f: any) => {
        if (f.date === sessionDateStr) return true;
        if (f.create_at && f.create_at.startsWith(sessionDateStr)) return true;
        return false;
      });
      if (matchedByDate) return matchedByDate;
    }

    return patientFlows[0] || null;
  }, [selectedSession, patientFlows]);

  const displayRouteSteps = useMemo(() => {
    if (!currentSessionFlow || !currentSessionFlow.steps) return [];
    const visibleSteps: any[] = currentSessionFlow.steps;
    const result: any[] = [];
    const processedServiceOrderIds = new Set<string>();

    for (let i = 0; i < visibleSteps.length; i++) {
      const step = visibleSteps[i];
      const isPayment =
        step.step_name?.toLowerCase().trim().startsWith("thanh toán") ||
        step.step_type === "PAYMENT";
      const serviceOrderId = step.service_order_id;

      if (!isPayment && serviceOrderId) {
        if (processedServiceOrderIds.has(serviceOrderId)) {
          continue;
        }
        processedServiceOrderIds.add(serviceOrderId);

        const siblingSteps = visibleSteps.filter((s: any) => {
          const sIsPayment =
            s.step_name?.toLowerCase().trim().startsWith("thanh toán") ||
            s.step_type === "PAYMENT";
          return s.service_order_id === serviceOrderId && !sIsPayment;
        });

        const isGroupCompleted = siblingSteps.every(
          (s: any) => s.step_status === "COMPLETED"
        );

        result.push({
          isGrouped: true,
          serviceOrderId,
          step_status: isGroupCompleted ? "COMPLETED" : "IN_PROGRESS",
          step_name: "Thực hiện chỉ định dịch vụ",
          subSteps: siblingSteps,
          step_id: step.step_id,
        });
      } else {
        result.push({
          ...step,
          isGrouped: false,
        });
      }
    }

    return result;
  }, [currentSessionFlow]);

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[17px] font-bold">
            Lịch Sử Khám Bệnh
          </Text>
          <TouchableOpacity
            onPress={() => setIsPatientModalVisible(true)}
            style={{ padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {selectedPatientName ? (
          <View className="bg-white px-5 py-3 border-b border-gray-100 flex-row justify-between items-center shadow-sm">
            <View className="flex-row items-center gap-2">
              <Ionicons name="person-circle" size={16} color={Colors.primary} />
              <Text className="text-gray-500 text-xs font-semibold">
                Hồ sơ: <Text className="text-gray-800 font-extrabold">{selectedPatientName}</Text>
              </Text>
            </View>
            <View className="bg-blue-50 px-2 py-0.5 rounded-md">
              <Text className="text-primary text-[10px] font-black">
                {visitSessions.length} PHIÊN KHÁM
              </Text>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center bg-gray-50">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-xs mt-3 font-semibold">Đang tải lịch sử khám...</Text>
          </View>
        ) : !selectedPatientId ? (
          <View className="flex-1 items-center justify-center p-6 bg-gray-50">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
              <Ionicons name="person-outline" size={32} color={Colors.primary} />
            </View>
            <Text className="text-gray-800 text-base font-bold text-center">
              Chưa chọn hồ sơ bệnh nhân
            </Text>
            <Text className="text-gray-400 text-xs mt-1.5 text-center font-medium w-64 leading-relaxed">
              Vui lòng chọn hồ sơ bệnh nhân để xem danh sách lịch sử các lần khám bệnh.
            </Text>
            <TouchableOpacity
              onPress={() => setIsPatientModalVisible(true)}
              activeOpacity={0.8}
              className="mt-6 bg-primary px-6 py-3 rounded-xl flex-row items-center gap-2 shadow-sm"
            >
              <Ionicons name="people" size={18} color="white" />
              <Text className="text-white font-bold text-sm">Chọn hồ sơ bệnh nhân</Text>
            </TouchableOpacity>
          </View>
        ) : visitSessions.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6 bg-gray-50">
            <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-sm mt-3 text-center font-medium">
              Bệnh nhân này chưa có dữ liệu lịch sử khám bệnh nào.
            </Text>
          </View>
        ) : (
          <FlatList
            data={visitSessions}
            keyExtractor={(item) => item.visit_session_id}
            contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            className="bg-gray-50"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() => handleViewSessionDetails(item)}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: Colors.primary,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                    padding: 18,
                    marginBottom: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="bg-gray-100 rounded-lg p-1">
                        <Ionicons name="medical" size={12} color={Colors.primary} />
                      </View>
                      <Text className="text-gray-800 text-[13px] font-extrabold">
                        {formatDateTime(item.visit_date)}
                      </Text>
                    </View>

                    <Text className="text-gray-500 text-xs mb-1.5 leading-[18px]">
                      Lý do: <Text className="text-gray-800 font-semibold">{item.chief_complaint || "Không ghi nhận lý do"}</Text>
                    </Text>
                    
                    <Text className="text-gray-500 text-xs mb-1 leading-[18px]" numberOfLines={1}>
                      Chẩn đoán: <Text className="text-primary font-bold">{item.final_diagnosis || item.diagnosis || "Chưa cập nhật"}</Text>
                    </Text>
                  </View>
                  
                  <View className="items-center justify-center bg-gray-50 w-8 h-8 rounded-full border border-gray-100">
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <ScreenWrapper edges={["left", "right", "bottom"]}>
          <View className="flex-1 bg-gray-50">
            
            <View className="bg-primary pt-14 pb-4 px-5 shadow-sm">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setIsDetailModalVisible(false)}
                  style={{
                    padding: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 999,
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-[17px] font-black tracking-tight">
                  Chi Tiết Phiên Khám
                </Text>
                <View className="w-8" />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "rgba(0, 0, 0, 0.15)",
                  padding: 4,
                  borderRadius: 16,
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => setActiveTab("record")}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: activeTab === "record" ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Ionicons
                    name="document-text"
                    size={14}
                    color={activeTab === "record" ? Colors.primary : "rgba(255,255,255,0.75)"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: activeTab === "record" ? "900" : "700",
                      color: activeTab === "record" ? Colors.primary : "#E0E7FF",
                    }}
                  >
                    Bệnh án
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveTab("route")}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: activeTab === "route" ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Ionicons
                    name="trail-sign"
                    size={14}
                    color={activeTab === "route" ? Colors.primary : "rgba(255,255,255,0.75)"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: activeTab === "route" ? "900" : "700",
                      color: activeTab === "route" ? Colors.primary : "#E0E7FF",
                    }}
                  >
                    Lộ trình
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveTab("prescription")}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: activeTab === "prescription" ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Ionicons
                    name="medkit"
                    size={14}
                    color={activeTab === "prescription" ? Colors.primary : "rgba(255,255,255,0.75)"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: activeTab === "prescription" ? "900" : "700",
                      color: activeTab === "prescription" ? Colors.primary : "#E0E7FF",
                    }}
                  >
                    Đơn thuốc
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeTab === "record" && (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-5">
                
                <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                    <Text className="text-gray-800 text-[15px] font-black">
                      Thông tin phiên khám
                    </Text>
                  </View>
                  
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Thời gian thực hiện khám
                    </Text>
                    <Text className="text-gray-800 text-sm font-extrabold">
                      {formatDateTime(selectedSession?.visit_date)}
                    </Text>
                  </View>

                  <View className="pt-1">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      Lý do khám (Chief Complaint)
                    </Text>
                    <Text className="text-gray-700 text-sm font-medium leading-[20px]">
                      {selectedSession?.chief_complaint || "Không ghi nhận lý do khám cụ thể."}
                    </Text>
                  </View>
                </View>

                {(selectedSession?.heart_rate ||
                  selectedSession?.blood_pressure_sys ||
                  selectedSession?.temperature ||
                  selectedSession?.spo2) && (
                  <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Ionicons name="fitness-outline" size={18} color={Colors.primary} />
                      <Text className="text-gray-800 text-[15px] font-black">
                        Chỉ số sinh tồn (Sinh hiệu)
                      </Text>
                    </View>

                    <View className="flex-row flex-wrap gap-2.5">
                      {selectedSession?.heart_rate && (
                        <View className="flex-1 min-w-[140px] bg-red-50 p-3 rounded-2xl border border-red-100">
                          <Text className="text-red-500 text-[10px] font-bold uppercase">Nhịp tim</Text>
                          <Text className="text-gray-800 text-base font-black mt-0.5">
                            {selectedSession.heart_rate} <Text className="text-xs font-normal text-gray-500">nhịp/phút</Text>
                          </Text>
                        </View>
                      )}

                      {(selectedSession?.blood_pressure_sys || selectedSession?.blood_pressure_dia) && (
                        <View className="flex-1 min-w-[140px] bg-blue-50 p-3 rounded-2xl border border-blue-100">
                          <Text className="text-blue-500 text-[10px] font-bold uppercase">Huyết áp</Text>
                          <Text className="text-gray-800 text-base font-black mt-0.5">
                            {selectedSession.blood_pressure_sys || "—"}/{selectedSession.blood_pressure_dia || "—"}{" "}
                            <Text className="text-xs font-normal text-gray-500">mmHg</Text>
                          </Text>
                        </View>
                      )}

                      {selectedSession?.temperature && (
                        <View className="flex-1 min-w-[140px] bg-amber-50 p-3 rounded-2xl border border-amber-100">
                          <Text className="text-amber-500 text-[10px] font-bold uppercase">Nhiệt độ</Text>
                          <Text className="text-gray-800 text-base font-black mt-0.5">
                            {selectedSession.temperature}°C
                          </Text>
                        </View>
                      )}

                      {selectedSession?.spo2 && (
                        <View className="flex-1 min-w-[140px] bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                          <Text className="text-emerald-500 text-[10px] font-bold uppercase">SpO2</Text>
                          <Text className="text-gray-800 text-base font-black mt-0.5">
                            {selectedSession.spo2}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Ionicons name="pulse" size={18} color="#EF4444" />
                    <Text className="text-gray-800 text-[15px] font-black">
                      Thông tin bệnh lý
                    </Text>
                  </View>
                  
                  <View className="bg-blue-50 border-l-4 border-l-blue-400 p-3.5 rounded-r-xl mb-4">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">
                      Bệnh sử hiện tại (HPI)
                    </Text>
                    <Text className="text-gray-800 text-sm font-semibold leading-[20px]">
                      {selectedSession?.hpi || "—"}
                    </Text>
                  </View>

                  <View className="bg-amber-50 border-l-4 border-l-amber-400 p-3.5 rounded-r-xl">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">
                      Tiền sử bệnh (PMH)
                    </Text>
                    <Text className="text-gray-800 text-sm font-semibold leading-[20px]">
                      {selectedSession?.pmh || "—"}
                    </Text>
                  </View>
                </View>

                <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-8 border-l-4 border-l-emerald-500">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text className="text-gray-500 text-[11px] font-black uppercase tracking-wider">
                      Chẩn đoán cuối cùng
                    </Text>
                  </View>
                  <Text className="text-emerald-700 text-[16px] font-black leading-[22px] mt-1 pl-7">
                    {selectedSession?.final_diagnosis || selectedSession?.diagnosis || "—"}
                  </Text>
                </View>
              </ScrollView>
            )}

            {activeTab === "route" && (
              <View className="flex-1 px-5 pt-5">
                {displayRouteSteps.length === 0 ? (
                  <View className="flex-1 items-center justify-center p-6">
                    <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                      <Ionicons name="trail-sign-outline" size={32} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-700 text-sm font-bold text-center">
                      Chưa ghi nhận lộ trình khám
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1 text-center font-medium w-64">
                      Không tìm thấy dữ liệu các bước khám chi tiết cho phiên khám này.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}
                  >
                    {displayRouteSteps.map((step: any, index: number) => {
                      const isLast = index === displayRouteSteps.length - 1;
                      return (
                        <TimelineStepCard
                          key={step.step_id || index}
                          step={step}
                          index={index}
                          isLast={isLast}
                          isActive={false}
                          activeStepId={null}
                          allSteps={currentSessionFlow?.steps || []}
                          isHistoryMode={true}
                        />
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            {activeTab === "prescription" && (
              <View className="flex-1 px-5 pt-5">
                {isLoadingModalData ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text className="text-gray-400 text-xs mt-3 font-semibold">
                      Đang tải thông tin đơn thuốc...
                    </Text>
                  </View>
                ) : !sessionPrescription ? (
                  <View className="flex-1 items-center justify-center p-6">
                    <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                      <Ionicons name="medkit-outline" size={32} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-700 text-sm font-bold text-center">
                      Không có đơn thuốc
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1 text-center font-medium w-64">
                      Phiên khám này không có đơn thuốc hoặc không kê thuốc điều trị.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 50 }}
                  >
                    
                    <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                      <View className="flex-row items-center gap-2 mb-3">
                        <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
                        <Text className="text-gray-800 text-[15px] font-black">
                          Thông tin đơn thuốc
                        </Text>
                      </View>

                      <View className="bg-gray-50 rounded-2xl p-4 gap-2">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-400 text-xs font-semibold">Mã đơn thuốc:</Text>
                          <Text className="text-gray-800 text-xs font-extrabold">
                            {sessionPrescription.prescription_code || "—"}
                          </Text>
                        </View>
                        {sessionPrescription.doctor?.full_name && (
                          <View className="flex-row justify-between items-center">
                            <Text className="text-gray-400 text-xs font-semibold">Bác sĩ kê đơn:</Text>
                            <Text className="text-gray-800 text-xs font-bold">
                              BS. {sessionPrescription.doctor.full_name}
                            </Text>
                          </View>
                        )}
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-400 text-xs font-semibold">Ngày kê đơn:</Text>
                          <Text className="text-gray-800 text-xs font-bold">
                            {formatDateTime(sessionPrescription.created_at)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {sessionPrescription.diagnosis_note && (
                      <View className="bg-blue-50 rounded-3xl p-5 border border-blue-100 shadow-sm mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                          <Ionicons name="information-circle" size={18} color="#3B82F6" />
                          <Text className="text-blue-900 text-[14px] font-bold">
                            Lời dặn của Bác sĩ
                          </Text>
                        </View>
                        <Text className="text-blue-950 text-xs leading-[20px] font-medium pl-6">
                          {sessionPrescription.diagnosis_note}
                        </Text>
                      </View>
                    )}

                    <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                      <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="list" size={18} color={Colors.primary} />
                          <Text className="text-gray-800 text-[15px] font-black">
                            Danh mục thuốc ({sessionPrescription.prescriptionDetails?.length || 0})
                          </Text>
                        </View>
                      </View>

                      {sessionPrescription.prescriptionDetails &&
                      sessionPrescription.prescriptionDetails.length > 0 ? (
                        <View className="gap-3">
                          {sessionPrescription.prescriptionDetails.map(
                            (item: any, idx: number) => {
                              const medicineName =
                                item.medicine?.medicine_name || item.medicine_name || `Thuốc ${idx + 1}`;
                              const unit = item.medicine?.unit || "Đơn vị";

                              return (
                                <View
                                  key={item.prescription_detail_id || idx}
                                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100"
                                >
                                  <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1 mr-2">
                                      <Text className="text-gray-800 text-[14px] font-bold">
                                        {idx + 1}. {medicineName}
                                      </Text>
                                    </View>
                                    <View className="bg-blue-100 px-2.5 py-0.5 rounded-md">
                                      <Text className="text-primary text-[11px] font-black">
                                        SL: {item.quantity} {unit}
                                      </Text>
                                    </View>
                                  </View>

                                  {item.dosage_instruction ? (
                                    <View className="bg-white p-2.5 rounded-xl border border-gray-100 mt-1 mb-2">
                                      <Text className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">
                                        Cách dùng:
                                      </Text>
                                      <Text className="text-gray-800 text-xs font-semibold">
                                        {item.dosage_instruction}
                                      </Text>
                                    </View>
                                  ) : null}

                                  <View className="flex-row justify-between items-center pt-1 border-t border-gray-200">
                                    <Text className="text-gray-400 text-[11px]">
                                      Đơn giá: {formatCurrency(item.unit_price)}
                                    </Text>
                                    <Text className="text-gray-700 text-xs font-bold">
                                      Thành tiền: {formatCurrency(item.sub_total || item.unit_price * item.quantity)}
                                    </Text>
                                  </View>
                                </View>
                              );
                            }
                          )}
                        </View>
                      ) : (
                        <Text className="text-gray-400 text-xs text-center py-4">
                          Chưa có chi tiết thuốc trong đơn.
                        </Text>
                      )}

                      {typeof sessionPrescription.total_amount === "number" && (
                        <View className="mt-4 pt-4 border-t border-gray-100 flex-row justify-between items-center">
                          <Text className="text-gray-600 text-sm font-bold">Tổng tiền thuốc:</Text>
                          <Text className="text-primary text-base font-black">
                            {formatCurrency(sessionPrescription.total_amount)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}
