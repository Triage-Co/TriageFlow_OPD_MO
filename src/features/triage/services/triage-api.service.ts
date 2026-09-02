import apiClient from "@/shared/services/api-client";
import {
  SymptomSearchItem,
  ParseMentionItem,
  DiagnosisRequest,
  DiagnosisResponse,
  RecommendSpecialistRequest,
  RecommendSpecialistResponse,
  PatientSex,
} from "../types/triage.types";

class TriageApiService {
  async parseSymptoms(params: {
    text: string;
    age?: number;
    sex?: PatientSex;
  }): Promise<ParseMentionItem[]> {
    const payload: Record<string, any> = {
      question: params.text,
      age: typeof params.age === "number" ? params.age : 30,
    };

    if (params.sex) {
      payload.sex = params.sex;
    }

    const response = await apiClient.post<any>("/api/infermedica/parse", payload);
    const mentions =
      response.data?.data?.mentions ||
      response.data?.mentions ||
      response.data?.data ||
      response.data ||
      [];
    return Array.isArray(mentions) ? mentions : [];
  }

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

    console.log(`[TriageApiService] POST URL: ${url}`);
    console.log(`[TriageApiService] Payload:`, JSON.stringify(params.request, null, 2));

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
