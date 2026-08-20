export interface EkycConfig {
  accessToken: string;
  tokenId: string;
  tokenKey: string;
  documentType: number; 
  versionSdk: number;    
  isShowTutorial: boolean;
  isEnableScanQrCode: boolean;
}

export interface EkycResult {
  ocrResult: string;         
  compareFaceResult: string; 
  livenessFaceResult: string;
  qrcodeResult: string;
  pathImageFront: string;
  pathImageBack: string;
  lastStep: string;          
}

/**
 * Dữ liệu OCR đã được parse ra từ ocrResult trả về bởi VNPT SDK.
 * Các field này nằm trong object.object bên trong chuỗi JSON lồng nhau.
 */
export interface EkycOcrObject {
  name: string;       
  birth_day: string;  
  gender: string;     
  id: string;         
}

export interface VnptKeyData {
  access_token: string;
  token_id: string;
  token_key: string;
}

export interface VnptKeyResponse {
  code: number;
  message: string;
  status: string;
  data: VnptKeyData;
}
