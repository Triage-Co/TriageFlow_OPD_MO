import { Colors } from "@/config/colors";
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
  FlatList,
  RefreshControl,
  Text,
  View,
  Pressable,
} from "react-native";

export default function HistoryScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flows, setFlows] = useState<any[]>([]);

  // States for patient selection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  const loadHistoryData = useCallback(async (patientId: string, showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const response = await doctorService.getPatientFlows(patientId);
      if (response && response.data) {
        // Sắp xếp các flow mới nhất lên đầu
        const sortedFlows = [...response.data].sort((a: any, b: any) => {
          return new Date(b.create_at).getTime() - new Date(a.create_at).getTime();
        });
        setFlows(sortedFlows);
      } else {
        setFlows([]);
      }
    } catch (err) {
      console.error("[HistoryScreen] Lỗi tải lịch sử khám bệnh:", err);
      setFlows([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Tự động mở Modal chọn bệnh nhân khi mới vào
  useEffect(() => {
    if (!selectedPatientId) {
      setIsPatientModalVisible(true);
    }
  }, [selectedPatientId]);

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

  const handleGoToRoute = (flow: any) => {
    router.push({
      pathname: "/(patient)/visit/clinical-route",
      params: {
        flowData: JSON.stringify(flow),
        patientName: selectedPatientName,
      },
    });
  };

  // Định dạng ngày hiển thị: YYYY-MM-DDTHH:MM:SS -> DD/MM/YYYY HH:MM
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    const parts = dateTimeStr.split("T");
    const dateStr = parts[0].split("-").reverse().join("/");
    const timeStr = parts[1] ? parts[1].substring(0, 5) : "";
    return `${dateStr} ${timeStr}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return { text: "Hoàn thành", bg: "bg-green-50", textClass: "text-green-600 border-green-200" };
      case "IN_PROGRESS":
        return { text: "Đang khám", bg: "bg-blue-50", textClass: "text-primary border-blue-200" };
      case "CANCELLED":
        return { text: "Đã hủy", bg: "bg-gray-50", textClass: "text-gray-400 border-gray-200" };
      default:
        return { text: status, bg: "bg-neutral-50", textClass: "text-neutral-500 border-neutral-200" };
    }
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Patient Picker Modal */}
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

      <View className="flex-1">
        {/* Header Area */}
        <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
          <Pressable
            onPress={() => router.back()}
            className="p-1 active:opacity-70"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-[17px] font-bold">
            Lịch Sử Khám Bệnh
          </Text>
          <Pressable
            onPress={() => setIsPatientModalVisible(true)}
            className="p-1 active:opacity-70"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people" size={22} color="white" />
          </Pressable>
        </View>

        {/* Subtitle hiển thị tên bệnh nhân đang chọn */}
        {selectedPatientName ? (
          <View className="bg-gray-50 px-5 py-2.5 border-b border-gray-200 flex-row justify-between items-center">
            <Text className="text-gray-500 text-xs font-semibold">
              Hồ sơ: <Text className="text-gray-800 font-bold">{selectedPatientName}</Text>
            </Text>
            <Text className="text-gray-400 text-[10px] font-medium">
              {flows.length} lượt khám
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-xs mt-3">Đang tải lịch sử khám...</Text>
          </View>
        ) : flows.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-sm mt-3 text-center">
              {selectedPatientId
                ? "Bệnh nhân này chưa có dữ liệu lịch sử khám bệnh nào."
                : "Vui lòng chọn bệnh nhân để xem lịch sử."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={flows}
            keyExtractor={(item) => item.flow_id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => {
              const badge = getStatusBadge(item.status);
              
              // Tổng hợp danh sách tên chuyên khoa đã thực hiện
              const specialtiesList = item.steps
                ?.map((s: any) => s.specialty_info?.specialty_name || s.step_name)
                .filter((name: any, idx: number, self: any) => name && self.indexOf(name) === idx)
                .slice(0, 3)
                .join(", ");

              return (
                <Pressable
                  onPress={() => handleGoToRoute(item)}
                  className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm active:opacity-95"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="calendar" size={14} color="#6B7280" />
                      <Text className="text-gray-800 text-[13px] font-bold">
                        Lượt khám: {formatDateTime(item.create_at)}
                      </Text>
                    </View>
                    <View className={`${badge.bg} px-2.5 py-0.5 rounded-full border`}>
                      <Text className={`${badge.textClass} text-[10px] font-bold`}>
                        {badge.text}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-500 text-xs mb-3 leading-[18px]">
                    Khoa khám: <Text className="text-gray-700 font-bold">{specialtiesList || "Tổng quát"}</Text>
                  </Text>

                  <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
                    <Text className="text-gray-400 text-[11px] font-semibold">
                      Tổng số bước: {item.steps?.length || 0}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-primary text-xs font-bold">Xem lộ trình</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
