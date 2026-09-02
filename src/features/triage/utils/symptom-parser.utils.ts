import { fetchGoogleTranslate } from "../services/google-translation.service";

/**
 * Bảng ánh xạ các mẫu triệu chứng tiếng Việt thông dụng sang tiếng Anh y khoa
 * (Kế thừa từ bộ từ điển chuẩn của Lễ tân / Reception)
 */
const VI_TO_ENGLISH_SYMPTOM: Array<{ pattern: RegExp; english: string }> = [
  { pattern: /đau\s*mắt|dau\s*mat|nhức\s*mắt|nhuc\s*mat|mỏi\s*mắt|moi\s*mat|mắt\s*đau|mat\s*dau/i, english: "eye pain" },
  { pattern: /đau\s*tay|dau\s*tay|đau\s*bàn\s*tay|dau\s*ban\s*tay/i, english: "pain in hand" },
  { pattern: /đau\s*chân|dau\s*chan|đau\s*bàn\s*chân|dau\s*ban\s*chan/i, english: "foot pain" },
  { pattern: /đau\s*đầu|dau\s*dau|nhức\s*đầu|nhuc\s*dau/i, english: "headache" },
  { pattern: /sốt|sot|bị\s*sốt|bi\s*sot/i, english: "fever" },
  { pattern: /\bho\b|ho\s*khan|ho\s*đờm|ho\s*dom/i, english: "cough" },
  { pattern: /đau\s*bụng|dau\s*bung|đau\s*dạ\s*dày|dau\s*da\s*day/i, english: "abdominal pain" },
  { pattern: /đau\s*ngực|dau\s*nguc/i, english: "chest pain" },
  { pattern: /chóng\s*mặt|chong\s*mat|choáng\s*váng|choang\s*vang/i, english: "dizziness" },
  { pattern: /mệt\s*mỏi|met\s*moi|\bmệt\b|\bmet\b|kiệt\s*sức|kiet\s*suc/i, english: "fatigue" },
  { pattern: /buồn\s*nôn|buon\s*non|\bnôn\b|\bnon\b|ói\b|\boi\b/i, english: "nausea" },
  { pattern: /tiêu\s*chảy|tieu\s*chay/i, english: "diarrhea" },
  { pattern: /táo\s*bón|tao\s*bon/i, english: "constipation" },
  { pattern: /đau\s*cổ|dau\s*co/i, english: "neck pain" },
  { pattern: /đau\s*lưng|dau\s*lung/i, english: "back pain" },
  { pattern: /đau\s*răng|dau\s*rang/i, english: "toothache" },
  { pattern: /đau\s*tai|dau\s*tai/i, english: "ear pain" },
  { pattern: /khó\s*thở|kho\s*tho|thở\s*khó|tho\s*kho/i, english: "shortness of breath" },
  { pattern: /đau\s*họng|dau\s*hong/i, english: "sore throat" },
  { pattern: /chảy\s*mũi|chay\s*mui|sổ\s*mũi|so\s*mui/i, english: "runny nose" },
  { pattern: /phát\s*ban|phat\s*ban|mẩn\s*ngứa|man\s*ngua|ngứa|ngua/i, english: "skin rash" },
  { pattern: /mất\s*ngủ|mat\s*ngu|khó\s*ngủ|kho\s*ngu/i, english: "insomnia" },
  { pattern: /đau\s*cơ|dau\s*co|đau\s*nhức\s*cơ|dau\s*nhuc\s*co/i, english: "muscle pain" },
  { pattern: /khó\s*nuốt|kho\s*nuot/i, english: "difficulty swallowing" },
];

/**
 * Tự động chuyển đổi mô tả Tiếng Việt sang Tiếng Anh y khoa để Infermedica NLP phân tích nhanh nhất
 */
export async function getSymptomParseCandidates(symptoms: string): Promise<string[]> {
  const trimmed = symptoms.trim();
  if (!trimmed) return [];

  const candidates = new Set<string>();

  // 1. Dò tìm nhanh qua từ điển regex nội bộ (0ms, không phụ thuộc mạng)
  for (const { pattern, english } of VI_TO_ENGLISH_SYMPTOM) {
    if (pattern.test(trimmed)) {
      candidates.add(english);
    }
  }

  // 2. Nếu từ điển nội bộ chưa khớp từ nào, thử dịch nhanh qua Google Translate với timeout
  if (candidates.size === 0) {
    try {
      const englishTranslation = await fetchGoogleTranslate(trimmed, "vi", "en");
      if (englishTranslation && englishTranslation.toLowerCase() !== trimmed.toLowerCase()) {
        candidates.add(englishTranslation.trim());
      }
    } catch {
      // Bỏ qua lỗi dịch
    }
  }

  // 3. Thêm câu gốc
  candidates.add(trimmed);

  return [...candidates];
}
