import apiClient from "@/shared/services/api-client";
import { getErrorMessage } from "@/shared/utils/error.utils";
import {
  CreatePatientRequest,
  CreatePatientResponse,
  PatientDetailResponse,
  PatientListResponse,
  UpdatePatientRequest,
  UpdatePatientResponse,
  DeletePatientResponse,
} from "../types/patient.types";

export const patientService = {
  
  async getPatients(): Promise<PatientListResponse> {
    try {
      const response = await apiClient.get<PatientListResponse>("/api/patient/me", {
        skipGlobalToast: true,
      });

      if (response.data && Array.isArray(response.data.data)) {
        return response.data;
      }
      return {
        code: 200,
        status: "success",
        message: response.data?.message || "Thành công",
        data: [],
      };
    } catch (error: any) {
      const msg = getErrorMessage(error, "");
      if (
        error?.response?.status === 404 ||
        error?.response?.status === 400 ||
        msg.toLowerCase().includes("rỗng") ||
        msg.toLowerCase().includes("empty") ||
        msg.toLowerCase().includes("không tìm thấy")
      ) {
        return {
          code: 200,
          status: "success",
          message: "Danh sách rỗng",
          data: [],
        };
      }
      throw error;
    }
  },

  async getPatientById(patientId: string): Promise<PatientDetailResponse> {
    const response = await apiClient.get<PatientDetailResponse>(`/api/patient/me/${patientId}`);
    return response.data;
  },

  async createPatient(data: CreatePatientRequest): Promise<CreatePatientResponse> {
    const response = await apiClient.post<CreatePatientResponse>("/api/patient/me", data);
    return response.data;
  },

  async updatePatient(patientId: string, data: UpdatePatientRequest): Promise<UpdatePatientResponse> {
    const response = await apiClient.patch<UpdatePatientResponse>(`/api/patient/me/${patientId}`, data);
    return response.data;
  },

  async deletePatient(patientId: string): Promise<DeletePatientResponse> {
    const response = await apiClient.delete<DeletePatientResponse>(`/api/patient/me/${patientId}`);
    return response.data;
  },
};
