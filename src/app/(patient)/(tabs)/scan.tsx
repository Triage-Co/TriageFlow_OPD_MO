import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
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
import { Colors } from "@/config/colors";
import { usePatient } from "@/features/patient/hooks/usePatient";
import { useAuthContext } from "@/features/auth/context/AuthContext";


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

  
  const hookToUse = isCameraAvailable && useCameraPermissions ? useCameraPermissions : useMockCameraPermissions;
  const [permission, requestPermission] = hookToUse();

  const [scanned, setScanned] = useState(false);

  
  const translateY = useSharedValue(0);

  
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  
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

  
  const activePatient = patients && patients.length > 0 ? patients[0] : null;

  
  const getInitials = (name: string): string => {
    const cleanName = name.replace(/^(BS\.|BS|PGS\.|PGS|TS\.|TS|ThS\.|ThS)\s+/i, "");
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length === 0) return "PT";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0];
    const last = parts[parts.length - 1];
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const calculateAge = (dobString?: string): number => {
    if (!dobString) return 39; 
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 39;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDobVi = (dobString?: string): string => {
    if (!dobString) return "15 tháng 3, 1985"; 
    const date = new Date(dobString);
    if (isNaN(date.getTime())) return dobString;
    const monthsVi = [
      "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
      "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
    ];
    return `${date.getDate()} ${monthsVi[date.getMonth()]} năm ${date.getFullYear()}`;
  };

  
  const patientName = activePatient?.full_name || "Nguyễn Thị Mai";
  const initials = getInitials(patientName);
  const patientCode = activePatient 
    ? `BN-${activePatient.patient_id.substring(0, 8).toUpperCase()}`
    : "BN-2024-15738";
  const patientGender = activePatient?.gender === "MALE" ? "Nam" : "Nữ";
  const patientAge = calculateAge(activePatient?.dob);
  const patientDob = formatDobVi(activePatient?.dob);
  const patientPhone = user?.phone || "+84 (028) 3456-7890";
  const patientInsurance = activePatient?.medical_coverage_id 
    ? "Hoạt động - BHYT liên kết" 
    : "Hoạt động - BHYT Bảo Việt";

  
  const qrData = activePatient?.patient_id || "BN-2024-15738-DEMO";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;
  const subTabBarBottom = bottomOffset + 68; 

  
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Alert.alert(
      "Checkpoint Check-in",
      `Đã quét mã Checkpoint thành công! Dữ liệu: ${data}`,
      [{ text: "OK", onPress: () => setScanned(false) }]
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

            {/* Live rear camera view covering the entire background */}
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
              /* Simulated camera feed when native module is missing */
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

            {/* ── 1. HEADER (DARK, overlay on top of camera) ── */}
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

            {/* ── 2. VIEW FINDER OVERLAY (centered on screen) ── */}
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
                    {/* Viewfinder Corner Borders */}
                    <View className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-white rounded-tl-[16px] z-10" />
                    <View className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-white rounded-tr-[16px] z-10" />
                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-white rounded-bl-[16px] z-10" />
                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-white rounded-br-[16px] z-10" />

                    {/* Completely transparent viewfinder center region */}
                    <View 
                      style={{ width: VIEWFINDER_SIZE - 8, height: VIEWFINDER_SIZE - 8 }}
                      className="bg-transparent rounded-[12px] overflow-hidden"
                    />

                    {/* Horizontal Glowing Scanning Laser Line */}
                    <Animated.View
                      style={[
                        styles.laserLine,
                        laserStyle,
                      ]}
                      className="absolute top-0 left-1 right-1 h-[3px] bg-[#10B981] z-10"
                    />
                  </View>

                  {/* Helper Text below Viewfinder with semi-transparent background */}
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
          // --- VIEW 2: PERSONAL QR CODE (LIGHT THEME) ---
          <View className="flex-1">
            <StatusBar style="dark" />

            {/* Header background block to match mockup styling */}
            <View className="absolute top-0 left-0 right-0 h-44 bg-[#84AFEB]/30 rounded-b-[40px] z-0" />

            {/* ── 1. HEADER (LIGHT) ── */}
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

            {/* ── 2. SCROLLABLE PATIENT INFOMATION & QR CARD ── */}
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 }}
                className="flex-1 z-10"
              >
                <View className="gap-4">
                  {/* Profile Card */}
                  <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                    {/* Top Profile Header */}
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
                          <View className="bg-slate-50 border border-slate-100 px-3 py-0.5 rounded-full">
                            <Text className="text-gray-400 text-[10px] font-bold">{patientAge} tuổi</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View className="h-[1px] bg-slate-100 w-full my-4" />

                    {/* Demographics key-value layout */}
                    <View className="gap-2.5">
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
                        <Text className="text-green-600 text-[13px] font-extrabold">{patientInsurance}</Text>
                      </View>
                    </View>
                  </View>

                  {/* QR Display Card */}
                  <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm items-center justify-center py-8">
                    {/* QR Image Wrapper */}
                    <View className="p-3 bg-white border border-slate-100 rounded-3xl shadow-sm mb-4">
                      <Image
                        source={{ uri: qrCodeUrl }}
                        style={{ width: 180, height: 180 }}
                        resizeMode="contain"
                      />
                    </View>

                    <Text className="text-gray-400 text-[11px] font-medium text-center px-6 leading-5">
                      Xuất trình mã QR này khi đăng ký hoặc xác thực y tế.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* ── 3. FLOATING SEGMENTED SUB-TAB BAR ── */}
        {/* Positioned absolutely and dynamically above the system tab bar */}
        <View 
          style={{ bottom: subTabBarBottom }} 
          className="absolute left-5 right-5 z-20"
        >
          <View className="bg-white rounded-[24px] border border-slate-100 shadow-lg flex-row items-center h-16 p-1.5 justify-between">
            
            {/* Tab 1: Mã Cá Nhân */}
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
                className={`font-bold mt-1 ${
                  activeTab === "personal" ? "text-slate-800" : "text-slate-400"
                }`}
              >
                Mã Cá Nhân
              </Text>
            </Pressable>

            {/* Tab 2: Quét QR */}
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
                className={`font-bold mt-1 ${
                  activeTab === "scan" ? "text-emerald-500" : "text-slate-400"
                }`}
              >
                Quét QR
              </Text>
            </Pressable>
            
          </View>
        </View>
      </View>
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
