import { useState, useEffect, useCallback } from "react";
import { doctorService } from "../services/doctor.service";
import { DoctorDetail } from "../types/doctor.types";
import { getErrorMessage } from "@/shared/utils/error.utils";

export function useDoctorSlots(doctorId: string, date: string) {
  const [doctorDetail, setDoctorDetail] = useState<DoctorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !date) return;
    setIsLoading(true);
    setError(null);
    console.log(`[useDoctorSlots] Calling API getDoctorSlots with doctorId=${doctorId}, date=${date}`);
    try {
      const data = await doctorService.getDoctorSlots(doctorId, date);
      const slotCount = data?.existedSlot?.length || 0;
      console.log(`[useDoctorSlots] API Success: received doctor details and ${slotCount} slots`);
      setDoctorDetail(data);
    } catch (err: any) {
      console.error(`[useDoctorSlots] API Error:`, err.message || err);
      setError(getErrorMessage(err, "Không thể tải danh sách khung giờ khám"));
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return {
    doctorDetail,
    slots: doctorDetail?.existedSlot || [],
    isLoading,
    error,
    refetch: fetchSlots,
  };
}
