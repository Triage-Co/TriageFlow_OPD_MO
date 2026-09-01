import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { patientService } from "@/features/patient/services/patient.service";
import { Patient } from "@/features/patient/types/patient.types";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";

export function HomeView() {
  const { user } = useAuthContext();
  const router = useRouter();

  const getInitials = (name?: string) => {
    if (!name) return "BN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);

  const loadPatients = async () => {
    try {
      const res = await patientService.getPatients();
      if (res?.data) {
        setPatients(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0].patient_id);
        }
        return res.data;
      }
    } catch (err) {
      console.log("Error loading patients on home screen:", err);
    }
    return [];
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleOpenBookingHub = async () => {
    setIsFetchingPatients(true);
    const list = await loadPatients();
    setIsFetchingPatients(false);

    if (list.length === 0) {
      Alert.alert(
        "Yêu cầu hồ sơ",
        "Tài khoản của bạn chưa có hồ sơ bệnh nhân nào. Vui lòng tạo hồ sơ bệnh nhân mới trước.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Tạo hồ sơ",
            onPress: () => router.push("/(patient)/triage/patient-list"),
          },
        ]
      );
    } else {
      if (!selectedPatientId && list.length > 0) {
        setSelectedPatientId(list[0].patient_id);
      }
      setIsPatientModalVisible(true);
    }
  };

  const handleConfirmPatient = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setIsPatientModalVisible(false);
    router.push({
      pathname: "/(patient)/appointment/method-select",
      params: {
        patientId,
        patientName,
      },
    });
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Immersive */}
        <View className="bg-primary rounded-b-[36px] px-6 pt-14 pb-8 shadow-md">
          <View className="flex-row items-center justify-between">
            {/* Trái: Avatar và lời chào */}
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: 48, height: 48 }} contentFit="cover" />
                ) : (
                  <Text className="text-white text-base font-bold">{getInitials(user?.full_name)}</Text>
                )}
              </View>
              <View>
                <Text className="text-white/80 text-xs font-medium">Xin chào,</Text>
                <Text className="text-white text-lg font-bold mt-0.5">
                  {user?.full_name ?? "Bệnh nhân"}
                </Text>
              </View>
            </View>

            {/* Phải: Chuông thông báo */}
            <Pressable className="w-10 h-10 rounded-full bg-white/20 items-center justify-center relative active:opacity-80">
              <Ionicons name="notifications" size={22} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Thao tác nhanh - 4 Card */}
        <View className="px-5 py-4 gap-4">
          <View className="flex-row gap-4">
            {/* Card 1: Lịch hẹn (Từ ngày mai trở đi) */}
            <Pressable
              onPress={() => router.push("/appointment/my-appointments")}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="calendar-outline" size={42} color="#8B5CF6" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Lịch hẹn</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Hẹn từ ngày mai</Text>
            </Pressable>

            {/* Card 2: Phiếu khám (Trong ngày) */}
            <Pressable
              onPress={() => router.push("/(patient)/(tabs)/ticket")}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="document-text-outline" size={42} color="#2563EB" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Phiếu khám</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Số thứ tự hôm nay</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-4">
            {/* Card 3: Dẫn đường */}
            <Pressable
              onPress={() => router.push("/(patient)/(tabs)/navigation")}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="map-outline" size={42} color="#EA580C" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Dẫn đường</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Bản đồ 3D</Text>
            </Pressable>

            {/* Card 4: Hóa đơn & Viện phí */}
            <Pressable
              onPress={() => router.push("/(patient)/invoice" as any)}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="receipt-outline" size={42} color="#059669" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Hóa đơn & Viện phí</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Lịch sử & Biên lai</Text>
            </Pressable>
          </View>
        </View>

        {/* Banner Đặt Khám */}
        <View className="px-5 mb-6">
          <Pressable
            onPress={handleOpenBookingHub}
            className="bg-primary rounded-[28px] px-6 py-6 flex-row items-center justify-between shadow-md shadow-primary/25 active:opacity-90 min-h-[112px]"
          >
            <View className="flex-1 pr-3 justify-center">
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 34,
                  fontWeight: "900",
                  letterSpacing: -0.8,
                  lineHeight: 38,
                }}
              >
                Đặt Khám
              </Text>
              <Text className="text-white/90 text-[13px] mt-2 leading-5 font-semibold">
                AI gợi ý chuyên khoa • Đặt khám • Gói sức khỏe
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center flex-shrink-0 ml-1">
              <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* Mẹo sức khỏe */}
        <View className="px-5 mb-8">
          <Text className="text-gray-800 text-[16px] font-bold mb-3">Mẹo sức khỏe</Text>
          <View className="bg-amber-100/70 border border-amber-200/50 rounded-2xl p-5 flex-row items-center gap-4">
            <Text className="text-4xl text-amber-500">🧡</Text>
            <View className="flex-1">
              <Text className="text-amber-900 text-sm font-bold">
                Uống đủ 2L nước mỗi ngày
              </Text>
              <Text className="text-amber-800/80 text-xs mt-1 leading-[18px]">
                Giúp cơ thể duy trì hoạt động tối ưu và tăng cường miễn dịch.
              </Text>
            </View>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Modal chọn bệnh nhân */}
      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => setIsPatientModalVisible(false)}
        selectedPatientId={selectedPatientId}
        onConfirm={handleConfirmPatient}
      />

      {/* Fetching overlay */}
      {isFetchingPatients && (
        <View className="absolute inset-0 bg-black/10 items-center justify-center z-50">
          <View className="bg-white p-4 rounded-2xl flex-row items-center gap-3 shadow-md">
            <ActivityIndicator size="small" color="#84AFEB" />
            <Text className="text-gray-700 text-sm font-medium">Đang tải hồ sơ...</Text>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}


