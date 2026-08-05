import { ScrollView, View, Text, Pressable, Modal, ActivityIndicator, Alert, FlatList, Image as RNImage } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { patientService } from "@/features/patient/services/patient.service";
import { Patient } from "@/features/patient/types/patient.types";
import { SymbolView } from "expo-symbols";
import { AppButton } from "@/shared/components/AppButton";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";

/**
 * Home screen – Trang chủ của bệnh nhân
 * Thiết kế tỉ mỉ theo Figma, sử dụng 100% NativeWind
 */
export default function HomeScreen() {
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
  const [bookingFlowType, setBookingFlowType] = useState<"booking" | "triage" | "payment" | "package" | null>(null);
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);

  const loadPatients = async () => {
    try {
      const res = await patientService.getPatients();
      if (res?.data) {
        setPatients(res.data);
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

  const handlePressBooking = async (type: "booking" | "triage" | "payment" | "package") => {
    setBookingFlowType(type);
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
            onPress: () => router.push("/(patient)/patient-list"),
          }
        ]
      );
    } else {
      setSelectedPatientId(list[0].patient_id);
      setIsPatientModalVisible(true);
    }
  };

  const handleConfirmPatient = (patientId: string) => {
    console.log("[HomeScreen] handleConfirmPatient called with patientId:", patientId, "bookingFlowType:", bookingFlowType);
    setIsPatientModalVisible(false);
    setSelectedPatientId(patientId);

    if (bookingFlowType === "booking") {
      console.log("[HomeScreen] Navigating to specialty-select");
      router.push({
        pathname: "/(patient)/appointment/specialty-select",
        params: { patientId }
      });
    } else if (bookingFlowType === "triage") {
      console.log("[HomeScreen] Navigating to body-map");
      router.push({
        pathname: "/(patient)/body-map",
        params: { patientId }
      });
    } else if (bookingFlowType === "payment") {
      console.log("[HomeScreen] Navigating to pending-payments");
      const selected = patients.find(p => p.patient_id === patientId);
      router.push({
        pathname: "/(patient)/visit/pending-payments",
        params: { patientId, patientName: selected?.full_name || "Bệnh nhân" }
      });
    } else if (bookingFlowType === "package") {
      console.log("[HomeScreen] Navigating to package-select");
      try {
        router.push({
          pathname: "/(patient)/package/package-select",
          params: { patientId }
        });
      } catch (err) {
        console.error("[HomeScreen] router.push error:", err);
      }
    } else {
      console.warn("[HomeScreen] Unknown bookingFlowType:", bookingFlowType);
    }
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

        {/* ── Header Immersive (Nền primary tràn viền) ── */}
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

        {/* ── Thao tác nhanh (Quick Actions - Lưới 2x2 dạng đứng tối giản không nền) ── */}
        <View className="px-5 py-4 gap-4">
          {/* Hàng 1 */}
          <View className="flex-row gap-4">
            {/* Nút 1: Đặt lịch khám */}
            <Pressable
              onPress={() => handlePressBooking("booking")}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="calendar-outline" size={42} color="#A855F7" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Đặt lịch khám</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Đăng ký hẹn</Text>
            </Pressable>

            {/* Nút 2: Phiếu khám */}
            <Pressable
              onPress={() => router.push("/(patient)/(tabs)/ticket")}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="document-text-outline" size={42} color="#2563EB" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Phiếu khám</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Số thứ tự khám</Text>
            </Pressable>
          </View>

          {/* Hàng 2 */}
          <View className="flex-row gap-4">
            {/* Nút 3: Dẫn đường */}
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

            {/* Nút 4: Gói khám */}
            <Pressable
              onPress={() => handlePressBooking("package")}
              className="flex-1 bg-white rounded-[28px] p-5 border border-gray-100 shadow shadow-black/5 items-center justify-center active:scale-95 transition-transform"
            >
              <View className="mb-3.5 mt-1">
                <Ionicons name="medkit-outline" size={42} color="#10B981" />
              </View>
              <Text className="text-[14px] text-gray-800 font-extrabold text-center">Gói khám</Text>
              <Text className="text-[10px] text-gray-400 font-bold text-center mt-1">Gói sức khỏe</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Banner Đặt Khám ── */}
        <View className="px-5 mb-6">
          <Pressable
            onPress={() => handlePressBooking("triage")}
            className="bg-primary rounded-[24px] p-5 flex-row items-center justify-between shadow-sm shadow-primary/20 active:opacity-90"
          >
            <View className="flex-1 pr-4">
              <Text className="text-white/80 text-[12px] font-medium">Chưa đặt khám?</Text>
              <Text className="text-white text-[20px] font-extrabold mt-0.5">Đặt Khám</Text>
              <Text className="text-white/95 text-[11px] mt-1.5 leading-4">
                Mô tả triệu chứng để được hỗ trợ
              </Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white text-lg font-bold">›</Text>
            </View>
          </Pressable>
        </View>


        {/* ── Section: Mẹo sức khỏe ── */}
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

        {/* Tạo khoảng trống dưới cùng để tránh bị đè bởi Floating TabBar */}
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
