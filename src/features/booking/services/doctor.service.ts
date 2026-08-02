import apiClient from "@/shared/services/api-client";
import {
  Doctor,
  DoctorDetail,
  BookingResponse,
  BookingGenerateResponse,
  StepDetailResponse,
} from "../types/doctor.types";

class DoctorService {
  async getDoctorsBySpecialty(specialtyCode: string, dateTime: string): Promise<Doctor[]> {
    const response = await apiClient.get(`/api/doctor/specialty`, {
      params: { specialty_code: specialtyCode, date_time: dateTime },
    });
    return response.data?.data || response.data || [];
  }

  async getDoctorSlots(doctorId: string, date: string): Promise<DoctorDetail> {
    const response = await apiClient.get(`/api/doctor/${doctorId}/slot`, {
      params: { date },
    });
    return response.data?.data || response.data;
  }

  async createBooking(patientId: string, slotId: string): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(`/api/booking`, {
      patient_id: patientId,
      slot_id: slotId,
    });
    return response.data;
  }

  async getBookingGenerate(stepId: string): Promise<BookingGenerateResponse> {
    const response = await apiClient.get<BookingGenerateResponse>(`/api/booking/generate`, {
      params: { "step-id": stepId },
    });
    return response.data;
  }

  async createAutoBooking(patientId: string, interviewToken: string): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(`/api/booking/recommend`, {
      patient_id: patientId,
      interview_token: interviewToken,
    });
    return response.data;
  }

  async getStepDetail(stepId: string): Promise<StepDetailResponse> {
    const response = await apiClient.get<StepDetailResponse>(`/api/step/${stepId}/me`);
    return response.data;
  }

  async getActiveFlow(patientId: string): Promise<any> {
    const response = await apiClient.get(`/api/flow/patient/${patientId}/active`);
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
}

export const doctorService = new DoctorService();

