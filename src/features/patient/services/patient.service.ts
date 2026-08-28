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
    try {
      const response = await apiClient.get<PatientListResponse>("/api/patient/me", {
        skipGlobalToast: true,
      } as any);

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
      const msg = error?.response?.data?.message || error?.message || "";
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
   * POST /api/patient/me
   */
  async createPatient(data: CreatePatientRequest): Promise<CreatePatientResponse> {
    const response = await apiClient.post<CreatePatientResponse>("/api/patient/me", data);
    return response.data;
  },

  /**
   * Cập nhật thông tin bệnh nhân
   * PATCH /api/patient/me/{patient_id}
   */
  async updatePatient(patientId: string, data: UpdatePatientRequest): Promise<UpdatePatientResponse> {
    const response = await apiClient.patch<UpdatePatientResponse>(`/api/patient/me/${patientId}`, data);
    return response.data;
  },

  /**
   * Xóa bệnh nhân
   * DELETE /api/patient/me/{patient_id}
   */
  async deletePatient(patientId: string): Promise<DeletePatientResponse> {
    console.log(`\n================== [API DELETE PATIENT] ==================`);
    console.log(`[PatientService] Request: DELETE /api/patient/me/${patientId}`);
    try {
      const response = await apiClient.delete<DeletePatientResponse>(`/api/patient/me/${patientId}`);
      console.log(`[PatientService] Response status:`, response.status);
      console.log(`[PatientService] Response data:`, JSON.stringify(response.data, null, 2));
      console.log(`==========================================================\n`);
      return response.data;
    } catch (error: any) {
      console.error(`[PatientService] DELETE /api/patient/me/${patientId} ERROR:`, {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      console.log(`==========================================================\n`);
      throw error;
    }
  },
};
