import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { visitService } from "../services/visit.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";

export function PendingPaymentsView() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const patientId = params.patientId as string;
  const patientName = params.patientName as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingSteps, setPendingSteps] = useState<any[]>([]);

  // States for Payment QR Modal
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const loadPendingPayments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await visitService.getPendingPaymentSteps(patientId);
      
      const data = response?.data || response || [];
      const stepsArray = Array.isArray(data) ? data : [];
      
      // Lọc các bước có trạng thái thanh toán chưa hoàn thành (PENDING)
      const pending = stepsArray.filter((s: any) => s.payment_status === "PENDING");
      setPendingSteps(pending);
    } catch (err) {
      console.error("[PendingPayments] Lỗi tải hóa đơn:", err);
      setPendingSteps([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadPendingPayments(true);
    }
  }, [patientId, loadPendingPayments]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingPayments(false);
  };

  const handleConfirmPayment = async () => {
    if (!selectedStep) return;
    setIsCheckingPayment(true);
    try {
      // Gọi API /api/booking/generate?step-id={stepId} để xác nhận giao dịch và sinh STT
      const res = await visitService.getBookingGenerate(selectedStep.step_id);
      
      if (res && (res.code === 200 || res.status === "success" || res.data)) {
        const queueObj = Array.isArray(res.data?.queue) ? res.data.queue[0] : res.data;
        const queueNumber = queueObj?.queue_number ?? res.data?.queue_number ?? "";

        Alert.alert(
          "Thanh toán thành công",
          `Giao dịch của bạn đã được ghi nhận. Số thứ tự khám của bạn là: ${queueNumber}`,
          [
            {
              text: "Đồng ý",
              onPress: () => {
                setSelectedStep(null);
                loadPendingPayments(true);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Chưa nhận được thanh toán",
          "Hệ thống chưa ghi nhận giao dịch của bạn. Nếu đã chuyển khoản, vui lòng đợi 1-2 phút rồi thử lại."
        );
      }
    } catch (err) {
      console.error("[PendingPayments] Xác nhận lỗi:", err);
      Alert.alert(
        "Chưa nhận được thanh toán",
        "Hệ thống chưa ghi nhận giao dịch của bạn. Nếu đã chuyển khoản, vui lòng đợi 1-2 phút rồi thử lại."
      );
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    const parts = dateTimeStr.split("T");
    const dateStr = parts[0].split("-").reverse().join("/");
    const timeStr = parts[1] ? parts[1].substring(0, 5) : "";
    return `${dateStr} ${timeStr}`;
  };

  const qrImageUrl = selectedStep?.qr_text
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        selectedStep.qr_text
      )}`
    : "";

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Header Area */}
      <View className="bg-primary pt-14 pb-5 flex-row items-center px-5 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="p-1 active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1 items-center mr-6">
          <Text className="text-white text-[17px] font-bold">Thanh Toán Dịch Vụ</Text>
          <Text className="text-white/80 text-[12px] font-medium mt-0.5">
            Hồ sơ: {patientName}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-xs mt-3">Đang tải danh sách hóa đơn...</Text>
        </View>
      ) : pendingSteps.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={44} color="#10B981" />
          </View>
          <Text className="text-gray-800 text-[16px] font-bold text-center">
            Đã thanh toán tất cả dịch vụ
          </Text>
          <Text className="text-gray-400 text-xs mt-1.5 text-center px-6 leading-[18px]">
            Hiện tại hồ sơ của {patientName} không có dịch vụ nào đang chờ thanh toán.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingSteps}
          keyExtractor={(item) => item.step_id}
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
            const createdTime = formatDateTime(item.created_at);
            const roomName = item.room_info?.room_name || "Đang xếp phòng";

            return (
              <Pressable
                onPress={() => setSelectedStep(item)}
                className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm active:opacity-95 flex-row justify-between items-center"
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      <Text className="text-primary text-[10px] font-bold">Chờ đóng phí</Text>
                    </View>
                    <Text className="text-gray-400 text-[10px] font-medium">{createdTime}</Text>
                  </View>
                  <Text className="text-gray-800 text-[15px] font-bold mb-1">
                    {item.step_name || "Dịch vụ chỉ định"}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Nơi thực hiện: <Text className="text-gray-700 font-semibold">{roomName}</Text>
                  </Text>
                </View>
                <View className="bg-primary/10 w-9 h-9 rounded-full items-center justify-center">
                  <Ionicons name="qr-code" size={16} color={Colors.primary} />
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* VietQR Payment Modal */}
      <Modal
        visible={!!selectedStep}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isCheckingPayment) setSelectedStep(null);
        }}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 space-y-6 max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
              <Text className="text-gray-800 text-lg font-bold">Quét Mã Chuyển Khoản</Text>
              <Pressable
                disabled={isCheckingPayment}
                onPress={() => setSelectedStep(null)}
                className="p-1 active:opacity-75"
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* QR Content */}
            <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
              <View className="items-center space-y-4">
                <Text className="text-gray-500 text-xs text-center px-4 leading-[18px]">
                  Mở ứng dụng ngân hàng và quét mã VietQR bên dưới để tự động điền thông tin đóng phí.
                </Text>

                {/* QR Image */}
                <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-md">
                  {qrImageUrl ? (
                    <Image
                      source={{ uri: qrImageUrl }}
                      className="w-52 h-52"
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="w-52 h-52 items-center justify-center bg-gray-50 rounded-xl">
                      <Text className="text-gray-400 text-xs font-semibold">Chưa có mã QR</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Dịch vụ</Text>
                    <Text className="text-gray-800 text-xs font-bold text-right flex-1 ml-4">
                      {selectedStep?.step_name || "Dịch vụ y tế"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Bệnh nhân</Text>
                    <Text className="text-gray-800 text-xs font-bold">{patientName}</Text>
                  </View>
                  <View className="border-t border-gray-100 my-1" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400 text-xs font-semibold">Trạng thái</Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time" size={13} color="#F59E0B" />
                      <Text className="text-[#F59E0B] text-xs font-bold">Chờ giao dịch</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Confirm Actions */}
              <View className="pt-2 gap-3 flex-row">
                <Pressable
                  disabled={isCheckingPayment}
                  onPress={() => setSelectedStep(null)}
                  className="flex-1 py-4 bg-gray-100 rounded-2xl items-center justify-center active:opacity-75"
                >
                  <Text className="text-gray-700 font-bold text-sm">Đóng</Text>
                </Pressable>
                <Pressable
                  disabled={isCheckingPayment}
                  onPress={handleConfirmPayment}
                  className="flex-[2] py-4 bg-primary rounded-2xl items-center justify-center flex-row gap-2 active:opacity-90"
                >
                  {isCheckingPayment ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-bold text-sm">Đang xác nhận...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <Text className="text-white font-bold text-sm">Tôi đã thanh toán xong</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
