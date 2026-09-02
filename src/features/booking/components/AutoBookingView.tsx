import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { AppAlert } from "@/shared/utils/alert.utils";
import { Colors } from "@/config/colors";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { patientService } from "@/features/patient/services/patient.service";

export function AutoBookingView() {
  const router = useRouter();
  const { interviewToken, patientId } = useTriage();
  const { submitAutoBooking } = useBooking();

  useEffect(() => {
    let active = true;

    const performAutoBooking = async () => {
      if (!interviewToken) {
        AppAlert.error("Không tìm thấy phiên chẩn đoán. Vui lòng thử lại.");
        router.replace("/(patient)/triage/body-map");
        return;
      }

      try {
        const patientsRes = await patientService.getPatients();
        if (!active) return;

        if (!patientsRes?.data || patientsRes.data.length === 0) {
          AppAlert.info(
            "Vui lòng tạo hồ sơ bệnh nhân trước khi đặt lịch.",
            "Không tìm thấy bệnh nhân"
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
          const paymentObj = (bookingResult as any).payment?.data || (bookingResult as any).payment || {};
          const bDoctor = (bookingResult as any).doctor || "Bác sĩ phụ trách";
          const bRoom = (bookingResult as any).room || "Phòng khám chỉ định AI";
          const bTicketCode = (bookingResult as any).ticket_code || "";

          router.replace({
            pathname: "/(patient)/visit/payment-qr",
            params: {
              stepId: bookingResult.step_id,
              bookingId: bookingResult.booking_id || (bookingResult as any).data?.booking_id || "",
              ticketCode: bTicketCode,
              doctorName: bDoctor,
              roomName: bRoom,
              specialtyName: bRoom,
              bin: paymentObj.bin || "",
              accountNumber: paymentObj.accountNumber || "",
              accountName: paymentObj.accountName || "",
              amount: (paymentObj.amount || 0).toString(),
              description: paymentObj.description || "Thanh toán xếp phòng tự động",
              checkoutUrl: paymentObj.checkoutUrl || "",
              qrCode: paymentObj.qrCode || "",
              orderCode: (paymentObj.orderCode || "").toString(),
              ordercode: (paymentObj.orderCode || "").toString(),
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
