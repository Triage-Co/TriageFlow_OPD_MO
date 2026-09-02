import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TranslatedSymptomSearchItem,
  DiagnosisSessionCache,
  RecommendSpecialistResponse,
} from "../types/triage.types";

const SESSION_KEY = "triage:diagnosis-session";
const RECOMMENDATION_KEY = "triage:recommendation-result";

class TriageCacheService {
  private translationCache = new Map<string, { en: string; vi: string }>();

  getTranslationCache(symptomId: string): { en: string; vi: string } | null {
    return this.translationCache.get(symptomId) || null;
  }

  setTranslationCache(symptomId: string, translation: { en: string; vi: string }): void {
    this.translationCache.set(symptomId, translation);
  }

  private getSearchCacheKey(regionId: string): string {
    return `v2:triage:search:${regionId.toLowerCase().trim()}`;
  }

  async getSearchCache(regionId: string): Promise<TranslatedSymptomSearchItem[] | null> {
    try {
      const key = this.getSearchCacheKey(regionId);
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`[Cache] Lỗi khi đọc search cache cho region ${regionId}:`, error);
      return null;
    }
  }

  async setSearchCache(regionId: string, symptoms: TranslatedSymptomSearchItem[]): Promise<void> {
    try {
      const key = this.getSearchCacheKey(regionId);
      await AsyncStorage.setItem(key, JSON.stringify(symptoms));
    } catch (error) {
      console.error(`[Cache] Lỗi khi lưu search cache cho region ${regionId}:`, error);
    }
  }

  private getSymptomSearchKey(age: number, phrase: string): string {
    return `v2:triage:symptom-search:${age}:${phrase.toLowerCase().trim()}`;
  }

  async getCachedSymptoms(age: number, phrase: string): Promise<TranslatedSymptomSearchItem[] | null> {
    try {
      const key = this.getSymptomSearchKey(age, phrase);
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;
      const parsed: TranslatedSymptomSearchItem[] = JSON.parse(cached);
      // Chỉ dùng cache nếu các triệu chứng đã có tiếng Việt
      const hasVietnamese = parsed.some((item) => item.labelVi && item.labelVi !== item.labelEn);
      return hasVietnamese ? parsed : null;
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
