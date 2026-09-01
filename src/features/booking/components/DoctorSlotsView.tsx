import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { AppAlert } from "@/shared/utils/alert.utils";
import { Colors } from "@/config/colors";
import { useDoctorSlots } from "@/features/booking/hooks/useDoctorSlots";
import { Slot } from "@/features/booking/types/doctor.types";
import { AppButton } from "@/shared/components/AppButton";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { patientService } from "@/features/patient/services/patient.service";
import { getInitials } from "@/shared/utils/string.utils";
import { toISODateString } from "@/shared/utils/date.utils";

export function DoctorSlotsView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { submitBooking, isSubmitting } = useBooking();

  const doctorId = params.doctorId as string;
  const doctorName = params.doctorName as string;
  const specialtyName = params.specialtyName as string;
  const initialDate = params.selectedDate as string;
  const experienceYears = params.experienceYears as string;

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const today = new Date();
  const todayStr = toISODateString(today);
  const isToday = initialDate === todayStr;
  const currentHours = today.getHours();
  const currentMinutes = today.getMinutes();

  const { slots, isLoading, error } = useDoctorSlots(doctorId, initialDate);

  const morningSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (!slot.start_time) return false;
      const parts = slot.start_time.split(":");
      if (parts.length < 2) return true;
      const slotHours = parseInt(parts[0], 10);
      return slotHours < 12;
    });
  }, [slots]);

  const afternoonSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (!slot.start_time) return false;
      const parts = slot.start_time.split(":");
      if (parts.length < 2) return false;
      const slotHours = parseInt(parts[0], 10);
      return slotHours >= 12;
    });
  }, [slots]);

  const handleSlotSelect = (slot: Slot) => {
    if (slot.status !== "AVAILABLE" || slot.capacity <= 0) return;
    setSelectedSlot(slot);
  };

  const renderSlotItem = (slot: Slot) => {
    let isPastSlot = false;
    if (isToday) {
      const parts = slot.start_time.split(":");
      if (parts.length >= 2) {
        const slotHours = parseInt(parts[0], 10);
        const slotMinutes = parseInt(parts[1], 10);
        if (
          slotHours < currentHours ||
          (slotHours === currentHours && slotMinutes <= currentMinutes)
        ) {
          isPastSlot = true;
        }
      }
    }

    const isAvailable = slot.status === "AVAILABLE" && slot.capacity > 0 && !isPastSlot;
    const isSelected = selectedSlot?.slot_id === slot.slot_id;

    return (
      <TouchableOpacity
        key={`${isSelected ? "selected" : "unselected"}-${slot.slot_id}`}
        disabled={!isAvailable}
        onPress={() => handleSlotSelect(slot)}
        activeOpacity={0.7}
        style={{ width: "22.5%" }}
        className={`py-3 rounded-[18px] items-center justify-center border ${isSelected
          ? "bg-primary border-primary shadow-md shadow-primary/20"
          : !isAvailable
            ? "bg-gray-50 border-gray-100 opacity-50"
            : "bg-white border-gray-100 shadow-sm shadow-black/5"
          }`}
      >
        <Text
          className={`text-[14px] font-extrabold ${isSelected
            ? "text-white"
            : !isAvailable
              ? "text-gray-300"
              : "text-gray-700"
            }`}
        >
          {slot.start_time}
        </Text>

        <View
          className={`w-5 h-[1.5px] my-1 ${isSelected ? "bg-white/30" : "bg-gray-100"
            }`}
        />

        <Text
          className={`text-[10px] font-bold ${isSelected
            ? "text-white/80"
            : !isAvailable
              ? "text-gray-300"
              : "text-gray-400"
            }`}
        >
          {slot.end_time}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    const accountId = user?.account_id || user?.id;
    if (!accountId) {
      AppAlert.info(
        "Vui lòng đăng nhập lại để thực hiện đặt lịch khám.",
        "Không tìm thấy tài khoản"
      );
      return;
    }

    try {
      const patientsRes = await patientService.getPatients();
      if (!patientsRes?.data || patientsRes.data.length === 0) {
        AppAlert.info(
          "Vui lòng tạo hồ sơ bệnh nhân trước khi đặt lịch.",
          "Không tìm thấy bệnh nhân"
        );
        return;
      }

      const targetPatient = params.patientId
        ? patientsRes.data.find((p) => p.patient_id === params.patientId) || patientsRes.data[0]
        : patientsRes.data[0];
      const patientId = targetPatient.patient_id;
      const patientName = targetPatient.full_name;

      const bookingResult = await submitBooking(patientId, selectedSlot.slot_id);

      if (bookingResult && !("error" in bookingResult)) {
        const bTicketCode = (bookingResult as any)?.ticket_code || "";
        const bRoom =
          (bookingResult as any)?.room ||
          (bookingResult as any)?.room_name ||
          (selectedSlot as any)?.room?.room_name ||
          (selectedSlot as any)?.shift?.room?.room_name ||
          (params.roomName as string) ||
          "";

        router.push({
          pathname: "/(patient)/visit/payment-qr",
          params: {
            stepId: bookingResult.step_id,
            bookingId: bookingResult.booking_id || bookingResult.data?.booking_id || "",
            ticketCode: bTicketCode,
            bin: bookingResult.payment.data.bin,
            accountNumber: bookingResult.payment.data.accountNumber,
            accountName: bookingResult.payment.data.accountName,
            amount: bookingResult.payment.data.amount.toString(),
            description: bookingResult.payment.data.description,
            checkoutUrl: bookingResult.payment.data.checkoutUrl,
            qrCode: bookingResult.payment.data.qrCode,
            orderCode: bookingResult.payment.data.orderCode.toString(),
            ordercode: bookingResult.payment.data.orderCode.toString(),
            doctorName,
            specialtyName,
            roomName: bRoom,
            selectedDate: initialDate,
            slotTime: selectedSlot.start_time,
            patientName,
            patientId,
          },
        });
      } else {
        console.warn("[DoctorSlots] Booking failed:", (bookingResult as any)?.error);
      }
    } catch (err: any) {
      console.error("[DoctorSlots] Connection error:", err);
    }
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-between">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          
          <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={Colors.neutral700}
              />
            </TouchableOpacity>
            <Text className="text-gray-800 text-[17px] font-bold">Chọn giờ khám</Text>
            <View className="w-10" />
          </View>

          <View className="mx-5 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-[#84AFEB]/20 items-center justify-center mr-4">
              <Text className="text-primary text-[14px] font-bold">
                {getInitials(doctorName)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 text-[15px] font-bold">{doctorName}</Text>
              <Text className="text-gray-500 text-[12px] font-medium">{specialtyName}</Text>

              <View className="flex-row items-center mt-1">
                <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
                <Text className="text-gray-600 text-[11px] font-semibold ml-1">
                  Ngày khám: {initialDate}
                </Text>
              </View>
            </View>
            <View className="items-end bg-blue-50/50 p-2.5 rounded-[16px] border border-blue-50">
              <Text className="text-primary text-[14px] font-extrabold">{experienceYears} năm</Text>
              <Text className="text-gray-400 text-[9px] font-medium">Kinh nghiệm</Text>
            </View>
          </View>

          <View className="mt-6 px-5 mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-800 text-[14px] font-bold">Chọn giờ khám</Text>
              <Text className="text-gray-400 text-[11px] font-medium">{initialDate}</Text>
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
                <Ionicons
                  name="alert-circle"
                  size={28}
                  color="#EF4444"
                />
                <Text className="text-red-500 text-[12px] font-medium mt-2">{error}</Text>
              </View>
            ) : slots.length === 0 ? (
              <View className="py-12 items-center justify-center bg-gray-50/50 rounded-[20px] border border-dashed border-gray-200">
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color="#9CA3AF"
                />
                <Text className="text-gray-400 text-[12px] font-medium mt-2 text-center">
                  Không tìm thấy ca trực của bác sĩ trong ngày này.{"\n"}Vui lòng quay lại chọn ngày khác.
                </Text>
              </View>
            ) : (
              <View className="gap-6">
                
                {morningSlots.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="w-6 h-6 rounded-full bg-amber-50 items-center justify-center border border-amber-100">
                        <Ionicons name="sunny-outline" size={13} color="#D97706" />
                      </View>
                      <Text className="text-gray-800 text-[13px] font-bold">
                        Buổi sáng
                      </Text>
                    </View>

                    <View className="flex-row flex-wrap gap-2.5">
                      {morningSlots.map((slot: Slot) => renderSlotItem(slot))}
                    </View>
                  </View>
                )}

                {afternoonSlots.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="w-6 h-6 rounded-full bg-blue-50 items-center justify-center border border-blue-100">
                        <Ionicons name="partly-sunny-outline" size={13} color={Colors.primary} />
                      </View>
                      <Text className="text-gray-800 text-[13px] font-bold">
                        Buổi chiều
                      </Text>

                    </View>

                    <View className="flex-row flex-wrap gap-2.5">
                      {afternoonSlots.map((slot: Slot) => renderSlotItem(slot))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View className="px-5 pb-12 pt-4 bg-white border-t border-gray-50">
          <AppButton
            title={
              selectedSlot
                ? `Đặt lịch: ${selectedSlot.start_time} - ${selectedSlot.end_time}`
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
