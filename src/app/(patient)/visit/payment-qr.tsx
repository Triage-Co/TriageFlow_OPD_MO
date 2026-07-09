import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Clipboard,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { AppButton } from "@/shared/components/AppButton";
import { useBooking } from "@/features/booking/hooks/useBooking";

export default function PaymentQrScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fetchBookingResult, isFetchingResult } = useBooking();

  // Params from booking creation
  const stepId = params.stepId as string;
  const bookingId = params.bookingId as string;
  const bin = params.bin as string;
  const accountNumber = params.accountNumber as string;
  const accountName = params.accountName as string;
  const amountStr = params.amount as string;
  const description = params.description as string;
  const checkoutUrl = params.checkoutUrl as string;
  const qrCode = params.qrCode as string;

  // Params for displaying doctor details
  const doctorName = params.doctorName as string;
  const specialtyName = params.specialtyName as string;
  const selectedDate = params.selectedDate as string;
  const slotTime = params.slotTime as string;
  const licenseNumber = params.licenseNumber as string;

  const [paymentChecked, setPaymentChecked] = useState(false);

  const amount = parseInt(amountStr || "0", 10);
  const formattedAmount = amount.toLocaleString("vi-VN") + " VND";

  // Use official VietQR image generation or QR code generator api based on the payload qrCode
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    qrCode
  )}`;

  const copyToClipboard = (text: string, label: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert("Đã sao chép", `Đã sao chép ${label} vào bộ nhớ tạm.`);
    } catch {
      Alert.alert("Sao chép", `${label}: ${text}`);
    }
  };

  const handleOpenCheckoutUrl = async () => {
    if (!checkoutUrl) return;
    try {
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        Alert.alert("Lỗi", "Không thể mở trang thanh toán này trên thiết bị.");
      }
    } catch (err) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi mở liên kết thanh toán.");
    }
  };

  const handleConfirmPayment = async () => {
    if (!stepId) return;

    const result = await fetchBookingResult(stepId);
    if (result) {
      // Navigate to booking-success
      router.push({
        pathname: "/(patient)/visit/booking-success",
        params: {
          queueId: result.queue_id,
          stepId: result.step_id,
          queueNumber: result.queue_number,
          status: result.status,
          doctorName,
          specialtyName,
          selectedDate,
          slotTime,
          bookingId,
        },
      });
    } else {
      Alert.alert(
        "Chưa nhận được thanh toán",
        "Hệ thống chưa ghi nhận giao dịch thanh toán cho lịch hẹn này. Nếu bạn đã chuyển khoản, vui lòng đợi 1-2 phút rồi bấm lại nút xác nhận.",
        [{ text: "Đồng ý" }]
      );
    }
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* ── 1. HEADER ── */}
          <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm active:opacity-75"
            >
              <SymbolView
                name="chevron.left"
                size={18}
                tintColor={Colors.neutral700}
              />
            </Pressable>
            <Text className="text-gray-800 text-[17px] font-bold">Thanh toán đặt lịch</Text>
            <View className="w-10" />
          </View>

          {/* ── 2. THÔNG TIN LỊCH KHÁM ── */}
          <View className="mx-5 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
            <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-3">
              Thông tin dịch vụ
            </Text>
            
            <View className="flex-row items-center pb-4 border-b border-gray-50 mb-4">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <SymbolView name="person.fill" size={18} tintColor={Colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 text-[14px] font-bold">{doctorName}</Text>
                <Text className="text-gray-500 text-[11px] font-medium">{specialtyName}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-[12px] font-medium">Thời gian khám</Text>
              <Text className="text-gray-700 text-[12px] font-bold">
                {slotTime} - {selectedDate}
              </Text>
            </View>
            {licenseNumber ? (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400 text-[12px] font-medium">Số CCHN</Text>
                <Text className="text-gray-700 text-[12px] font-bold">{licenseNumber}</Text>
              </View>
            ) : null}
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-[12px] font-medium">Mã đặt lịch</Text>
              <Text className="text-gray-700 text-[12px] font-bold">{bookingId}</Text>
            </View>
          </View>

          {/* ── 3. KHU VỰC QUÉT MÃ QR ── */}
          <View className="mx-5 bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm items-center mb-6">
            <Text className="text-gray-800 text-[16px] font-bold text-center mb-1">
              Quét mã VietQR qua App Ngân hàng
            </Text>
            <Text className="text-gray-400 text-[11px] font-medium text-center mb-5">
              Hệ thống tự động kiểm tra trạng thái sau khi bạn thanh toán
            </Text>

            {/* QR Frame */}
            <View className="bg-white p-3 rounded-[20px] border border-gray-100 shadow-sm mb-5">
              <Image
                source={{ uri: qrImageUrl }}
                className="w-52 h-52"
                resizeMode="contain"
              />
            </View>

            {/* Số tiền cần thanh toán */}
            <Text className="text-gray-400 text-[12px] font-semibold">Số tiền thanh toán</Text>
            <Text className="text-primary text-[24px] font-extrabold mb-5">{formattedAmount}</Text>

            {/* Chi tiết chuyển khoản */}
            <View className="w-full bg-gray-50 rounded-[18px] p-4 gap-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-400 text-[12px] font-medium">Tên tài khoản</Text>
                <Pressable
                  onPress={() => copyToClipboard(accountName, "Tên tài khoản")}
                  className="flex-row items-center gap-1 active:opacity-60"
                >
                  <Text className="text-gray-700 text-[12px] font-bold mr-1">{accountName}</Text>
                  <SymbolView name="doc.on.doc" size={12} tintColor={Colors.textMuted} />
                </Pressable>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-400 text-[12px] font-medium">Số tài khoản</Text>
                <Pressable
                  onPress={() => copyToClipboard(accountNumber, "Số tài khoản")}
                  className="flex-row items-center gap-1 active:opacity-60"
                >
                  <Text className="text-gray-700 text-[12px] font-bold mr-1">{accountNumber}</Text>
                  <SymbolView name="doc.on.doc" size={12} tintColor={Colors.textMuted} />
                </Pressable>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-400 text-[12px] font-medium">Nội dung CK</Text>
                <Pressable
                  onPress={() => copyToClipboard(description, "Nội dung chuyển khoản")}
                  className="flex-row items-center gap-1 active:opacity-60"
                >
                  <Text className="text-gray-700 text-[12px] font-bold mr-1">{description}</Text>
                  <SymbolView name="doc.on.doc" size={12} tintColor={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Option to Open in browser */}
            {checkoutUrl ? (
              <Pressable
                onPress={handleOpenCheckoutUrl}
                className="mt-5 flex-row items-center gap-1.5 py-2 px-4 rounded-[12px] bg-blue-50 active:opacity-75"
              >
                <SymbolView name="safari" size={14} tintColor={Colors.primary} />
                <Text className="text-primary text-[12px] font-bold">Mở trang thanh toán PayOS</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {/* ── 4. ACTIONS DƯỚI CÙNG ── */}
        <View className="px-5 pb-12 pt-4 bg-white border-t border-gray-50">
          <AppButton
            title="Tôi đã thanh toán xong"
            isLoading={isFetchingResult}
            disabled={isFetchingResult}
            onPress={handleConfirmPayment}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
