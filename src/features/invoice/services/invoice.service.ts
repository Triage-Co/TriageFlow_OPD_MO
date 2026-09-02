import apiClient from "@/shared/services/api-client";
import {
  PatientBillingResponse,
  PatientVisitBillingResponse,
  QueryPatientBillingParams,
} from "../types/invoice.types";

export const invoiceService = {
  
  async getPatientBilling(
    patientId: string,
    params?: QueryPatientBillingParams,
    config?: any
  ): Promise<PatientBillingResponse> {
    const response = await apiClient.get<PatientBillingResponse>(
      `/api/invoice/patient/${patientId}`,
      { params, skipGlobalToast: true, ...config }
    );
    return response.data;
  },

  async getPatientVisitBilling(
    patientId: string,
    bookingId: string,
    config?: any
  ): Promise<PatientVisitBillingResponse> {
    const response = await apiClient.get<PatientVisitBillingResponse>(
      `/api/invoice/patient/${patientId}/booking/${bookingId}`,
      { skipGlobalToast: true, ...config }
    );
    return response.data;
  },
};
