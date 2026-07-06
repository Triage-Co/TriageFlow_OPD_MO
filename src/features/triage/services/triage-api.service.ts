import apiClient from "@/shared/services/api-client";
import {
  SymptomSearchItem,
  DiagnosisRequest,
  DiagnosisResponse,
  RecommendSpecialistRequest,
  RecommendSpecialistResponse,
} from "../types/triage.types";

class TriageApiService {
  async searchSymptoms(params: { age: number; phrase: string }): Promise<SymptomSearchItem[]> {
    const response = await apiClient.get<any>("/api/infermedica/search", {
      params: {
        age: params.age,
        phrase: params.phrase,
      },
    });
    return response.data?.data || response.data || [];
  }

  async diagnose(params: {
    request: DiagnosisRequest;
    citizenId: string;
    interviewToken?: string;
  }): Promise<DiagnosisResponse> {
    const queryParams = new URLSearchParams({ citizen_id: params.citizenId });
    if (params.interviewToken) {
      queryParams.set("interview_token", params.interviewToken);
    }
    const url = `/api/infermedica/diagnoise?${queryParams.toString()}`;

    const response = await apiClient.post<any>(url, params.request);
    return response.data?.data || response.data;
  }

  async recommendSpecialist(params: {
    request: RecommendSpecialistRequest;
    interviewToken: string;
  }): Promise<RecommendSpecialistResponse> {
    const url = `/api/infermedica/recommend_specialist?interview_token=${params.interviewToken}`;
    const response = await apiClient.post<any>(url, params.request);
    return response.data?.data || response.data;
  }
}

export const triageApiService = new TriageApiService();
