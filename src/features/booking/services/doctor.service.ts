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
    const response = await apiClient.get(`/api/doctor/specialty/clinical`, {
      params: { specialty_code: specialtyCode, date_time: dateTime },
      skipGlobalToast: true,
    });
    return response.data?.data || response.data || [];
  }

  async getDoctorSlots(doctorId: string, date: string): Promise<DoctorDetail> {
    const response = await apiClient.get(`/api/doctor/${doctorId}/slot`, {
      params: { date },
      skipGlobalToast: true,
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

  async getStepDetail(stepId: string, config?: any): Promise<StepDetailResponse> {
    const response = await apiClient.get<StepDetailResponse>(`/api/step/${stepId}/me`, config);
    return response.data;
  }
}

export const doctorService = new DoctorService();
