import type {
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  SymptomSearchItem,
  TranslatedSymptomSearchItem,
} from "../types/triage.types";

const STATIC_EN_VI_DICTIONARY: Record<string, string> = {
  Yes: "Có",
  No: "Không",
  "Don't know": "Không biết",
  present: "Có",
  absent: "Không",
  unknown: "Không biết",
  personal_visit: "Khám trực tiếp",

  // Một số symptom/body phổ biến để test flow trước
  "head pain": "Đau đầu",
  "neck pain": "Đau cổ",
  "chest pain": "Đau ngực",
  "abdominal pain": "Đau bụng",
  "left shoulder": "Đau vai trái",
  "right shoulder": "Đau vai phải",
  "left arm": "Đau tay trái",
  "right arm": "Đau tay phải",
  "left hand": "Đau bàn tay trái",
  "right hand": "Đau bàn tay phải",
  "left leg": "Đau chân trái",
  "right leg": "Đau chân phải",
  "left knee": "Đau đầu gối trái",
  "right knee": "Đau đầu gối phải",
  "left foot": "Đau bàn chân trái",
  "right foot": "Đau bàn chân phải",
  "upper back pain": "Đau lưng trên",
  "lower back pain": "Đau thắt lưng",
  "back pain": "Đau lưng",

  "hand rash": "Phát ban ở tay",
  "hand hurt": "Đau tay",
  "hands shake": "Run tay",
  "hands hurt": "Đau hai tay",
  "hand cramps": "Chuột rút bàn tay",
  "hand feels stiff": "Cứng bàn tay",
  "cold hands": "Tay lạnh",
  headache: "Đau đầu",
};

class TranslationService {
  async translateEnToVi(text?: string | null): Promise<string> {
    if (!text) return "";

    const normalizedText = text.trim();
    if (!normalizedText) return "";

    // Tìm kiếm trong từ điển tĩnh (case-sensitive)
    let staticTranslated = STATIC_EN_VI_DICTIONARY[normalizedText];
    if (staticTranslated) return staticTranslated;

    // Tìm kiếm trong từ điển tĩnh (case-insensitive fallback)
    const lowerNormalized = normalizedText.toLowerCase();
    for (const key of Object.keys(STATIC_EN_VI_DICTIONARY)) {
      if (key.toLowerCase() === lowerNormalized) {
        return STATIC_EN_VI_DICTIONARY[key];
      }
    }

    try {
      // TODO: Sau này gắn package/API dịch thật ở đây.
      // Hiện tại fallback để flow không crash.
      return normalizedText;
    } catch (error) {
      console.warn("Translate failed, fallback to original text:", error);
      return normalizedText;
    }
  }

  async translateManyEnToVi(texts: string[]): Promise<string[]> {
    try {
      const results = await Promise.all(
        texts.map((text) => this.translateEnToVi(text))
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
      const labelsVi = await this.translateManyEnToVi(labelsEn);

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
          const nameVi = await this.translateEnToVi(item.name);

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
      const specialistNameVi = await this.translateEnToVi(
        result.recommended_specialist.name
      );

      const channelVi = await this.translateEnToVi(result.recommended_channel);

      return {
        ...result,
        recommended_specialist: {
          ...result.recommended_specialist,
          nameVi: specialistNameVi,
        },
        recommended_channel_vi: channelVi,
      };
    } catch (error) {
      console.warn("Translate recommendation failed:", error);
      return result;
    }
  }
}

export const translationService = new TranslationService();
