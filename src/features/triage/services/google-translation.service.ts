import type {
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  SymptomSearchItem,
  TranslatedSymptomSearchItem,
} from "../types/triage.types";
import { triageCacheService } from "./triage-cache.service";

export const STATIC_EN_VI_DICTIONARY: Record<string, string> = {
  Yes: "Có",
  No: "Không",
  "Don't know": "Không biết",
  present: "Có",
  absent: "Không",
  unknown: "Không biết",
  personal_visit: "Khám trực tiếp",
};

/**
 * Dịch thuật miễn phí qua Google Translate Free Endpoint (Không cần API Key)
 */
export async function fetchGoogleTranslate(text: string, from = "en", to = "vi"): Promise<string> {
  if (!text || !text.trim()) return "";
  const trimmed = text.trim();

  if (STATIC_EN_VI_DICTIONARY[trimmed]) {
    return STATIC_EN_VI_DICTIONARY[trimmed];
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Translate status ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item?.[0] || "").join("").trim();
      return translated || trimmed;
    }
    return trimmed;
  } catch (err) {
    console.warn("[Google Translate Fallback Error]:", err);
    return trimmed;
  }
}

export class GoogleTranslationService {
  async translateEnToVi(text?: string | null, symptomId?: string): Promise<string> {
    if (!text) return "";

    const normalizedText = text.trim();
    if (!normalizedText) return "";

    if (symptomId) {
      const cached = triageCacheService.getTranslationCache(symptomId);
      if (cached && cached.vi) {
        return cached.vi;
      }
    }

    let staticTranslated = STATIC_EN_VI_DICTIONARY[normalizedText];
    if (staticTranslated) return staticTranslated;

    const lowerNormalized = normalizedText.toLowerCase();
    for (const key of Object.keys(STATIC_EN_VI_DICTIONARY)) {
      if (key.toLowerCase() === lowerNormalized) {
        return STATIC_EN_VI_DICTIONARY[key];
      }
    }

    try {
      const translated = await fetchGoogleTranslate(normalizedText);

      if (symptomId && translated) {
        triageCacheService.setTranslationCache(symptomId, { en: normalizedText, vi: translated });
      }

      return translated || normalizedText;
    } catch (error) {
      console.warn(`[GoogleTranslationService] Translate failed for "${text}", fallback to original:`, error);
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
    if (!Array.isArray(items) || items.length === 0) return [];

    try {
      const uncachedItems: SymptomSearchItem[] = [];
      const cachedTranslations = new Map<string, string>();

      items.forEach((item) => {
        const cached = triageCacheService.getTranslationCache(item.id);
        if (cached && cached.vi) {
          cachedTranslations.set(item.id, cached.vi);
        } else {
          uncachedItems.push(item);
        }
      });

      if (uncachedItems.length > 0) {
        await Promise.all(
          uncachedItems.map(async (item) => {
            const translated = await fetchGoogleTranslate(item.label);
            if (translated) {
              cachedTranslations.set(item.id, translated);
              triageCacheService.setTranslationCache(item.id, {
                en: item.label,
                vi: translated,
              });
            }
          })
        );
      }

      return items.map((item) => ({
        id: item.id,
        labelEn: item.label,
        labelVi: cachedTranslations.get(item.id) || item.label,
      }));
    } catch (error) {
      console.warn("[GoogleTranslationService] translateSymptomItems failed:", error);
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
      // Dịch tiêu đề câu hỏi
      const translatedText = await fetchGoogleTranslate(question.text || "");

      // Dịch các lựa chọn và item
      const translatedItemsList = await Promise.all(
        (question.items || []).map(async (item) => {
          const nameVi = await fetchGoogleTranslate(item.name || "");
          const translatedChoices = (item.choices || []).map((choice) => ({
            ...choice,
            labelVi: STATIC_EN_VI_DICTIONARY[choice.label] || STATIC_EN_VI_DICTIONARY[choice.id] || choice.label,
          }));

          return {
            ...item,
            nameVi: nameVi || item.name,
            choices: translatedChoices,
          };
        })
      );

      return {
        ...question,
        textVi: translatedText || question.text,
        items: translatedItemsList,
      };
    } catch (error) {
      console.warn("[GoogleTranslationService] translateQuestion failed:", error);
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
        return {
          ...result,
          recommended_specialist: {
            id: "general_practice",
            name: "General Practice",
            nameVi: "Khoa Nội tổng quát",
          },
          recommended_channel: channel || "personal_visit",
          recommended_channel_vi: "Khám trực tiếp",
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
          nameVi: specialist?.nameVi || "Khoa Nội tổng quát",
        },
        recommended_channel_vi: result?.recommended_channel_vi || "Khám trực tiếp",
      };
    }
  }
}

export const googleTranslationService = new GoogleTranslationService();
