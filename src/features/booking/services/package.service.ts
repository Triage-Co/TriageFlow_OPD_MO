import apiClient from "@/shared/services/api-client";
import {
  ExamPackage,
  ExamPackageDetail,
  RoomSlot,
  BookingWithPackageResponse,
} from "../types/package.types";

class PackageService {
  async getAllPackages(): Promise<ExamPackage[]> {
    const response = await apiClient.get<ExamPackage[]>("/api/exam-package");
    return response.data;
  }

  async getPackageDetail(id: string): Promise<ExamPackageDetail> {
    const response = await apiClient.get<ExamPackageDetail>(
      `/api/exam-package/${encodeURIComponent(id)}`
    );
    return response.data;
  }

  async getRoomSlots(date: string): Promise<RoomSlot[]> {
    const roomId = "d6b5891e-3d1c-44f1-9636-aaeb66fae2d5";
    const response = await apiClient.get<RoomSlot[]>(
      `/api/room/${encodeURIComponent(roomId)}/slots`,
      {
        params: { date },
      }
    );
    return response.data;
  }

  async createBookingWithPackage(
    patientId: string,
    slotId: string,
    packageId: string
  ): Promise<any> {
    const response = await apiClient.post<any>(
      "/api/booking/with-package",
      {
        patient_id: patientId,
        slot_id: slotId,
        package_id: packageId,
        return_url: "https://triageflow.me/payment/success",
        cancel_url: "https://triageflow.me/payment/cancel",
      }
    );
    return response.data;
  }
}

export const packageService = new PackageService();
