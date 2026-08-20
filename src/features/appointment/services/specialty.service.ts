import apiClient from "@/shared/services/api-client";
import { Specialty } from "../types/specialty.types";

class SpecialtyService {
  async getSpecialties(params?: { page?: number; limit?: number }): Promise<Specialty[]> {
    const response = await apiClient.get<any>("/api/specialty", {
      params: { page: 1, limit: 100, ...params },
    });
    const rawData = response.data;
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.data)) return rawData.data;
    if (Array.isArray(rawData?.data?.data)) return rawData.data.data;
    return [];
  }
}

export const specialtyService = new SpecialtyService();

