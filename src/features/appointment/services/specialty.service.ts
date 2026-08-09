import apiClient from "@/shared/services/api-client";
import { Specialty, SpecialtyListResponse } from "../types/specialty.types";

class SpecialtyService {
  async getSpecialties(params?: { page?: number; limit?: number }): Promise<Specialty[]> {
    const response = await apiClient.get<SpecialtyListResponse>("/api/specialty", { params });
    return response.data?.data?.data || [];
  }
}

export const specialtyService = new SpecialtyService();
