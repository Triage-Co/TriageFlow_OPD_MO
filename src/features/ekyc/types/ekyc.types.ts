export interface EkycConfig {
  accessToken: string;
  tokenId: string;
  tokenKey: string;
  documentType: number; // 1: CMND/CCCD, 2: CCCD Chip, 3: Passport...
  versionSdk: number;    // 1: STANDARD, 2: ADVANCED (Chụp Oval)
  isShowTutorial: boolean;
  isEnableScanQrCode: boolean;
}

export interface EkycResult {
  ocrResult: string;         // Chuỗi JSON chứa thông tin bóc tách
  compareFaceResult: string; // Kết quả so khớp khuôn mặt
  livenessFaceResult: string;// Kết quả kiểm tra ảnh chân dung thực tế
  qrcodeResult: string;
  pathImageFront: string;
  pathImageBack: string;
  lastStep: string;          // Trạng thái bước thực hiện cuối cùng
}

/**
 * Dữ liệu OCR đã được parse ra từ ocrResult trả về bởi VNPT SDK.
 * Các field này nằm trong object.object bên trong chuỗi JSON lồng nhau.
 */
export interface EkycOcrObject {
  name: string;       // Họ tên đầy đủ, ví dụ: "NGUYỄN VĂN A"
  birth_day: string;  // Ngày sinh dạng "dd/MM/yyyy", ví dụ: "22/06/2000"
  gender: string;     // "Nam" hoặc "Nữ"
  id: string;         // Số CCCD/CMND, ví dụ: "048203001234"
}
