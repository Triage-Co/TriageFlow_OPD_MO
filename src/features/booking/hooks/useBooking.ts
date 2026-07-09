import { useState, useCallback } from "react";
import { doctorService } from "../services/doctor.service";
import { BookingResponseData, BookingGenerateData } from "../types/doctor.types";

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingResult, setIsFetchingResult] = useState(false);
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
        console.error("[useBooking] Create booking error:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Đặt lịch khám thất bại.";
        setError(errMsg);
        return null;
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

  return {
    isSubmitting,
    isFetchingResult,
    error,
    clearError,
    submitBooking,
    fetchBookingResult,
  };
}
