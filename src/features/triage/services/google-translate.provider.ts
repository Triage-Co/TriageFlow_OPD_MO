import { ITranslationProvider } from "./translation.provider";

export class GoogleTranslateProvider implements ITranslationProvider {
  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      console.log(`[Translation] started: "${text}" from ${from} to ${to}`);
      
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      
      // Thiết lập timeout 5 giây để không làm treo giao diện nếu mạng yếu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Bóc tách kết quả dịch từ format của Google Translate
      if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        const translatedSegments = data[0]
          .map((segment: any) => (segment && segment[0] ? segment[0] : ""))
          .join("");
        
        console.log(`[Translation] completed: "${translatedSegments}"`);
        return translatedSegments;
      }
      
      throw new Error("Mẫu dữ liệu dịch không hợp lệ.");
    } catch (error: any) {
      console.warn(`[Translation] Lỗi khi dịch "${text}":`, error?.message || error);
      throw error;
    }
  }
}
