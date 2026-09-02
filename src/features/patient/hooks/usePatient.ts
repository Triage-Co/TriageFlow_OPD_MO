import { useState, useCallback } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { patientService } from "../services/patient.service";
import { Patient, CreatePatientRequest, UpdatePatientRequest } from "../types/patient.types";
import type { EkycOcrObject } from "@/features/ekyc/types/ekyc.types";
import { Gender } from "@/features/auth/types/auth.types";

export function usePatient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await patientService.getPatients();
      if (response.status === "success" || response.code === 200) {
        setPatients(Array.isArray(response.data) ? response.data : []);
      } else {
        const msg = response.message || "";
        if (msg.toLowerCase().includes("rỗng") || msg.toLowerCase().includes("empty")) {
          setPatients([]);
        } else {
          setError(msg || "Không thể tải danh sách bệnh nhân.");
        }
      }
    } catch (err: any) {
      const msg = getErrorMessage(err, "");
      if (msg.toLowerCase().includes("rỗng") || msg.toLowerCase().includes("empty")) {
        setPatients([]);
      } else {
        setError(msg || "Đã xảy ra lỗi khi tải danh sách.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (data: CreatePatientRequest): Promise<{ success: boolean; message?: string }> => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await patientService.createPatient(data);
      if (response.status === "success" || response.code === 200 || response.code === 201) {
        await fetchPatients();
        return { success: true };
      }
      const errMsg = response.message || "Không thể tạo bệnh nhân.";
      setError(errMsg);
      return { success: false, message: errMsg };
    } catch (err) {
      const errMsg = getErrorMessage(err, "Đã xảy ra lỗi khi tạo bệnh nhân.");
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setIsCreating(false);
    }
  }, [fetchPatients]);

  const createPatientFromEkyc = useCallback(
    async (ocrData: EkycOcrObject): Promise<{ success: boolean; message?: string }> => {
      
      const parts = ocrData.birth_day.split("/");
      const dob =
        parts.length === 3
          ? `${parts[2]}-${parts[1]}-${parts[0]}`
          : ocrData.birth_day;

      const gender: Gender = ocrData.gender.trim().toLowerCase() === "nam" ? "MALE" : "FEMALE";

      const randomMedicalCoverageId = `DN479${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      return createPatient({
        full_name: ocrData.name,
        dob,
        gender,
        citizen_id: ocrData.id,
        medical_coverage_id: randomMedicalCoverageId,
      });
    },
    [createPatient]
  );

  const updatePatient = useCallback(async (patientId: string, data: UpdatePatientRequest): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await patientService.updatePatient(patientId, data);
      if (response.status === "success" || response.code === 200) {
        await fetchPatients();
        return true;
      }
      setError(response.message || "Không thể cập nhật thông tin.");
      return false;
    } catch (err) {
      setError(getErrorMessage(err, "Đã xảy ra lỗi khi cập nhật thông tin."));
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchPatients]);

  const deletePatient = useCallback(async (patientId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    try {
      console.log(`[usePatient] Starting deletePatient for ID: ${patientId}`);
      const response = await patientService.deletePatient(patientId);
      console.log(`[usePatient] deletePatient completed with status:`, response?.status || response?.code);
      if (response.status === "success" || response.code === 200) {
        await fetchPatients();
        return true;
      }
      setError(response.message || "Không thể xóa bệnh nhân.");
      return false;
    } catch (err: any) {
      console.error(`[usePatient] deletePatient catch block:`, err?.response?.data || err?.message || err);
      setError(getErrorMessage(err, "Đã xảy ra lỗi khi xóa bệnh nhân."));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [fetchPatients]);

  const getPatientDetail = useCallback(async (patientId: string): Promise<Patient | null> => {
    setError(null);
    try {
      const response = await patientService.getPatientById(patientId);
      if (response.status === "success" || response.code === 200) {
        return response.data;
      }
      setError(response.message || "Không thể tải thông tin bệnh nhân.");
      return null;
    } catch (err) {
      setError(getErrorMessage(err, "Đã xảy ra lỗi khi tải thông tin bệnh nhân."));
      return null;
    }
  }, []);

  return {
    patients,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    clearError,
    fetchPatients,
    createPatient,
    createPatientFromEkyc,
    updatePatient,
    deletePatient,
    getPatientDetail,
  };
}
