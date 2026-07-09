import { useState, useCallback } from "react";
import { patientService } from "../services/patient.service";
import { Patient, CreatePatientRequest, UpdatePatientRequest } from "../types/patient.types";

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
        setPatients(response.data || []);
      } else {
        setError(response.message || "Không thể tải danh sách bệnh nhân.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (data: CreatePatientRequest): Promise<boolean> => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await patientService.createPatient(data);
      if (response.status === "success" || response.code === 200 || response.code === 201) {
        await fetchPatients();
        return true;
      }
      setError(response.message || "Không thể tạo bệnh nhân.");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo bệnh nhân.");
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [fetchPatients]);

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
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật thông tin.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchPatients]);

  const deletePatient = useCallback(async (patientId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await patientService.deletePatient(patientId);
      if (response.status === "success" || response.code === 200) {
        await fetchPatients();
        return true;
      }
      setError(response.message || "Không thể xóa bệnh nhân.");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa bệnh nhân.");
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
      setError(response.message || "Không thể lấy thông tin chi tiết bệnh nhân.");
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lấy thông tin chi tiết.");
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
    updatePatient,
    deletePatient,
    getPatientDetail,
  };
}
