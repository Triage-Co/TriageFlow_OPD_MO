import { useState, useEffect, useCallback } from "react";
import { doctorService } from "../services/doctor.service";
import { Doctor } from "../types/doctor.types";
import { getErrorMessage } from "@/shared/utils/error.utils";

export function useDoctorList(specialtyCode: string, date: string) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    if (!specialtyCode || !date) return;
    setIsLoading(true);
    setError(null);
    console.log(`[useDoctorList] Calling API getDoctorsBySpecialty with specialty_code=${specialtyCode}, date_time=${date}`);
    try {
      const data = await doctorService.getDoctorsBySpecialty(specialtyCode, date);
      console.log(`[useDoctorList] API Success: received ${data.length} doctors`);
      setDoctors(data);
    } catch (err: any) {
      console.error(`[useDoctorList] API Error:`, err.message || err);
      setError(getErrorMessage(err, "Không thể tải danh sách bác sĩ"));
    } finally {
      setIsLoading(false);
    }
  }, [specialtyCode, date]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, isLoading, error, refetch: fetchDoctors };
}
