import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";
import { patientService } from "@/features/patient/services/patient.service";
import { Patient } from "@/features/patient/types/patient.types";
import { getInitials, formatGenderLabel } from "@/shared/utils/string.utils";
import { formatDate } from "@/shared/utils/date.utils";

interface PatientPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (patientId: string, patientName: string) => void;
  selectedPatientId?: string | null;
}

export function PatientPickerModal({
  visible,
  onClose,
  onConfirm,
  selectedPatientId: initialSelectedPatientId,
}: PatientPickerModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    initialSelectedPatientId || null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPatients();
    }
  }, [visible]);

  useEffect(() => {
    if (initialSelectedPatientId) {
      setSelectedPatientId(initialSelectedPatientId);
    }
  }, [initialSelectedPatientId]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const res = await patientService.getPatients();
      if (res?.data) {
        setPatients(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0].patient_id);
        }
      }
    } catch (err) {
      console.log("Error loading patients in PatientPickerModal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.patient_id);
  };

  const handleConfirm = () => {
    if (!selectedPatientId) return;
    const selected = patients.find((p) => p.patient_id === selectedPatientId);
    if (selected) {
      onConfirm(selected.patient_id, selected.full_name);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn bệnh nhân</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={26} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDesc}>
            Vui lòng chạm để chọn hồ sơ bệnh nhân:
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={patients}
              keyExtractor={(item) => item.patient_id}
              showsVerticalScrollIndicator={false}
              style={styles.flatList}
              contentContainerStyle={{ paddingBottom: 4 }}
              renderItem={({ item }) => {
                const isSelected = selectedPatientId === item.patient_id;
                const initials = getInitials(item.full_name);
                const formattedDob = formatDate(item.dob);

                return (
                  <TouchableOpacity
                    onPress={() => handleSelectPatient(item)}
                    activeOpacity={0.7}
                    style={[
                      styles.patientItem,
                      isSelected ? styles.patientItemSelected : styles.patientItemUnselected,
                    ]}
                  >
                    
                    <View
                      style={[
                        styles.avatarBox,
                        isSelected ? styles.avatarBoxSelected : styles.avatarBoxUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isSelected ? styles.avatarTextSelected : styles.avatarTextUnselected,
                        ]}
                      >
                        {initials}
                      </Text>
                    </View>

                    <View style={styles.patientInfo}>
                      <Text
                        style={[
                          styles.patientItemName,
                          isSelected ? styles.patientItemNameSelected : styles.patientItemNameUnselected,
                        ]}
                      >
                        {item.full_name}
                      </Text>
                      <View style={styles.patientSubRow}>
                        <Text style={styles.patientSubText}>
                          {formatGenderLabel(item.gender)}
                        </Text>
                        {formattedDob ? (
                          <>
                            <View style={styles.dot} />
                            <Text style={styles.patientSubText}>
                              {formattedDob}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.radioBox,
                        isSelected ? styles.radioBoxSelected : styles.radioBoxUnselected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                patients.length > 0 ? (
                  <TouchableOpacity
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                    style={styles.confirmButton}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  modalDesc: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 14,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  flatList: {
    flexGrow: 0,
  },
  patientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  patientItemSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  patientItemUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarBoxSelected: {
    backgroundColor: "#DBEAFE",
  },
  avatarBoxUnselected: {
    backgroundColor: "#F3F4F6",
  },
  avatarText: {
    fontWeight: "700",
    fontSize: 14,
  },
  avatarTextSelected: {
    color: "#1D4ED8",
  },
  avatarTextUnselected: {
    color: "#4B5563",
  },
  patientInfo: {
    flex: 1,
  },
  patientItemName: {
    fontWeight: "700",
    fontSize: 14,
  },
  patientItemNameSelected: {
    color: "#1D4ED8",
  },
  patientItemNameUnselected: {
    color: "#111827",
  },
  patientSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  patientSubText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9CA3AF",
  },
  radioBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioBoxSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  radioBoxUnselected: {
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  confirmButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#84AFEB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
