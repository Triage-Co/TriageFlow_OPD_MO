import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { visitService } from "@/features/visit/services/visit.service";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export function PatientHistoryView() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visitSessions, setVisitSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  // States for patient selection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  const loadHistoryData = useCallback(async (patientId: string, showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const data = await visitService.getVisitSessions(patientId);
      if (data && Array.isArray(data)) {
        // Sắp xếp các phiên khám mới nhất lên đầu dựa trên visit_date
        const sortedSessions = [...data].sort((a: any, b: any) => {
          return new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime();
        });
        setVisitSessions(sortedSessions);
      } else {
        setVisitSessions([]);
      }
    } catch (err) {
      console.error("[HistoryScreen] Lỗi tải lịch sử khám bệnh:", err);
      setVisitSessions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Tự động mở Modal chọn bệnh nhân 1 lần khi mới vào màn hình
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

  const handleViewSessionDetails = (session: any) => {
    setSelectedSession(session);
    setIsDetailModalVisible(true);
  };

  // Định dạng ngày hiển thị: YYYY-MM-DDTHH:MM:SS -> DD/MM/YYYY HH:MM
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    const parts = dateTimeStr.split("T");
    const dateStr = parts[0].split("-").reverse().join("/");
    const timeStr = parts[1] ? parts[1].substring(0, 5) : "";
    return `${dateStr} ${timeStr}`;
  };

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

        {/* Subtitle hiển thị tên bệnh nhân đang chọn */}
        {selectedPatientName ? (
          <View className="bg-white px-5 py-3 border-b border-gray-100 flex-row justify-between items-center shadow-sm shadow-black/5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="person-circle" size={16} color={Colors.primary} />
              <Text className="text-gray-500 text-xs font-semibold">
                Hồ sơ: <Text className="text-gray-800 font-extrabold">{selectedPatientName}</Text>
              </Text>
            </View>
            <View className="bg-primary/10 px-2 py-0.5 rounded-md">
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
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Ionicons name="person-outline" size={32} color={Colors.primary} />
            </View>
            <Text className="text-gray-800 text-base font-bold text-center">
              Chưa chọn hồ sơ bệnh nhân
            </Text>
            <Text className="text-gray-400 text-xs mt-1.5 text-center font-medium max-w-[260px] leading-relaxed">
              Vui lòng chọn hồ sơ bệnh nhân để xem danh sách lịch sử các lần khám bệnh.
            </Text>
            <TouchableOpacity
              onPress={() => setIsPatientModalVisible(true)}
              activeOpacity={0.8}
              className="mt-6 bg-primary px-6 py-3 rounded-xl flex-row items-center gap-2 shadow-sm shadow-primary/30"
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
            className="bg-gray-50/50"
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

      {/* ── CHI TIẾT BỆNH ÁN MODAL ── */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <ScreenWrapper edges={["left", "right", "bottom"]}>
          <View className="flex-1 bg-gray-50">
            {/* Header Modal */}
            <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
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
              <Text className="text-white text-[17px] font-black tracking-tight">Chi Tiết Bệnh Án</Text>
              <View className="w-8" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-5">
              {/* Thẻ ngày khám */}
              <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <Text className="text-gray-800 text-[15px] font-black">
                    Thông tin phiên khám
                  </Text>
                </View>
                
                <View className="bg-gray-50 rounded-2xl p-4.5 mb-4">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Ngày thực hiện khám
                  </Text>
                  <Text className="text-gray-800 text-sm font-extrabold">
                    {formatDateTime(selectedSession?.visit_date)}
                  </Text>
                </View>

                <View className="pt-2">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Lý do khám (Chief Complaint)
                  </Text>
                  <Text className="text-gray-700 text-sm font-medium leading-[20px]">
                    {selectedSession?.chief_complaint || "Không ghi nhận triệu chứng hay lý do khám cụ thể."}
                  </Text>
                </View>
              </View>

              {/* Bệnh sử & Tiền sử */}
              <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
                <View className="flex-row items-center gap-2 mb-4">
                  <Ionicons name="pulse" size={18} color="#EF4444" />
                  <Text className="text-gray-800 text-[15px] font-black">
                    Thông tin bệnh lý
                  </Text>
                </View>
                
                <View className="bg-blue-50/20 border-l-4 border-l-blue-400 p-3.5 rounded-r-xl mb-4">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">Bệnh sử hiện tại (HPI)</Text>
                  <Text className="text-gray-800 text-sm font-semibold leading-[20px]">
                    {selectedSession?.hpi || "—"}
                  </Text>
                </View>

                <View className="bg-amber-50/20 border-l-4 border-l-amber-400 p-3.5 rounded-r-xl">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">Tiền sử bệnh (PMH)</Text>
                  <Text className="text-gray-800 text-sm font-semibold leading-[20px]">
                    {selectedSession?.pmh || "—"}
                  </Text>
                </View>
              </View>

              {/* Chẩn đoán */}
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
          </View>
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}
