import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TranslatedSymptomSearchItem,
  DiagnosisSessionCache,
  RecommendSpecialistResponse,
} from "../types/triage.types";

const SESSION_KEY = "triage:diagnosis-session";
const RECOMMENDATION_KEY = "triage:recommendation-result";

class TriageCacheService {
  private getSymptomSearchKey(age: number, phrase: string): string {
    return `triage:symptom-search:${age}:${phrase.toLowerCase().trim()}`;
  }

  async getCachedSymptoms(age: number, phrase: string): Promise<TranslatedSymptomSearchItem[] | null> {
    try {
      const key = this.getSymptomSearchKey(age, phrase);
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Lỗi khi đọc cache triệu chứng:", error);
      return null;
    }
  }

  async setCachedSymptoms(
    age: number,
    phrase: string,
    symptoms: TranslatedSymptomSearchItem[]
  ): Promise<void> {
    try {
      const key = this.getSymptomSearchKey(age, phrase);
      await AsyncStorage.setItem(key, JSON.stringify(symptoms));
    } catch (error) {
      console.error("Lỗi khi lưu cache triệu chứng:", error);
    }
  }

  async getDiagnosisSession(): Promise<DiagnosisSessionCache | null> {
    try {
      const cached = await AsyncStorage.getItem(SESSION_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Lỗi khi đọc cache session:", error);
      return null;
    }
  }

  async saveDiagnosisSession(session: DiagnosisSessionCache): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Lỗi khi lưu cache session:", error);
    }
  }

  async clearDiagnosisSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Lỗi khi xóa cache session:", error);
    }
  }

  async saveRecommendationResult(result: RecommendSpecialistResponse): Promise<void> {
    try {
      await AsyncStorage.setItem(RECOMMENDATION_KEY, JSON.stringify(result));
    } catch (error) {
      console.error("Lỗi khi lưu cache đề xuất chuyên khoa:", error);
    }
  }

  async getRecommendationResult(): Promise<RecommendSpecialistResponse | null> {
    try {
      const cached = await AsyncStorage.getItem(RECOMMENDATION_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Lỗi khi đọc cache đề xuất chuyên khoa:", error);
      return null;
    }
  }

  async clearRecommendationResult(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECOMMENDATION_KEY);
    } catch (error) {
      console.error("Lỗi khi xóa cache đề xuất chuyên khoa:", error);
    }
  }
}

export const triageCacheService = new TriageCacheService();
