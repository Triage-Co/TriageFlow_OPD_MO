import { NativeModules } from 'react-native';
import type { EkycConfig, EkycResult } from '../types/ekyc.types';

const { VnptEkycModule } = NativeModules;

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
