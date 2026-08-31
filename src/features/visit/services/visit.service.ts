import apiClient from "@/shared/services/api-client";

class VisitService {
  /**
   * Lấy flow đang chạy hoặc hoạt động của bệnh nhân trong ngày
   */
  async getActiveFlow(patientId: string, date?: string): Promise<any> {
    const response = await apiClient.get(`/api/flow/patient/${patientId}/active`, {
      params: { date },
    });
    return response.data;
  }

  /**
   * Lấy lịch sử tất cả các flow khám của bệnh nhân
   */
  async getPatientFlows(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/flow/patient/${patientId}`);
    return response.data;
  }

  /**
   * Lấy danh sách ca khám (visit sessions)
   */
  async getVisitSessions(patientId: string): Promise<any[]> {
    const response = await apiClient.get(`/api/visit-session/patient/${patientId}`);
    return response.data;
  }

  /**
   * Lấy các bước khám cần thanh toán phí (consultation step payment)
   */
  async getPendingPaymentSteps(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/step?patient_id=${encodeURIComponent(patientId)}`);
    return response.data;
  }

  /**
   * Lấy danh sách dịch vụ chỉ định chưa thanh toán (blood tests, x-rays, v.v.)
   */
  async getPendingServiceOrders(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/service-order/pending/${encodeURIComponent(patientId)}`);
    return response.data;
  }

  /**
   * Xác nhận thanh toán & tạo số thứ tự (STT) khám
   */
  async getBookingGenerate(stepId: string): Promise<any> {
    const response = await apiClient.get(`/api/booking/generate`, {
      params: { "step-id": stepId },
    });
    return response.data;
  }

  /**
   * Lấy đơn thuốc theo ID phiên khám
   */
  async getPrescriptionByVisitSession(visitSessionId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/prescription/visit-session/${encodeURIComponent(visitSessionId)}`);
      return response.data;
    } catch {
      // Khi phiên khám không có đơn thuốc hoặc chưa kê thuốc, trả về null êm đẹp
      return null;
    }
  }
}

export const visitService = new VisitService();
