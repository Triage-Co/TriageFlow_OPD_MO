import apiClient from "@/shared/services/api-client";
import { Specialty } from "../types/specialty.types";

class SpecialtyService {
  async getSpecialties(): Promise<Specialty[]> {
    const response = await apiClient.get("/api/specialty");
    return response.data?.data || [];
  }
}

export const specialtyService = new SpecialtyService();
