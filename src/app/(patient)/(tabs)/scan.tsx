import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
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
import { useNavigationStore } from "@/features/navigation/store/useNavigationStore";
import { bookingStorageService } from "@/features/booking/services/booking-storage.service";
import { doctorService } from "@/features/booking/services/doctor.service";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { stripRoomName } from "@/shared/utils/string.utils";

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

  const hookToUse = isCameraAvailable && useCameraPermissions ? useCameraPermissions : useMockCameraPermissions;
  const [permission, requestPermission] = hookToUse();

  const [scanned, setScanned] = useState(false);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isCameraAvailable && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(LASER_MAX_TRAVEL, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const laserStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      let scannedRoomCode = "";
      let scannedRoomName = "";
      let scannedRoomId = "";

      // Hỗ trợ cả định dạng JSON lẫn Text prefix
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          scannedRoomCode = parsed.roomCode || parsed.room_code || parsed.code || "";
          scannedRoomName = parsed.roomName || parsed.room_name || parsed.name || "";
          scannedRoomId = parsed.roomId || parsed.room_id || parsed.id || "";
        }
      } catch {
        if (data.startsWith("CHECKPOINT:")) {
          const content = data.replace("CHECKPOINT:", "").trim();
          const parts = content.split("|");
          scannedRoomCode = parts[0] || "";
          scannedRoomName = parts[1] || "";
          scannedRoomId = parts[2] || "";
        } else if (data === "CHECKPOINT-MOCK-LOCATION-3F") {
          scannedRoomCode = "G2.1.ELEVATORS";
          scannedRoomName = "Khu Thang Máy";
          scannedRoomId = "elevators-t1";
        } else {
          scannedRoomCode = data.trim();
        }
      }

      if (!scannedRoomCode && !scannedRoomName && !scannedRoomId) {
        showGlobalToast("Mã QR không đúng định dạng Checkpoint bệnh viện!", "error");
        setScanned(false);
        return;
      }

      // Giữ nguyên Điểm đến (Target Room) đã chọn trước đó hoặc lấy từ Phiếu khám hôm nay
      const storeTargetRoom = useNavigationStore.getState().targetRoom;
      let targetRoomName = storeTargetRoom?.roomLabel || "";
      let targetRoomCode = storeTargetRoom?.roomCode || "";
      let targetRoomId = storeTargetRoom?.id || "";

      if (!targetRoomName && !targetRoomId && !targetRoomCode) {
        try {
          const activeBooking = await bookingStorageService.getActiveBookingStep();
          if (activeBooking) {
            const stepDetail = await doctorService.getStepDetail(activeBooking.stepId, { skipGlobalToast: true });
            if (stepDetail?.data) {
              const room = (stepDetail.data as any).flow?.booking?.slot?.shift?.room;
              if (room) {
                targetRoomName = stripRoomName(room.room_name || "");
                targetRoomCode = room.room_code || "";
                targetRoomId = room.room_id || "";
              }
            }
          }
        } catch (err) {
          console.warn("[ScanScreen] Không lấy được phòng khám từ active booking:", err);
        }
      }

      showGlobalToast(
        `Đã định vị tại: ${scannedRoomName || scannedRoomCode}`,
        "success"
      );

      // Chuyển sang Bản đồ với Điểm đi (Start Room) vừa quét và Điểm đến (Target Room)
      router.push({
        pathname: "/(patient)/(tabs)/navigation",
        params: {
          startRoomCode: scannedRoomCode,
          startRoomName: scannedRoomName,
          startRoomId: scannedRoomId,
          targetRoomCode: targetRoomCode,
          targetRoomName: targetRoomName,
          targetRoomId: targetRoomId,
          _t: String(Date.now()),
        },
      });
    } catch (error) {
      console.error("[ScanScreen] Lỗi khi xử lý QR Checkpoint:", error);
      showGlobalToast("Không thể xử lý mã QR này. Vui lòng thử lại!", "error");
    } finally {
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const handleMockScanClick = () => {
    handleBarcodeScanned({
      data: JSON.stringify({
        type: "CHECKPOINT",
        roomCode: "G2.1.ELEVATORS",
        roomName: "Khu Thang Máy",
        roomId: "elevators-t1",
      }),
    });
  };

  const handleBack = () => {
    router.push("/(patient)/(tabs)/home");
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
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

        {/* Top Header */}
        <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-12 pb-4 z-10 bg-black/30">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:opacity-75"
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-[18px] font-bold">Quét QR Checkpoint</Text>
          <View className="w-10" />
        </View>

        {/* Viewfinder & Laser Area */}
        <View className="flex-1 items-center justify-center px-10 pb-20 z-10">
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
                {/* 4 Corner Markers */}
                <View className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-white rounded-tl-[16px] z-10" />
                <View className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-white rounded-tr-[16px] z-10" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-white rounded-bl-[16px] z-10" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-white rounded-br-[16px] z-10" />

                <View
                  style={{ width: VIEWFINDER_SIZE - 8, height: VIEWFINDER_SIZE - 8 }}
                  className="bg-transparent rounded-[12px] overflow-hidden"
                />

                {/* Animated Laser Line */}
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
