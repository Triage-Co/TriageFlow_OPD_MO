import type {
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  SymptomSearchItem,
  TranslatedSymptomSearchItem,
} from "../types/triage.types";
import { ITranslationProvider } from "./translation.provider";
import { GoogleTranslateProvider } from "./google-translate.provider";
import { triageCacheService } from "./triage-cache.service";

const STATIC_EN_VI_DICTIONARY: Record<string, string> = {
  Yes: "Có",
  No: "Không",
  "Don't know": "Không biết",
  present: "Có",
  absent: "Không",
  unknown: "Không biết",
  personal_visit: "Khám trực tiếp",
};

class TranslationService {
  private provider: ITranslationProvider;

  constructor(provider: ITranslationProvider = new GoogleTranslateProvider()) {
    this.provider = provider;
  }

  setProvider(provider: ITranslationProvider) {
    this.provider = provider;
  }

  async translateEnToVi(text?: string | null, symptomId?: string): Promise<string> {
    if (!text) return "";

    const normalizedText = text.trim();
    if (!normalizedText) return "";

    // 1. Kiểm tra Translation Cache trước nếu có symptomId
    if (symptomId) {
      const cached = triageCacheService.getTranslationCache(symptomId);
      if (cached && cached.vi) {
        return cached.vi;
      }
    }

    // 2. Tìm kiếm trong từ điển tĩnh (case-sensitive)
    let staticTranslated = STATIC_EN_VI_DICTIONARY[normalizedText];
    if (staticTranslated) return staticTranslated;

    // Tìm kiếm trong từ điển tĩnh (case-insensitive fallback)
    const lowerNormalized = normalizedText.toLowerCase();
    for (const key of Object.keys(STATIC_EN_VI_DICTIONARY)) {
      if (key.toLowerCase() === lowerNormalized) {
        return STATIC_EN_VI_DICTIONARY[key];
      }
    }

    // 3. Gọi provider thực tế để dịch
    try {
      const translated = await this.provider.translate(normalizedText, "en", "vi");
      
      // Cache lại nếu có symptomId
      if (symptomId && translated) {
        triageCacheService.setTranslationCache(symptomId, { en: normalizedText, vi: translated });
      }
      
      return translated || normalizedText;
    } catch (error) {
      console.warn(`[TranslationService] Translate failed for "${text}", fallback to original:`, error);
      return normalizedText;
    }
  }

  async translateManyEnToVi(texts: string[], symptomIds?: string[]): Promise<string[]> {
    try {
      const results = await Promise.all(
        texts.map((text, index) => this.translateEnToVi(text, symptomIds?.[index]))
      );
      return results;
    } catch (error) {
      console.warn("Translate many failed, fallback to original texts:", error);
      return texts;
    }
  }

  async translateSymptomItems(
    items: SymptomSearchItem[]
  ): Promise<TranslatedSymptomSearchItem[]> {
    if (!Array.isArray(items)) return [];

    try {
      const labelsEn = items.map((item) => item.label);
      const symptomIds = items.map((item) => item.id);
      const labelsVi = await this.translateManyEnToVi(labelsEn, symptomIds);

      return items.map((item, index) => ({
        id: item.id,
        labelEn: item.label,
        labelVi: labelsVi[index] || item.label,
      }));
    } catch (error) {
      console.warn("Translate symptom items failed:", error);

      return items.map((item) => ({
        id: item.id,
        labelEn: item.label,
        labelVi: item.label,
      }));
    }
  }

  async translateQuestion(
    question: DiagnosisQuestion | null
  ): Promise<DiagnosisQuestion | null> {
    if (!question) return null;

    try {
      const textVi = await this.translateEnToVi(question.text);

      const translatedItems = await Promise.all(
        question.items.map(async (item) => {
          const nameVi = await this.translateEnToVi(item.name, item.id);

          const translatedChoices = await Promise.all(
            item.choices.map(async (choice) => ({
              ...choice,
              labelVi: await this.translateEnToVi(choice.label || choice.id),
            }))
          );

          return {
            ...item,
            nameVi,
            choices: translatedChoices,
          };
        })
      );

      return {
        ...question,
        textVi,
        items: translatedItems,
      };
    } catch (error) {
      console.warn("Translate question failed:", error);
      return question;
    }
  }

  async translateRecommendation(
    result: RecommendSpecialistResponse
  ): Promise<RecommendSpecialistResponse> {
    try {
      const specialist = result?.recommended_specialist || (result as any)?.recommendedSpecialist;
      const channel = result?.recommended_channel || (result as any)?.recommendedChannel || "";

      if (!specialist) {
        console.warn("[Translation] recommended_specialist is missing in API response:", result);
        return {
          ...result,
          recommended_specialist: {
            id: "general_practice",
            name: "General Practice",
            nameVi: "Khoa Nội tổng quát"
          },
          recommended_channel: channel || "personal_visit",
          recommended_channel_vi: "Khám trực tiếp"
        };
      }

      const specialistNameVi = await this.translateEnToVi(
        specialist.name,
        specialist.id
      );

      const channelVi = await this.translateEnToVi(channel);

      return {
        ...result,
        recommended_specialist: {
          ...specialist,
          nameVi: specialistNameVi || specialist.name,
        },
        recommended_channel_vi: channelVi || channel,
      };
    } catch (error) {
      console.warn("Translate recommendation failed, applying default fallback:", error);
      const specialist = result?.recommended_specialist || (result as any)?.recommendedSpecialist;
      return {
        ...result,
        recommended_specialist: {
          id: specialist?.id || "general_practice",
          name: specialist?.name || "General Practice",
          nameVi: specialist?.nameVi || "Khoa Nội tổng quát"
        },
        recommended_channel_vi: result?.recommended_channel_vi || "Khám trực tiếp"
      };
    }
  }
}

export const translationService = new TranslationService();
