import type {
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  SymptomSearchItem,
  TranslatedSymptomSearchItem,
} from "../types/triage.types";
import { triageCacheService } from "./triage-cache.service";
import { googleTranslationService } from "./google-translation.service";

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
      const apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
      if (!apiKey) {
        // Fallback to Google Translation Service if DeepSeek key is not available
        return await googleTranslationService.translateEnToVi(normalizedText, symptomId);
      }

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "You are an expert medical translator. Translate the given medical term or phrase from English to natural, accurate Vietnamese suitable for a patient app. Return ONLY the translated text, with no markdown, quotes, or explanations.",
            },
            { role: "user", content: normalizedText },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const resData = await response.json();
      const translated = resData.choices?.[0]?.message?.content?.trim() || normalizedText;

      if (symptomId && translated) {
        triageCacheService.setTranslationCache(symptomId, { en: normalizedText, vi: translated });
      }

      return translated;
    } catch (error) {
      console.warn(`[TranslationService] DeepSeek failed for "${text}", fallback to Google Translate:`, error);
      return await googleTranslationService.translateEnToVi(normalizedText, symptomId);
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
      const apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
      if (!apiKey) {
        return await googleTranslationService.translateSymptomItems(items);
      }

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
        const systemPrompt = `You are an expert medical translator.
Translate the following medical symptom names from English to accurate, natural Vietnamese suitable for patient displays.
Return ONLY a raw JSON object (no markdown, no backticks, no extra text) matching this JSON structure:
{
  "translatedSymptoms": [
    { "id": "symptom_id", "labelVi": "Tên triệu chứng tiếng Việt" }
  ]
}`;

        const userPayload = {
          symptoms: uncachedItems.map((item) => ({ id: item.id, label: item.label })),
        };

        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(userPayload) },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          const content = resData.choices?.[0]?.message?.content;
          if (content) {
            const cleanedContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsedData = JSON.parse(cleanedContent);
            const translatedSymptoms = parsedData.translatedSymptoms || [];
            if (Array.isArray(translatedSymptoms)) {
              translatedSymptoms.forEach((it: { id: string; labelVi: string }) => {
                if (it.id && it.labelVi) {
                  cachedTranslations.set(it.id, it.labelVi);
                  const originalItem = uncachedItems.find((x) => x.id === it.id);
                  triageCacheService.setTranslationCache(it.id, {
                    en: originalItem?.label || "",
                    vi: it.labelVi,
                  });
                }
              });
            }
          }
        }
      }

      return items.map((item) => ({
        id: item.id,
        labelEn: item.label,
        labelVi: cachedTranslations.get(item.id) || item.label,
      }));
    } catch (error) {
      console.warn("[TranslationService] translateSymptomItems DeepSeek failed, fallback to Google Translate:", error);
      return await googleTranslationService.translateSymptomItems(items);
    }
  }

  async translateQuestion(
    question: DiagnosisQuestion | null
  ): Promise<DiagnosisQuestion | null> {
    if (!question) return null;

    // Helper kiểm tra xem chuỗi có phải là tiếng Việt có dấu không
    const isVietnamese = (str?: string | null): boolean => {
      if (!str) return false;
      const viRegex = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
      return viRegex.test(str);
    };

    // NẾU BACKEND ĐÃ DỊCH SẴN SANG TIẾNG VIỆT (ƯU TIÊN BE)
    if (isVietnamese(question.text) || isVietnamese(question.textVi)) {
      const translatedItemsList = (question.items || []).map((item) => {
        const translatedChoices = (item.choices || []).map((choice) => ({
          ...choice,
          labelVi:
            choice.labelVi ||
            STATIC_EN_VI_DICTIONARY[choice.label] ||
            STATIC_EN_VI_DICTIONARY[choice.id] ||
            choice.label,
        }));

        return {
          ...item,
          nameVi: item.nameVi || item.name,
          choices: translatedChoices,
        };
      });

      return {
        ...question,
        textVi: question.textVi || question.text,
        items: translatedItemsList,
      };
    }

    // NẾU BE TRẢ VỀ TIẾNG ANH THÌ DÙNG BỘ DỊCH FALLBACK DỰ PHÒNG
    try {
      const apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
      if (!apiKey) {
        return await googleTranslationService.translateQuestion(question);
      }

      const systemPrompt = `You are an expert medical translator for hospital triage systems.
Translate the following medical question and symptom names from English to accurate, natural Vietnamese suitable for patient displays.
Maintain exact IDs for items.
IMPORTANT: Return ONLY a raw JSON object (no markdown, no backticks, no extra text) matching this JSON structure:
{
  "translatedText": "Tiêu đề câu hỏi tiếng Việt",
  "translatedItems": [
    { "id": "item_id", "name": "Tên triệu chứng tiếng Việt" }
  ]
}`;

      const userPayload = {
        text: question.text || "",
        items: (question.items || []).map((it) => ({
          id: it.id,
          name: it.name,
        })),
      };

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const resData = await response.json();
      const content = resData.choices?.[0]?.message?.content;
      if (!content) return await googleTranslationService.translateQuestion(question);

      const cleanedContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanedContent);

      const { translatedText, translatedItems } = parsedData || {};

      const itemMap = new Map<string, string>();
      if (Array.isArray(translatedItems)) {
        translatedItems.forEach((it: { id: string; name: string }) => {
          if (it.id && it.name) {
            itemMap.set(it.id, it.name);
          }
        });
      }

      const translatedItemsList = question.items.map((item) => {
        const nameVi = itemMap.get(item.id) || item.name;
        const translatedChoices = item.choices.map((choice) => ({
          ...choice,
          labelVi: STATIC_EN_VI_DICTIONARY[choice.label] || STATIC_EN_VI_DICTIONARY[choice.id] || choice.label,
        }));

        return {
          ...item,
          nameVi,
          choices: translatedChoices,
        };
      });

      return {
        ...question,
        textVi: translatedText || question.text,
        items: translatedItemsList,
      };
    } catch (error) {
      console.warn("[TranslationService] translateQuestion DeepSeek failed, fallback to Google Translate:", error);
      return await googleTranslationService.translateQuestion(question);
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

export const translationService = new TranslationService();
