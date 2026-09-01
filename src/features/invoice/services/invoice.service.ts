import apiClient from "@/shared/services/api-client";
import {
  PatientBillingResponse,
  PatientVisitBillingResponse,
  QueryPatientBillingParams,
} from "../types/invoice.types";

export const invoiceService = {
  /**
   * Lấy danh sách hóa đơn viện phí tổng hợp của bệnh nhân theo các đợt khám
   */
  async getPatientBilling(
    patientId: string,
    params?: QueryPatientBillingParams
  ): Promise<PatientBillingResponse> {
    const response = await apiClient.get<PatientBillingResponse>(
      `/api/invoice/patient/${patientId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết hóa đơn, các chỉ định dịch vụ, hóa đơn và giao dịch của một đợt khám cụ thể
   */
  async getPatientVisitBilling(
    patientId: string,
    bookingId: string
  ): Promise<PatientVisitBillingResponse> {
    const response = await apiClient.get<PatientVisitBillingResponse>(
      `/api/invoice/patient/${patientId}/booking/${bookingId}`
    );
    return response.data;
  },
};
