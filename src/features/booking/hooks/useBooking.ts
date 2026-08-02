import { useState, useCallback } from "react";
import { doctorService } from "../services/doctor.service";
import { BookingResponseData, BookingGenerateData, StepDetailData } from "../types/doctor.types";

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAuto, setIsSubmittingAuto] = useState(false);
  const [isFetchingResult, setIsFetchingResult] = useState(false);
  const [isFetchingStepDetail, setIsFetchingStepDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const submitBooking = useCallback(
    async (patientId: string, slotId: string): Promise<BookingResponseData | null> => {
      setIsSubmitting(true);
      setError(null);
      console.log(`[useBooking] Creating booking: patientId=${patientId}, slotId=${slotId}`);
      try {
        const response = await doctorService.createBooking(patientId, slotId);
        console.log("[useBooking] Create booking response:", JSON.stringify(response, null, 2));

        if (response.status === "success" || response.code === 200 || response.code === 201) {
          return response.data;
        }

        setError(response.message || "Đặt lịch khám thất bại. Vui lòng thử lại.");
        return null;
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || "Đặt lịch khám thất bại.";
        setError(errMsg);
        return { error: errMsg } as any; // Trả về object chứa field error thay vì ném lỗi để tránh màn hình đỏ ở môi trường Development
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const fetchBookingResult = useCallback(
    async (stepId: string): Promise<BookingGenerateData | null> => {
      setIsFetchingResult(true);
      setError(null);
      console.log(`[useBooking] Fetching booking result for stepId=${stepId}`);
      try {
        const response = await doctorService.getBookingGenerate(stepId);
        console.log("[useBooking] Get booking generate response:", JSON.stringify(response, null, 2));

        if (response.status === "success" || response.code === 200) {
          return response.data;
        }

        setError(response.message || "Xác nhận thanh toán thất bại.");
        return null;
      } catch (err: any) {
        console.error("[useBooking] Fetch booking result error:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Xác nhận thanh toán thất bại.";
        setError(errMsg);
        return null;
      } finally {
        setIsFetchingResult(false);
      }
    },
    []
  );

  const submitAutoBooking = useCallback(
    async (patientId: string, interviewToken: string): Promise<BookingResponseData | null> => {
      setIsSubmittingAuto(true);
      setError(null);
      console.log(`[useBooking] Creating auto booking: patientId=${patientId}`);
      try {
        const response = await doctorService.createAutoBooking(patientId, interviewToken);
        console.log("[useBooking] Create auto booking response:", JSON.stringify(response, null, 2));

        if (response.status === "success" || response.code === 200 || response.code === 201) {
          return response.data;
        }

        setError(response.message || "Xếp phòng khám tự động thất bại.");
        return null;
      } catch (err: any) {
        console.error("[useBooking] Create auto booking error:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Xếp phòng khám tự động thất bại.";
        setError(errMsg);
        return null;
      } finally {
        setIsSubmittingAuto(false);
      }
    },
    []
  );

  const fetchStepDetail = useCallback(
    async (stepId: string): Promise<StepDetailData | null> => {
      setIsFetchingStepDetail(true);
      setError(null);
      console.log(`[useBooking] Fetching step detail for stepId=${stepId}`);
      try {
        const response = await doctorService.getStepDetail(stepId);
        console.log("[useBooking] Get step detail response:", JSON.stringify(response, null, 2));

        if (response.status === "success" || response.code === 200) {
          return response.data;
        }

        setError(response.message || "Xác nhận thanh toán thất bại.");
        return null;
      } catch (err: any) {
        console.error("[useBooking] Fetch step detail error:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Xác nhận thanh toán thất bại.";
        setError(errMsg);
        return null;
      } finally {
        setIsFetchingStepDetail(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    isSubmittingAuto,
    isFetchingResult,
    isFetchingStepDetail,
    error,
    clearError,
    submitBooking,
    submitAutoBooking,
    fetchBookingResult,
    fetchStepDetail,
  };
}
