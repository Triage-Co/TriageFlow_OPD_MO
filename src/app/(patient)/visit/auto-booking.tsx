import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { patientService } from "@/features/patient/services/patient.service";

export default function AutoBookingScreen() {
  const router = useRouter();
  const { interviewToken, patientId } = useTriage();
  const { submitAutoBooking, isSubmittingAuto } = useBooking();

  useEffect(() => {
    let active = true;

    const performAutoBooking = async () => {
      if (!interviewToken) {
        Alert.alert("Lỗi", "Không tìm thấy phiên chẩn đoán. Vui lòng thử lại.");
        router.replace("/(patient)/body-map");
        return;
      }

      try {
        
        const patientsRes = await patientService.getPatients();
        if (!active) return;

        if (!patientsRes?.data || patientsRes.data.length === 0) {
          Alert.alert(
            "Không tìm thấy bệnh nhân",
            "Vui lòng tạo hồ sơ bệnh nhân trước khi đặt lịch."
          );
          router.back();
          return;
        }

        const targetPatient = patientId
          ? patientsRes.data.find((p) => p.patient_id === patientId) || patientsRes.data[0]
          : patientsRes.data[0];
        const finalPatientId = targetPatient.patient_id;
        const patientName = targetPatient.full_name;

        
        const bookingResult = await submitAutoBooking(finalPatientId, interviewToken);
        if (!active) return;

        if (bookingResult) {
          router.replace({
            pathname: "/(patient)/visit/payment-qr",
            params: {
              stepId: bookingResult.step_id,
              bookingId: bookingResult.booking_id || bookingResult.data?.booking_id || "",
              bin: bookingResult.payment.data.bin,
              accountNumber: bookingResult.payment.data.accountNumber,
              accountName: bookingResult.payment.data.accountName,
              amount: bookingResult.payment.data.amount.toString(),
              description: bookingResult.payment.data.description,
              checkoutUrl: bookingResult.payment.data.checkoutUrl,
              qrCode: bookingResult.payment.data.qrCode,
              orderCode: bookingResult.payment.data.orderCode.toString(),
              ordercode: bookingResult.payment.data.orderCode.toString(),
              patientName,
              patientId: finalPatientId,
              flowType: "auto",
            },
          });
        } else {
          router.back();
        }
      } catch (err: any) {
        console.error("[AutoBooking] Lỗi xếp phòng tự động:", err);
        if (active) {
          router.back();
        }
      }
    };

    performAutoBooking();

    return () => {
      active = false;
    };
  }, [interviewToken]);

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-gray-800 text-[16px] font-bold mt-5 text-center">
          Đang tự động sắp xếp phòng khám...
        </Text>
        <Text className="text-gray-400 text-[12px] font-medium mt-2 text-center leading-5">
          Hệ thống AI đang phân tích triệu chứng để chỉ định phòng khám và bác sĩ phù hợp nhất cho bạn. Vui lòng đợi trong giây lát.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 px-6 py-3 rounded-full border border-gray-200 bg-white shadow-sm active:opacity-75"
        >
          <Text className="text-gray-600 text-[13px] font-bold">Hủy xếp phòng</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
