import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { patientService } from "@/features/patient/services/patient.service";
import { visitService } from "@/features/visit/services/visit.service";
import { Patient } from "@/features/patient/types/patient.types";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";

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

export function MyAppointmentsView() {
  const router = useRouter();

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = useCallback(async (patientId: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await visitService.getActiveFlow(patientId);
      if (res?.data && Array.isArray(res.data)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const upcomingFlows = res.data.filter((flow: any) => {
          const examDate = getFlowExamDate(flow);
          return examDate >= tomorrowStr;
        });

        // Sắp xếp ngày gần nhất lên trước
        upcomingFlows.sort((a: any, b: any) => {
          return getFlowExamDate(a).localeCompare(getFlowExamDate(b));
        });

        setAppointments(upcomingFlows);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.log("Error fetching appointments:", err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await patientService.getPatients();
      if (res?.data && res.data.length > 0) {
        const firstPatient = res.data[0];
        setSelectedPatientId(firstPatient.patient_id);
        setSelectedPatientName(firstPatient.full_name);
        await fetchAppointments(firstPatient.patient_id, false);
      }
    } catch (err) {
      console.log("Error loading initial patients in MyAppointmentsView:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRefresh = async () => {
    if (!selectedPatientId) return;
    setIsRefreshing(true);
    await fetchAppointments(selectedPatientId, false);
  };

  const handleConfirmPatient = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setIsPatientModalVisible(false);
    fetchAppointments(patientId, true);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Chưa xếp ngày";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow, { gap: 16 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { marginRight: 8 },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={[styles.headerTitleContainer, { paddingLeft: 4 }]}>
            <Text style={styles.headerTitle}>Lịch hẹn khám bệnh</Text>
            <Text style={styles.headerSubtitle}>
              Danh sách các phiếu hẹn từ ngày mai trở đi
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Thẻ bệnh nhân */}
        <View style={styles.patientCard}>
          <View style={styles.patientInfoRow}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={20} color="#2563EB" />
            </View>
            <View style={styles.patientTextContainer}>
              <Text style={styles.patientLabel}>Lịch hẹn của:</Text>
              <Text style={styles.patientName} numberOfLines={1}>
                {selectedPatientName || "Chưa chọn hồ sơ"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsPatientModalVisible(true)}
            style={({ pressed }) => [
              styles.changePatientButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.changePatientText}>Đổi hồ sơ</Text>
          </Pressable>
        </View>

        {/* Danh sách các cuộc hẹn */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#84AFEB" />
            <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
          </View>
        ) : appointments.length > 0 ? (
          appointments.map((flow, index) => {
            const examDate = getFlowExamDate(flow);
            const step = flow.steps?.[0] || {};
            const rawSpecialty =
              flow.specialty_info?.specialty_name ||
              flow.specialty_name ||
              step.specialty_info?.specialty_name ||
              step.specialty_name ||
              step.step_name ||
              "Khám Chuyên Khoa";
            // Lọc bỏ tiền tố "Thanh toán" nếu có trong step_name
            const specialtyName = rawSpecialty.replace(/^Thanh toán\s+/i, "");
            const roomName = step.room_info?.room_name || "Đang xếp phòng";
            const doctorName = flow.booking?.slot?.doctor?.full_name;
            const shiftTime = flow.booking?.slot?.shift?.shift_name || "Trong ngày";
            const ticketCode = flow.ticket_code || flow.flow_id || `--`;

            return (
              <View key={flow.flow_id || index} style={styles.appointmentCard}>
                {/* Header card: Ngày hẹn & Trạng thái */}
                <View style={styles.cardHeader}>
                  <View style={styles.dateBadgeRow}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar" size={14} color="#8B5CF6" />
                      <Text style={styles.dateBadgeText}>
                        {formatDateDisplay(examDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>ĐÃ XÁC NHẬN</Text>
                  </View>
                </View>

                {/* Nội dung ca khám */}
                <View style={styles.cardBody}>
                  <Text style={styles.specialtyTitle}>{specialtyName}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={15} color="#64748B" />
                    <Text style={styles.infoText}>{roomName}</Text>
                  </View>

                  {doctorName && (
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={15} color="#64748B" />
                      <Text style={styles.infoText}>BS. {doctorName}</Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Ionicons name="barcode-outline" size={15} color="#64748B" />
                    <Text style={styles.ticketCodeLabel}>Mã đặt hẹn: </Text>
                    <Text style={styles.ticketCodeValue}>{ticketCode}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          /* Trạng thái rỗng */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={32} color="#84AFEB" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptyDescription}>
              Bệnh nhân {selectedPatientName} hiện chưa có lịch hẹn khám nào từ ngày mai trở đi.
            </Text>

            <Pressable
              onPress={() => router.push("/appointment/method-select")}
              style={({ pressed }) => [
                styles.emptyActionBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emptyActionBtnText}>Đặt lịch khám ngay</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Modal chọn bệnh nhân */}
      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => setIsPatientModalVisible(false)}
        selectedPatientId={selectedPatientId}
        onConfirm={handleConfirmPatient}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#84AFEB",
    paddingTop: 56,
    paddingBottom: 34,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitleContainer: {
    flex: 1,
    paddingLeft: 2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  patientCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  patientInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patientTextContainer: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  patientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  changePatientButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  changePatientText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 12,
  },
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dateBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateBadge: {
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateBadgeText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "700",
  },
  shiftTimeText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  confirmedBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  confirmedBadgeText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "700",
  },
  cardBody: {
    gap: 8,
  },
  specialtyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
  },
  ticketCodeLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  ticketCodeValue: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyDescription: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyActionBtn: {
    backgroundColor: "#84AFEB",
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
