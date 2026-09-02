import type {
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  SymptomSearchItem,
  TranslatedSymptomSearchItem,
} from "../types/triage.types";
import { googleTranslationService } from "./google-translation.service";

class TranslationService {
  async translateEnToVi(text?: string | null, symptomId?: string): Promise<string> {
    return googleTranslationService.translateEnToVi(text, symptomId);
  }

  async translateManyEnToVi(texts: string[], symptomIds?: string[]): Promise<string[]> {
    return googleTranslationService.translateManyEnToVi(texts, symptomIds);
  }

  async translateSymptomItems(
    items: SymptomSearchItem[]
  ): Promise<TranslatedSymptomSearchItem[]> {
    return googleTranslationService.translateSymptomItems(items);
  }

  async translateQuestion(
    question: DiagnosisQuestion | null
  ): Promise<DiagnosisQuestion | null> {
    return googleTranslationService.translateQuestion(question);
  }

  async translateRecommendation(
    result: RecommendSpecialistResponse
  ): Promise<RecommendSpecialistResponse> {
    return googleTranslationService.translateRecommendation(result);
  }
}

export const translationService = new TranslationService();
