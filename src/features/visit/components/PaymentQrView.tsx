import { Colors } from "@/config/colors";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { bookingStorageService } from "@/features/booking/services/booking-storage.service";
import { visitService } from "@/features/visit/services/visit.service";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { AppAlert } from "@/shared/utils/alert.utils";
import { formatVND, getQrCodeUrl } from "@/shared/utils/string.utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Clipboard,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  Modal
} from "react-native";
import { Image } from "expo-image";

export function PaymentQrView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fetchStepDetail, isFetchingStepDetail, fetchBookingResult, isFetchingResult } = useBooking();

  const stepId = params.stepId as string;
  const bookingId = params.bookingId as string;
  const bin = params.bin as string;
  const accountNumber = params.accountNumber as string;
  const accountName = params.accountName as string;
  const amountStr = params.amount as string;
  const description = params.description as string;
  const checkoutUrl = params.checkoutUrl as string;
  const qrCode = params.qrCode as string;
  const patientName = params.patientName as string;
  const patientId = (params.patientId as string) || "";
  const orderCode = (params.orderCode || params.ordercode) as string;

  const doctorName = params.doctorName as string;
  const specialtyName = params.specialtyName as string;
  const roomName = params.roomName as string;
  const selectedDate = params.selectedDate as string;
  const slotTime = params.slotTime as string;
  const isPackageBooking = params.isPackageBooking === "true";

  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleViewTicket = () => {
    setShowSuccessModal(false);
    router.replace("/(patient)/(tabs)/ticket");
  };

  const amount = parseInt(amountStr || "0", 10);
  const formattedAmount = formatVND(amount);

  const qrImageUrl = getQrCodeUrl(qrCode);

  const copyToClipboard = (text: string, label: string) => {
    try {
      Clipboard.setString(text);
      AppAlert.info(`Đã sao chép ${label} vào bộ nhớ tạm.`, "Đã sao chép");
    } catch {
      AppAlert.info(`${label}: ${text}`, "Sao chép");
    }
  };

  const handleOpenCheckoutUrl = async () => {
    if (!checkoutUrl) return;
    try {
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        AppAlert.error("Không thể mở trang thanh toán này trên thiết bị.");
      }
    } catch (err) {
      AppAlert.error("Đã xảy ra lỗi khi mở liên kết thanh toán.");
    }
  };

  const handleConfirmPayment = async () => {
    if (isPackageBooking) {
      if (!patientId) {
        AppAlert.error("Không tìm thấy mã bệnh nhân để xác nhận.");
        return;
      }

      setIsCheckingPayment(true);
      try {
        const activeRes = await visitService.getActiveFlow(patientId);
        const activeData = activeRes?.data || activeRes;
        const activeFlow = Array.isArray(activeData) ? activeData[0] : activeData;

        if (activeFlow && (activeFlow.flow_id || activeFlow.ticket_code)) {
          const foundStepId =
            activeFlow.steps?.[0]?.step_id ||
            stepId ||
            "";

          if (foundStepId) {
            await bookingStorageService.saveActiveBookingStep(foundStepId, patientName || "");
          }

          setShowSuccessModal(true);
          return;
        } else {
          AppAlert.info(
            "Hệ thống chưa ghi nhận giao dịch thanh toán cho gói khám này. Nếu bạn đã chuyển khoản, vui lòng đợi 1-2 phút rồi bấm lại nút xác nhận.",
            "Chưa nhận được thanh toán"
          );
          return;
        }
      } catch (err: any) {
        console.error("[PaymentQrView] Error checking active package flow:", err);
        AppAlert.info(
          "Hệ thống chưa ghi nhận giao dịch thanh toán cho gói khám này. Nếu bạn đã chuyển khoản, vui lòng đợi 1-2 phút rồi bấm lại nút xác nhận.",
          "Chưa nhận được thanh toán"
        );
        return;
      } finally {
        setIsCheckingPayment(false);
      }
    }

    if (!stepId) {
      AppAlert.error("Không tìm thấy mã bước tiếp nhận để xác nhận thanh toán.");
      return;
    }

    const bookingResult = await fetchBookingResult(stepId);
    if (!bookingResult) {
      AppAlert.info(
        "Hệ thống chưa ghi nhận giao dịch thanh toán cho lịch hẹn này. Nếu bạn đã chuyển khoản, vui lòng đợi 1-2 phút rồi bấm lại nút xác nhận.",
        "Chưa nhận được thanh toán"
      );
      return;
    }

    const stepDetail = await fetchStepDetail(stepId);
    if (!stepDetail) {
      return;
    }

    await bookingStorageService.saveActiveBookingStep(stepId, patientName || "");
    setShowSuccessModal(true);
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

          <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm active:opacity-75"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={Colors.neutral700}
              />
            </Pressable>
            <Text className="text-gray-800 text-[17px] font-bold">Thanh toán đặt lịch</Text>
            <View className="w-10" />
          </View>

          <View className="mx-5 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
            <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-3">
              Thông tin dịch vụ
            </Text>

            <View className="flex-row items-center pb-4 border-b border-gray-50 mb-4">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 text-[14px] font-bold">{doctorName || "Khám theo gói dịch vụ"}</Text>
                <Text className="text-gray-500 text-[11px] font-medium">{specialtyName}</Text>
              </View>
            </View>

            {roomName ? (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400 text-[12px] font-medium">Phòng khám</Text>
                <Text className="text-gray-700 text-[12px] font-bold">{roomName}</Text>
              </View>
            ) : null}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-[12px] font-medium">Thời gian khám</Text>
              <Text className="text-gray-700 text-[12px] font-bold">
                {slotTime ? `${slotTime} - ` : ""}{selectedDate || "Hôm nay"}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-[12px] font-medium">Mã đơn hàng</Text>
              <Text className="text-gray-700 text-[12px] font-bold">{orderCode || "--"}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-[12px] font-medium">Giá tiền</Text>
              <Text className="text-primary text-[12px] font-bold">{formattedAmount}</Text>
            </View>
          </View>

          <View className="mx-5 bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm items-center mb-6">

            <View className="bg-white p-3 rounded-[20px] border border-gray-100 shadow-sm mb-5 items-center justify-center">
              <Image
                source={{ uri: qrImageUrl }}
                style={{ width: 220, height: 220 }}
                contentFit="contain"
              />
            </View>

            <Text className="text-gray-400 text-[12px] font-semibold">Số tiền thanh toán</Text>
            <Text className="text-primary text-[24px] font-extrabold mb-2">{formattedAmount}</Text>

            {checkoutUrl ? (
              <Pressable
                onPress={handleOpenCheckoutUrl}
                className="mt-5 flex-row items-center gap-1.5 py-2 px-4 rounded-[12px] bg-blue-50 active:opacity-75"
              >
                <Ionicons name="globe-outline" size={14} color={Colors.primary} />
                <Text className="text-primary text-[12px] font-bold">Mở trang thanh toán PayOS</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        <View className="px-5 pb-12 pt-4 bg-white border-t border-gray-50">
          <AppButton
            title="Tôi đã thanh toán xong"
            isLoading={isFetchingStepDetail || isFetchingResult || isCheckingPayment}
            disabled={isFetchingStepDetail || isFetchingResult || isCheckingPayment}
            onPress={handleConfirmPayment}
          />
        </View>

        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white w-full rounded-[28px] overflow-hidden shadow-2xl max-w-sm relative">

              <View style={{ backgroundColor: "#82A9F5" }} className="h-24 w-full justify-center items-end px-5">
                <View className="bg-white px-3 py-1 rounded-full shadow-sm">
                  <Text className="text-gray-900 text-xs font-bold">Đã thanh toán</Text>
                </View>
              </View>

              <View className="items-center px-6 pt-12 pb-8 bg-white">

                <Text style={{ color: "#6C94EC" }} className="text-[20px] font-bold text-center mb-8 mt-4">
                  Thanh toán thành công!
                </Text>

                <Pressable
                  onPress={handleViewTicket}
                  style={{ backgroundColor: "#82A9F5" }}
                  className="w-full py-4 rounded-[20px] items-center justify-center shadow-lg active:opacity-90"
                >
                  <Text className="text-white text-base font-bold">Xem phiếu khám</Text>
                </Pressable>
              </View>

              <View
                style={{
                  backgroundColor: "#82A9F5",
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 5,
                  borderColor: "#FFFFFF",
                  position: "absolute",
                  top: 96 - 38,
                  left: "50%",
                  marginLeft: -38,
                }}
                className="items-center justify-center shadow-md z-20"
              >
                <Ionicons name="checkmark" size={36} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}
