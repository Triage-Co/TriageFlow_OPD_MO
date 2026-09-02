import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { patientService } from "@/features/patient/services/patient.service";
import { Patient } from "@/features/patient/types/patient.types";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";

export function BookingMethodSelectView() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string; patientName?: string }>();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(params.patientId || null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>(params.patientName || "");
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await patientService.getPatients();
      if (res?.data && res.data.length > 0) {
        setPatients(res.data);
        if (!selectedPatientId) {
          setSelectedPatientId(res.data[0].patient_id);
          setSelectedPatientName(res.data[0].full_name);
        } else {
          const match = res.data.find((p) => p.patient_id === selectedPatientId);
          if (match) setSelectedPatientName(match.full_name);
        }
      }
    } catch (err) {
      console.log("Error loading patients in BookingMethodSelectView:", err);
    }
  };

  const handleConfirmPatient = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setIsPatientModalVisible(false);
  };

  const handleSelectAITriage = () => {
    if (!selectedPatientId) return;
    router.push({
      pathname: "/(patient)/triage/body-map",
      params: { patientId: selectedPatientId },
    });
  };

  const handleSelectSpecialty = () => {
    if (!selectedPatientId) return;
    router.push({
      pathname: "/(patient)/appointment/specialty-select",
      params: { patientId: selectedPatientId },
    });
  };

  const handleSelectPackage = () => {
    if (!selectedPatientId) return;
    router.push({
      pathname: "/(patient)/package/package-select",
      params: {
        patientId: selectedPatientId,
        patientName: selectedPatientName || "Bệnh nhân",
      },
    });
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />

      <View
        style={{
          backgroundColor: "#84AFEB",
          paddingTop: 56,
          paddingBottom: 38,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}
        className="shadow-md shadow-blue-900/15"
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
            className="active:opacity-70"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: "800",
                letterSpacing: -0.3,
              }}
            >
              Hình thức đặt khám
            </Text>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: 13,
                marginTop: 3,
                lineHeight: 18,
                fontWeight: "500",
              }}
            >
              Chọn phương thức khám phù hợp với bạn
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
      >

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 20,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          className="shadow-sm"
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#EFF6FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="person" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 2 }}
                numberOfLines={1}
              >
                {selectedPatientName || "Chưa chọn hồ sơ"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsPatientModalVisible(true)}
            style={{
              backgroundColor: "#EFF6FF",
              borderWidth: 1,
              borderColor: "#BFDBFE",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flexShrink: 0,
            }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>
              Đổi hồ sơ
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSelectAITriage}
          style={{
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 24,
            padding: 16,
          }}
          className="active:opacity-90 shadow-sm"
        >
          <View
            style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE" }}
            className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
          >
            <Ionicons name="bulb" size={24} color="#2563EB" />
          </View>

          <Text className="text-[16px] font-bold text-gray-900">AI Gợi Ý Chuyên Khoa</Text>
          <Text className="text-xs text-gray-500 leading-5 mt-1 mb-3">
            Phân tích triệu chứng & chỉ điểm vị trí đau.
          </Text>

          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-bold text-blue-600">Bắt đầu khám cùng AI</Text>
            <Ionicons name="chevron-forward" size={14} color="#2563EB" />
          </View>
        </Pressable>

        <View className="flex-row gap-3.5">

          <Pressable
            onPress={handleSelectSpecialty}
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 24,
              padding: 16,
              minHeight: 180,
            }}
            className="flex-1 justify-between active:opacity-90 shadow-sm"
          >
            <View>
              <View
                style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE" }}
                className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
              >
                <Ionicons name="medkit" size={24} color="#2563EB" />
              </View>
              <Text className="text-[15px] font-bold text-gray-900">Khám Chuyên Khoa</Text>
              <Text className="text-[11px] text-gray-500 mt-1 leading-4">
                Tự chọn khoa & bác sĩ
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mt-3">
              <Text className="text-xs font-bold text-blue-600">Chọn khoa</Text>
              <Ionicons name="chevron-forward" size={14} color="#2563EB" />
            </View>
          </Pressable>

          <Pressable
            onPress={handleSelectPackage}
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 24,
              padding: 16,
              minHeight: 180,
            }}
            className="flex-1 justify-between active:opacity-90 shadow-sm"
          >
            <View>
              <View
                style={{ backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#D1FAE5" }}
                className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
              >
                <Ionicons name="cube" size={24} color="#059669" />
              </View>
              <Text className="text-[15px] font-bold text-gray-900">Gói Sức Khỏe</Text>
              <Text className="text-[11px] text-gray-500 mt-1 leading-4">
                Tầm soát trọn gói
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mt-3">
              <Text className="text-xs font-bold text-emerald-600">Xem gói</Text>
              <Ionicons name="chevron-forward" size={14} color="#059669" />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => setIsPatientModalVisible(false)}
        selectedPatientId={selectedPatientId}
        onConfirm={handleConfirmPatient}
      />
    </ScreenWrapper>
  );
}
