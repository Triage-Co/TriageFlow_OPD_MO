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
    const response = await apiClient.get<SymptomSearchItem[]>("/api/infermedica/search", {
      params: {
        age: params.age,
        phrase: params.phrase,
      },
    });
    return response.data;
  }

  async diagnose(params: { request: DiagnosisRequest; interviewToken?: string }): Promise<DiagnosisResponse> {
    const url = params.interviewToken
      ? `/api/infermedica/diagnoise?interview_token=${encodeURIComponent(params.interviewToken)}`
      : "/api/infermedica/diagnoise";

    const response = await apiClient.post<DiagnosisResponse>(url, params.request);
    return response.data;
  }

  async recommendSpecialist(request: RecommendSpecialistRequest): Promise<RecommendSpecialistResponse> {
    const response = await apiClient.post<RecommendSpecialistResponse>(
      "/api/infermedica/recommend_specialist",
      request
    );
    return response.data;
  }
}

export const triageApiService = new TriageApiService();
