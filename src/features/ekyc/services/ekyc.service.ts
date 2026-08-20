import { NativeModules } from 'react-native';
import apiClient from '@/shared/services/api-client';
import type { EkycConfig, EkycResult, VnptKeyData, VnptKeyResponse } from '../types/ekyc.types';

const { VnptEkycModule } = NativeModules;

/**
 * Lấy cấu hình xác thực VNPT eKYC từ Backend
 * GET /api/vnpt/key
 */
export const getVnptKey = async (): Promise<VnptKeyData | null> => {
  try {
    const response = await apiClient.get<VnptKeyResponse>('/api/vnpt/key');
    if (response.data?.data) {
      return response.data.data;
    }
  } catch (err) {
    console.error('Lỗi khi gọi API GET /api/vnpt/key:', err);
  }
  return null;
};

export const startVnptEkyc = (config: EkycConfig): Promise<EkycResult> => {
  return VnptEkycModule.startEkycFullFlow({
    accessToken: String(config.accessToken),
    tokenId: String(config.tokenId),
    tokenKey: String(config.tokenKey),
    documentType: Number(config.documentType),
    versionSdk: Number(config.versionSdk),
    isShowTutorial: Boolean(config.isShowTutorial),
    isEnableScanQrCode: Boolean(config.isEnableScanQrCode),
  });
};
