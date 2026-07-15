import apiClient from "@/shared/services/api-client";
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
  /**
   * Lấy danh sách bệnh nhân của tài khoản hiện tại
   * GET /api/patient/me
   */
  async getPatients(): Promise<PatientListResponse> {
    const response = await apiClient.get<PatientListResponse>("/api/patient/me");
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết một bệnh nhân
   * GET /api/patient/me/{patient_id}
   */
  async getPatientById(patientId: string): Promise<PatientDetailResponse> {
    const response = await apiClient.get<PatientDetailResponse>(`/api/patient/me/${patientId}`);
    return response.data;
  },

  /**
   * Tạo bệnh nhân mới
   * POST /api/patient
   */
  async createPatient(data: CreatePatientRequest): Promise<CreatePatientResponse> {
    const response = await apiClient.post<CreatePatientResponse>("/api/patient", data);
    return response.data;
  },

  /**
   * Cập nhật thông tin bệnh nhân
   * PATCH /api/patient/{patient_id}
   */
  async updatePatient(patientId: string, data: UpdatePatientRequest): Promise<UpdatePatientResponse> {
    const response = await apiClient.patch<UpdatePatientResponse>(`/api/patient/${patientId}`, data);
    return response.data;
  },

  /**
   * Xóa bệnh nhân
   * DELETE /api/patient/{patient_id}
   */
  async deletePatient(patientId: string): Promise<DeletePatientResponse> {
    const response = await apiClient.delete<DeletePatientResponse>(`/api/patient/${patientId}`);
    return response.data;
  },
};
