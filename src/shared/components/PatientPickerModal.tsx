import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { Colors } from "@/config/colors";
import { patientService } from "@/features/patient/services/patient.service";
import { Patient } from "@/features/patient/types/patient.types";

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
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="w-full bg-white rounded-[28px] overflow-hidden max-h-[80%] shadow-lg">
          <View className="p-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-gray-800 text-lg font-bold">Chọn bệnh nhân</Text>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SymbolView
                  name={{ ios: "xmark.circle.fill", android: "cancel" }}
                  size={24}
                  tintColor="#9CA3AF"
                />
              </Pressable>
            </View>

            {/* Title & Desc */}
            <Text className="text-gray-500 text-xs mb-4">
              Vui lòng chọn hồ sơ bệnh nhân cần xem thông tin:
            </Text>

            {isLoading ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={patients}
                keyExtractor={(item) => item.patient_id}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 250 }}
                contentContainerStyle={{ paddingBottom: 10 }}
                renderItem={({ item }) => {
                  const isSelected = selectedPatientId === item.patient_id;

                  let initials = "BN";
                  if (item.full_name) {
                    const parts = item.full_name.trim().split(" ");
                    if (parts.length > 1) {
                      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    } else if (parts.length === 1) {
                      initials = parts[0].substring(0, 2).toUpperCase();
                    }
                  }

                  const formattedDob = item.dob
                    ? item.dob.split("T")[0].split("-").reverse().join("/")
                    : "";

                  return (
                    <Pressable
                      onPress={() => setSelectedPatientId(item.patient_id)}
                      className={`flex-row items-center p-3 rounded-2xl border mb-3 active:opacity-75 ${
                        isSelected
                          ? "bg-primary/5 border-primary"
                          : "bg-white border-neutral-100"
                      }`}
                    >
                      {/* Initials Avatar */}
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isSelected ? "bg-primary/10" : "bg-neutral-100"
                        }`}
                      >
                        <Text
                          className={`font-bold text-sm ${
                            isSelected ? "text-primary" : "text-gray-500"
                          }`}
                        >
                          {initials}
                        </Text>
                      </View>

                      {/* Patient Details */}
                      <View className="flex-1">
                        <Text
                          className={`font-bold text-[14px] ${
                            isSelected ? "text-primary" : "text-gray-800"
                          }`}
                        >
                          {item.full_name}
                        </Text>
                        <View className="flex-row items-center gap-3 mt-0.5">
                          <Text className="text-gray-400 text-[11px] font-medium">
                            {item.gender?.toUpperCase() === "MALE" ? "Nam" : "Nữ"}
                          </Text>
                          <View className="w-1 h-1 rounded-full bg-gray-300" />
                          <Text className="text-gray-400 text-[11px] font-medium">
                            {formattedDob}
                          </Text>
                        </View>
                      </View>

                      {/* Radio Checkmark */}
                      <View
                        className={`w-5 h-5 rounded-full border items-center justify-center ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <SymbolView
                            name={{ ios: "checkmark", android: "done" }}
                            size={12}
                            tintColor="#FFFFFF"
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirm}
              disabled={isLoading || patients.length === 0}
              className={`w-full py-3.5 rounded-2xl items-center justify-center mt-4 active:opacity-90 ${
                isLoading || patients.length === 0 ? "bg-gray-300" : "bg-primary"
              }`}
            >
              <Text className="text-white font-bold text-[15px]">Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
