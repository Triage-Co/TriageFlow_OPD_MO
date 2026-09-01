import apiClient from "@/shared/services/api-client";

class VisitService {
  
  async getActiveFlow(patientId: string, date?: string): Promise<any> {
    const response = await apiClient.get(`/api/flow/patient/${patientId}/active`, {
      params: { date },
    });
    return response.data;
  }

  async getPatientFlows(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/flow/patient/${patientId}`);
    return response.data;
  }

  async getVisitSessions(patientId: string): Promise<any[]> {
    const response = await apiClient.get(`/api/visit-session/patient/${patientId}`);
    return response.data;
  }

  async getPendingPaymentSteps(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/step?patient_id=${encodeURIComponent(patientId)}`);
    return response.data;
  }

  async getPendingServiceOrders(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/service-order/pending/${encodeURIComponent(patientId)}`);
    return response.data;
  }

  async getBookingGenerate(stepId: string): Promise<any> {
    const response = await apiClient.get(`/api/booking/generate`, {
      params: { "step-id": stepId },
    });
    return response.data;
  }

  async getPrescriptionByVisitSession(visitSessionId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        `/api/prescription/visit-session/${encodeURIComponent(visitSessionId)}`,
        {
          skipGlobalToast: true,
        } as any
      );
      return response.data;
    } catch {
      
      return null;
    }
  }
}

export const visitService = new VisitService();
