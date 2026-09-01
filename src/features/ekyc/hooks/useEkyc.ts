import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { AppAlert } from '@/shared/utils/alert.utils';
import { startVnptEkyc, getVnptKey } from '../services/ekyc.service';
import type { EkycOcrObject } from '../types/ekyc.types';

export const useEkyc = (onSuccess?: (data: EkycOcrObject) => void) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parseOcrResult = (rawString: string): EkycOcrObject | null => {
    if (!rawString) return null;

    try {
      const outer = JSON.parse(rawString);
      let obj = outer?.object;

      if (typeof obj === 'string') {
        obj = JSON.parse(obj);
      }

      if (obj && obj.name && obj.birth_day && obj.id) {
        return {
          name: String(obj.name).trim(),
          birth_day: String(obj.birth_day).trim(),
          gender: String(obj.gender || 'Nam').trim(),
          id: String(obj.id).trim(),
        };
      }
    } catch (e) {
      console.warn('[useEkyc] JSON parse failed, switching to regex fallback:', e);
    }

    try {
      
      const nameMatch = rawString.match(/"name"\s*:\s*\\?"([^"\\]+)\\?"/i) ||
        rawString.match(/"name"\s*:\s*"([^"]+)"/i);

      const dobMatch = rawString.match(/"birth_day"\s*:\s*\\?"?([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);

      const genderMatch = rawString.match(/"gender"\s*:\s*\\?"([^"\\]+)\\?"/i) ||
        rawString.match(/"gender"\s*:\s*"([^"]+)"/i);

      const idMatch = rawString.match(/"id"\s*:\s*\\?"([0-9]+)\\?"/i) ||
        rawString.match(/"id"\s*:\s*"([0-9]+)"/i);

      if (nameMatch && dobMatch && idMatch) {
        return {
          name: nameMatch[1].trim(),
          birth_day: dobMatch[1].trim(),
          gender: genderMatch ? genderMatch[1].trim() : 'Nam',
          id: idMatch[1].trim(),
        };
      }
    } catch (err) {
      console.error('[useEkyc] Regex extraction failed:', err);
    }

    return null;
  };

  const handleLaunchEkyc = async () => {
    
    if (Platform.OS !== 'android') {
      AppAlert.info('Tính năng eKYC chỉ hỗ trợ trên thiết bị Android.');
      return;
    }

    try {
      
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      if (
        granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        AppAlert.info('Cần cấp quyền Camera và Record Audio để thực hiện eKYC.', 'Quyền hạn');
        return;
      }
    } catch (err) {
      console.log('Lỗi yêu cầu quyền Android:', err);
      return;
    }

    setIsLoading(true);
    try {
      const keyData = await getVnptKey();

      if (!keyData || !keyData.access_token || !keyData.token_id || !keyData.token_key) {
        AppAlert.error(
          'Không thể lấy thông tin cấu hình eKYC từ máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại.',
          'Lỗi xác thực'
        );
        return;
      }

      const ekycConfig = {
        accessToken: keyData.access_token,
        tokenId: keyData.token_id,
        tokenKey: keyData.token_key,
        documentType: 1, 
        versionSdk: 1,   
        isShowTutorial: false,
        isEnableScanQrCode: false,
      };

      const result = await startVnptEkyc(ekycConfig);

      if (result && result.lastStep === 'Done' && result.ocrResult) {
        if (onSuccess) {
          
          const ocrData = parseOcrResult(result.ocrResult);
          if (ocrData) {
            onSuccess(ocrData);
          } else {
            AppAlert.error('Không thể bóc tách thông tin từ CCCD. Vui lòng kiểm tra lại chất lượng chụp giấy tờ.');
          }
        } else {
          
          await AsyncStorage.setItem('@ekyc_verified', 'true');
          setIsVerified(true);
          AppAlert.info('Xác thực danh tính CCCD thành công!', 'Thành công');
        }
      } else {
        AppAlert.info('Không hoàn thành luồng xác thực eKYC.');
      }
    } catch (error: any) {
      AppAlert.info(error.message || 'Quá trình eKYC bị dừng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.removeItem('@ekyc_verified');
      setIsVerified(false);
      AppAlert.info('Đã xóa dữ liệu xác thực. Bạn có thể tiến hành xác thực lại.', 'Đã reset');
    } catch (err) {
      console.log('Lỗi xóa cache eKYC:', err);
    }
  };

  return {
    isVerified,
    isLoading,
    handleLaunchEkyc,
    handleClearCache,
  };
};
