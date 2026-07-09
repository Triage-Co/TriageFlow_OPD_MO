import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { useDoctorSlots } from "@/features/booking/hooks/useDoctorSlots";
import { Slot } from "@/features/booking/types/doctor.types";
import { AppButton } from "@/shared/components/AppButton";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { useBooking } from "@/features/booking/hooks/useBooking";

export default function DoctorSlotsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { submitBooking, isSubmitting } = useBooking();

  const doctorId = params.doctorId as string;
  const doctorName = (params.doctorName as string) || "Bác sĩ điều trị";
  const specialtyName = (params.specialtyName as string) || "Chuyên khoa";
  const initialDate = (params.selectedDate as string) || "2026-07-09";
  const licenseNumber = (params.licenseNumber as string) || "";
  const experienceYears = (params.experienceYears as string) || "0";

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const { slots, isLoading, error } = useDoctorSlots(doctorId, selectedDate);

  // Danh sách các ngày chọn (khớp với màn doctor-list)
  const dateOptions = [
    { label: "T2", day: "6", fullDate: "2026-07-06", labelExtra: "06/07" },
    { label: "T3", day: "7", fullDate: "2026-07-07", labelExtra: "07/07" },
    { label: "T4", day: "8", fullDate: "2026-07-08", labelExtra: "Hôm nay" },
    { label: "T5", day: "9", fullDate: "2026-07-09", labelExtra: "09/07" },
    { label: "T6", day: "10", fullDate: "2026-07-10", labelExtra: "10/07" },
    { label: "T7", day: "11", fullDate: "2026-07-11", labelExtra: "11/07" },
    { label: "CN", day: "12", fullDate: "2026-07-12", labelExtra: "12/07" },
  ];

  const getInitials = (name: string): string => {
    const cleanName = name.replace(/^(BS\.|BS|PGS\.|PGS|TS\.|TS|ThS\.|ThS)\s+/i, "");
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length === 0) return "DR";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0];
    const last = parts[parts.length - 1];
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot đã chọn khi đổi ngày
  };

  const handleSlotSelect = (slot: Slot) => {
    if (slot.status !== "AVAILABLE" || slot.capacity <= 0) return;
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    const patientId = user?.account_id || user?.id;
    if (!patientId) {
      Alert.alert(
        "Không tìm thấy tài khoản",
        "Vui lòng đăng nhập lại để thực hiện đặt lịch khám."
      );
      return;
    }

    const bookingResult = await submitBooking(patientId, selectedSlot.slot_id);
    if (bookingResult) {
      router.push({
        pathname: "/(patient)/visit/payment-qr",
        params: {
          stepId: bookingResult.step_id,
          bookingId: bookingResult.data.booking_id,
          bin: bookingResult.payment.data.bin,
          accountNumber: bookingResult.payment.data.accountNumber,
          accountName: bookingResult.payment.data.accountName,
          amount: bookingResult.payment.data.amount.toString(),
          description: bookingResult.payment.data.description,
          checkoutUrl: bookingResult.payment.data.checkoutUrl,
          qrCode: bookingResult.payment.data.qrCode,
          doctorName,
          specialtyName,
          selectedDate,
          slotTime: selectedSlot.start_time,
          licenseNumber,
        },
      });
    } else {
      Alert.alert(
        "Đặt lịch khám thất bại",
        "Có lỗi xảy ra trong quá trình tạo lịch khám. Vui lòng thử lại sau ít phút."
      );
    }
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-between">
        
        {/* ── NỘI DUNG CUỘN LÊN ── */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* ── 1. HEADER ── */}
          <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => pressed && { opacity: 0.75 }}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm"
            >
              <SymbolView
                name="chevron.left"
                size={18}
                tintColor={Colors.neutral700}
              />
            </Pressable>
            <Text className="text-gray-800 text-[17px] font-bold">Chọn ngày & giờ</Text>
            <View className="w-10" />
          </View>

          {/* ── 2. THÔNG TIN BÁC SĨ ĐÃ CHỌN ── */}
          <View className="mx-5 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-[#84AFEB]/20 items-center justify-center mr-4">
              <Text className="text-primary text-[14px] font-bold">
                {getInitials(doctorName)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 text-[15px] font-bold">{doctorName}</Text>
              <Text className="text-gray-500 text-[12px] font-medium">{specialtyName}</Text>
              <Text className="text-gray-400 text-[11px] font-medium mt-1">Số CCHN: {licenseNumber}</Text>
            </View>
            <View className="items-end bg-blue-50/50 p-2.5 rounded-[16px] border border-blue-50">
              <Text className="text-primary text-[14px] font-extrabold">{experienceYears} năm</Text>
              <Text className="text-gray-400 text-[9px] font-medium">Kinh nghiệm</Text>
            </View>
          </View>

          {/* ── 3. CHỌN NGÀY (DATE SELECTOR) ── */}
          <View className="mt-6">
            <Text className="text-gray-800 text-[14px] font-bold px-5 mb-2.5">Chọn ngày</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              className="flex-row"
            >
              {dateOptions.map((date) => {
                const isSelected = selectedDate === date.fullDate;
                return (
                  <Pressable
                    key={date.fullDate}
                    onPress={() => handleDateChange(date.fullDate)}
                    className={`w-14 py-3.5 rounded-[20px] items-center border ${
                      isSelected
                        ? "bg-primary border-primary shadow-sm"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-semibold mb-1 ${
                        isSelected ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {date.label}
                    </Text>
                    <Text
                      className={`text-[16px] font-bold ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {date.day}
                    </Text>
                    <Text
                      className={`text-[8px] font-medium mt-1 ${
                        isSelected ? "text-white/80" : "text-gray-400"
                      }`}
                    >
                      {date.labelExtra}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 4. CHỌN GIỜ KHÁM ── */}
          <View className="mt-6 px-5 mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-800 text-[14px] font-bold">Chọn giờ khám</Text>
              <Text className="text-gray-400 text-[11px] font-medium">{selectedDate}</Text>
            </View>

            {/* Chú giải trạng thái */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-white border border-gray-200" />
                <Text className="text-gray-500 text-[11px] font-medium">Còn trống</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-gray-100" />
                <Text className="text-gray-500 text-[11px] font-medium">Đã đầy</Text>
              </View>
            </View>

            {isLoading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text className="text-gray-400 text-[12px] font-medium mt-2">
                  Đang tải danh sách khung giờ khám...
                </Text>
              </View>
            ) : error ? (
              <View className="py-8 items-center justify-center">
                <SymbolView
                  name="exclamationmark.triangle.fill"
                  size={24}
                  tintColor="#EF4444"
                />
                <Text className="text-red-500 text-[12px] font-medium mt-2">{error}</Text>
              </View>
            ) : slots.length === 0 ? (
              <View className="py-12 items-center justify-center bg-gray-50/50 rounded-[20px] border border-dashed border-gray-200">
                <SymbolView
                  name="calendar.badge.exclamationmark"
                  size={28}
                  tintColor="#9CA3AF"
                />
                <Text className="text-gray-400 text-[12px] font-medium mt-2 text-center">
                  Không tìm thấy ca trực của bác sĩ trong ngày này.{"\n"}Vui lòng chọn ngày khác.
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2.5">
                {slots.map((slot) => {
                  const isAvailable = slot.status === "AVAILABLE" && slot.capacity > 0;
                  const isSelected = selectedSlot?.slot_id === slot.slot_id;

                  return (
                    <Pressable
                      key={slot.slot_id}
                      disabled={!isAvailable}
                      onPress={() => handleSlotSelect(slot)}
                      style={({ pressed }) => [
                        { width: "22.5%" },
                        pressed && { opacity: 0.75 }
                      ]}
                      className={`py-3 rounded-[16px] items-center border ${
                        isSelected
                          ? "bg-primary border-primary shadow-sm"
                          : !isAvailable
                          ? "bg-gray-100 border-gray-100"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-[13px] font-bold ${
                          isSelected
                            ? "text-white"
                            : !isAvailable
                            ? "text-gray-300 line-through"
                            : "text-gray-600"
                        }`}
                      >
                        {slot.start_time}
                      </Text>
                      <Text
                        className={`text-[8px] font-medium mt-0.5 ${
                          isSelected
                            ? "text-white/80"
                            : !isAvailable
                            ? "text-gray-300"
                            : "text-gray-400"
                        }`}
                      >
                        {isAvailable ? `${slot.capacity} chỗ` : "Hết chỗ"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── 5. NÚT XÁC NHẬN DƯỚI CÙNG ── */}
        <View className="px-5 pb-12 pt-4 bg-white border-t border-gray-50">
          <AppButton
            title={
              selectedSlot
                ? `Đặt lịch lúc ${selectedSlot.start_time}`
                : "Chọn khung giờ để tiếp tục"
            }
            disabled={!selectedSlot || isSubmitting}
            isLoading={isSubmitting}
            onPress={handleConfirmBooking}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
