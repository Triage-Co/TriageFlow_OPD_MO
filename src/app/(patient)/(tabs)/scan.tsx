import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { AppAlert } from "@/shared/utils/alert.utils";
import { Colors } from "@/config/colors";
import { usePatient } from "@/features/patient/hooks/usePatient";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { maskCitizenId, getInitials, formatGenderLabel, getQrCodeUrl } from "@/shared/utils/string.utils";
import { calculateAgeFromDob } from "@/shared/utils/date.utils";

let CameraView: any = null;
let useCameraPermissions: any = null;
let isCameraAvailable = false;

try {
  const ExpoCamera = require("expo-camera");
  if (ExpoCamera && ExpoCamera.CameraView) {
    CameraView = ExpoCamera.CameraView;
    useCameraPermissions = ExpoCamera.useCameraPermissions;
    isCameraAvailable = true;
  }
} catch (e) {
  console.warn("ExpoCamera module is not compiled in this client, falling back to mock scanner.", e);
}

const useMockCameraPermissions = () => {
  const [perm] = useState({
    granted: true,
    status: "granted",
    canAskAgain: true,
    expires: "never",
  });
  const reqPerm = async () => perm;
  return [perm, reqPerm] as const;
};

const { width } = Dimensions.get("window");
const VIEWFINDER_SIZE = 260;
const LASER_MAX_TRAVEL = VIEWFINDER_SIZE - 4;

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const { patients, fetchPatients, isLoading } = usePatient();
  const [activeTab, setActiveTab] = useState<"personal" | "scan">("personal");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);

  const hookToUse = isCameraAvailable && useCameraPermissions ? useCameraPermissions : useMockCameraPermissions;
  const [permission, requestPermission] = hookToUse();

  const [scanned, setScanned] = useState(false);

  const translateY = useSharedValue(0);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (patients && patients.length > 0) {
      if (!selectedPatientId || !patients.some((p) => p.patient_id === selectedPatientId)) {
        setSelectedPatientId(patients[0].patient_id);
      }
    }
  }, [patients, selectedPatientId]);

  const handleConfirmPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsPatientModalVisible(false);
  };

  useEffect(() => {
    if (activeTab === "scan" && isCameraAvailable && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [activeTab, permission]);

  useEffect(() => {
    if (activeTab === "scan") {
      translateY.value = withRepeat(
        withSequence(
          withTiming(LASER_MAX_TRAVEL, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      );
    } else {
      translateY.value = 0;
    }
  }, [activeTab]);

  const laserStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const activePatient =
    patients?.find((p) => p.patient_id === selectedPatientId) ||
    (patients && patients.length > 0 ? patients[0] : null);

  const formatDobVi = (dobString?: string): string => {
    if (!dobString) return "Chưa cập nhật";
    const date = new Date(dobString);
    if (isNaN(date.getTime())) return dobString;
    const monthsVi = [
      "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
      "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
    ];
    return `${date.getDate()} ${monthsVi[date.getMonth()]} năm ${date.getFullYear()}`;
  };

  const patientName = activePatient?.full_name || user?.full_name || "Chưa cập nhật";
  const initials = getInitials(patientName, "PT");
  const patientCode = activePatient?.patient_id
    ? `BN-${activePatient.patient_id.substring(0, 8).toUpperCase()}`
    : "Chưa có mã hồ sơ";
  const patientGender = formatGenderLabel(activePatient?.gender, "Chưa cập nhật");
  const patientAge = activePatient?.dob ? calculateAgeFromDob(activePatient.dob) : null;
  const patientDob = formatDobVi(activePatient?.dob);
  const patientPhone = user?.phone || "Chưa cập nhật";
  const patientInsurance = activePatient?.medical_coverage_id
    ? `BHYT: ${activePatient.medical_coverage_id}`
    : "Chưa liên kết BHYT";

  const patientCitizenId = activePatient?.citizen_id
    ? maskCitizenId(activePatient.citizen_id)
    : user?.citizen_id
      ? maskCitizenId(user.citizen_id)
      : "Chưa cập nhật";

  const qrData = activePatient?.citizen_id || activePatient?.patient_id || user?.citizen_id || user?.id || "";
  const qrCodeUrl = qrData ? getQrCodeUrl(qrData, 300) : null;

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;
  const subTabBarBottom = bottomOffset + 68;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    AppAlert.info(
      `Đã quét mã Checkpoint thành công! Dữ liệu: ${data}`,
      "Checkpoint Check-in",
      () => setScanned(false)
    );
  };

  const handleMockScanClick = () => {
    handleBarcodeScanned({ data: "CHECKPOINT-MOCK-LOCATION-3F" });
  };

  const handleBack = () => {
    router.push("/(patient)/(tabs)/home");
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <View className="flex-1">
        {activeTab === "scan" ? (

          <View className="flex-1 bg-black relative">
            <StatusBar style="light" />

            {isCameraAvailable && CameraView ? (
              permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
              ) : null
            ) : (
              
              <Pressable
                onPress={handleMockScanClick}
                style={StyleSheet.absoluteFill}
                className="bg-slate-900 items-center justify-center"
              >
                <Ionicons name="camera-outline" size={48} color="#475569" className="opacity-40" />
                <Text className="text-slate-500 text-xs text-center mt-3 px-12 leading-5">
                  [Chế độ giả lập] Bấm bất kỳ đâu trên màn hình này để quét
                </Text>
              </Pressable>
            )}

            <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-12 pb-4 z-10 bg-black/20">
              <Pressable
                onPress={handleBack}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:opacity-75"
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
              <Text className="text-white text-[18px] font-bold font-sans">Quét QR Checkpoint</Text>
              <View className="w-10" />
            </View>

            <View className="flex-1 items-center justify-center px-10 pb-40 z-10">
              {!isCameraAvailable ? (

                <View className="items-center justify-center bg-black/75 p-6 rounded-3xl border border-white/10 w-full shadow-lg">
                  <Ionicons name="alert-circle-outline" size={48} color="#EAB308" className="mb-4" />
                  <Text className="text-white text-center font-bold text-[15px] mb-2">
                    Yêu cầu Rebuild lại ứng dụng (APK)
                  </Text>
                  <Text className="text-gray-400 text-center text-xs mb-6 px-3 leading-5">
                    Vì bạn chạy dưới dạng Dev Client, để mở camera sau thực tế, bạn cần đóng Metro server và chạy lệnh sau để build lại APK native:{"\n"}
                    <Text className="text-primary font-bold">npx expo run:android</Text>
                  </Text>
                  <Pressable
                    onPress={handleMockScanClick}
                    className="bg-primary px-6 py-3 rounded-2xl active:opacity-90 shadow-sm w-full items-center"
                  >
                    <Text className="text-white font-bold text-sm">Chạy chế độ giả lập để test</Text>
                  </Pressable>
                </View>
              ) : !permission ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : !permission.granted ? (

                <View className="items-center justify-center bg-black/70 p-6 rounded-3xl border border-white/10 w-full shadow-lg">
                  <Ionicons name="camera-outline" size={48} color="#FFFFFF" className="mb-4" />
                  <Text className="text-white text-center font-bold text-base mb-2">
                    Yêu cầu quyền truy cập Camera
                  </Text>
                  <Text className="text-gray-400 text-center text-xs mb-6 px-4 leading-5">
                    Ứng dụng cần sử dụng camera của bạn để quét mã QR tại các điểm checkpoint trong bệnh viện.
                  </Text>
                  <Pressable
                    onPress={requestPermission}
                    className="bg-primary px-6 py-3 rounded-2xl active:opacity-90 shadow-sm"
                  >
                    <Text className="text-white font-bold text-sm">Cấp quyền camera</Text>
                  </Pressable>
                </View>
              ) : (

                <>
                  <View
                    style={{ width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE }}
                    className="relative justify-center items-center bg-transparent"
                  >
                    
                    <View className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-white rounded-tl-[16px] z-10" />
                    <View className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-white rounded-tr-[16px] z-10" />
                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-white rounded-bl-[16px] z-10" />
                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-white rounded-br-[16px] z-10" />

                    <View
                      style={{ width: VIEWFINDER_SIZE - 8, height: VIEWFINDER_SIZE - 8 }}
                      className="bg-transparent rounded-[12px] overflow-hidden"
                    />

                    <Animated.View
                      style={[
                        styles.laserLine,
                        laserStyle,
                      ]}
                      className="absolute top-0 left-1 right-1 h-[3px] bg-[#10B981] z-10"
                    />
                  </View>

                  <View className="bg-black/50 px-5 py-2.5 rounded-full mt-8 shadow-sm">
                    <Text className="text-white text-xs font-bold leading-5">
                      Đặt mã QR vào khung để quét
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        ) : (
          
          <View className="flex-1">
            <StatusBar style="dark" />

            <View className="absolute top-0 left-0 right-0 h-44 bg-[#84AFEB]/30 rounded-b-[40px] z-0" />

            <View className="flex-row items-center justify-between px-5 pt-12 pb-4 z-10">
              <Pressable
                onPress={handleBack}
                className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm active:opacity-75"
              >
                <Ionicons name="chevron-back" size={20} color={Colors.neutral700} />
              </Pressable>
              <Text className="text-gray-800 text-[18px] font-bold">QR Cá Nhân</Text>
              <View className="w-10" />
            </View>

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : !activePatient ? (
              <View className="flex-1 px-6 pt-10 items-center justify-center">
                <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm w-full items-center">
                  <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
                    <Ionicons name="qr-code-outline" size={32} color={Colors.primary} />
                  </View>
                  <Text className="text-gray-800 text-[18px] font-bold mb-2 text-center">
                    Chưa có hồ sơ bệnh nhân
                  </Text>
                  <Text className="text-gray-400 text-xs text-center leading-5 mb-6 px-4">
                    Tài khoản của bạn chưa có hồ sơ bệnh nhân nào. Vui lòng tạo hồ sơ để được cấp mã QR cá nhân và phục vụ khám bệnh.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(patient)/triage/patient-list")}
                    className="bg-primary px-6 py-3.5 rounded-2xl active:opacity-90 shadow-sm w-full items-center"
                  >
                    <Text className="text-white font-bold text-sm">+ Tạo hồ sơ bệnh nhân</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 }}
                className="flex-1 z-10"
              >
                <View className="gap-4">
                  
                  <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                    
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                        Hồ sơ khám bệnh
                      </Text>
                      {patients && patients.length > 1 ? (
                        <Pressable
                          onPress={() => setIsPatientModalVisible(true)}
                          className="flex-row items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100/60 active:opacity-75"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="people-outline" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
                          <Text className="text-primary text-xs font-bold mr-1">Đổi hồ sơ</Text>
                          <Ionicons name="chevron-down" size={12} color={Colors.primary} />
                        </Pressable>
                      ) : null}
                    </View>

                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100/50 items-center justify-center mr-4 overflow-hidden">
                        {user?.avatar ? (
                          <Image
                            source={{ uri: user.avatar }}
                            style={{ width: 56, height: 56 }}
                            contentFit="cover"
                          />
                        ) : (
                          <Text className="text-primary text-[18px] font-bold">
                            {initials}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 text-[17px] font-extrabold" numberOfLines={1}>
                          {patientName}
                        </Text>
                        <Text className="text-gray-400 text-[12px] font-semibold mt-0.5">
                          {patientCode}
                        </Text>
                        <View className="flex-row items-center mt-1.5">
                          <View className="bg-blue-50/70 border border-blue-100/30 px-3 py-0.5 rounded-full mr-2">
                            <Text className="text-primary text-[10px] font-extrabold">{patientGender}</Text>
                          </View>
                          {patientAge !== null ? (
                            <View className="bg-slate-50 border border-slate-100 px-3 py-0.5 rounded-full">
                              <Text className="text-gray-400 text-[10px] font-bold">{patientAge} tuổi</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    <View className="h-[1px] bg-slate-100 w-full my-4" />

                    <View className="gap-2.5">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-400 text-[13px] font-medium">Số CCCD</Text>
                        <Text className="text-gray-800 text-[13px] font-bold font-mono">{patientCitizenId}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-400 text-[13px] font-medium">Ngày sinh</Text>
                        <Text className="text-gray-800 text-[13px] font-bold">{patientDob}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-400 text-[13px] font-medium">Điện thoại</Text>
                        <Text className="text-gray-800 text-[13px] font-bold">{patientPhone}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-400 text-[13px] font-medium">Bảo hiểm</Text>
                        <Text className={`${activePatient?.medical_coverage_id ? "text-green-600 font-extrabold" : "text-gray-400 font-semibold"} text-[13px]`}>
                          {patientInsurance}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {qrCodeUrl ? (
                    <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm items-center justify-center py-8">
                      
                      <View className="p-3 bg-white border border-slate-100 rounded-3xl shadow-sm mb-4">
                        <Image
                          source={{ uri: qrCodeUrl }}
                          style={{ width: 180, height: 180 }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text className="text-gray-400 text-xs text-center font-medium">
                        Mã định danh dùng cho quét tiếp đón tại viện
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        <View
          style={{ bottom: subTabBarBottom }}
          className="absolute left-5 right-5 z-20"
        >
          <View className="bg-white rounded-[24px] border border-slate-100 shadow-lg flex-row items-center h-16 p-1.5 justify-between">

            <Pressable
              onPress={() => setActiveTab("personal")}
              className="flex-1 items-center justify-center py-2"
            >
              <Ionicons
                name={activeTab === "personal" ? "grid" : "grid-outline"}
                size={20}
                color={activeTab === "personal" ? "#1E293B" : "#94A3B8"}
              />
              <Text
                style={{ fontSize: 10 }}
                className={`font-bold mt-1 ${activeTab === "personal" ? "text-slate-800" : "text-slate-400"
                  }`}
              >
                Mã Cá Nhân
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("scan")}
              className="flex-1 items-center justify-center py-2"
            >
              <Ionicons
                name={activeTab === "scan" ? "scan" : "scan-outline"}
                size={20}
                color={activeTab === "scan" ? "#10B981" : "#94A3B8"}
              />
              <Text
                style={{ fontSize: 10 }}
                className={`font-bold mt-1 ${activeTab === "scan" ? "text-emerald-500" : "text-slate-400"
                  }`}
              >
                Quét QR
              </Text>
            </Pressable>

          </View>
        </View>
      </View>

      <PatientPickerModal
        visible={isPatientModalVisible}
        onClose={() => setIsPatientModalVisible(false)}
        onConfirm={handleConfirmPatient}
        selectedPatientId={selectedPatientId}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  laserLine: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
});
