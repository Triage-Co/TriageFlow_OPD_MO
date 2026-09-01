import apiClient from "@/shared/services/api-client";
import {
  PatientBillingResponse,
  PatientVisitBillingResponse,
  QueryPatientBillingParams,
} from "../types/invoice.types";

export const invoiceService = {
  
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
