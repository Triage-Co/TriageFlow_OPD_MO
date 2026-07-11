import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { startVnptEkyc } from '../services/ekyc.service';
import type { EkycOcrObject } from '../types/ekyc.types';

/**
 * Hook quản lý luồng eKYC với VNPT SDK.
 *
 * @param onSuccess - Callback tuỳ chọn nhận EkycOcrObject khi xác thực thành công.
 *   - Nếu truyền vào: hook sẽ parse OCR và gọi callback (dùng cho luồng tạo bệnh nhân).
 *   - Nếu không truyền: hook lưu trạng thái verified vào AsyncStorage (dùng standalone).
 */
export const useEkyc = (onSuccess?: (data: EkycOcrObject) => void) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Phân tích cú pháp chuỗi OCR trả về từ VNPT SDK một cách an toàn (2 lớp).
   * Lớp 1: Cố gắng parse JSON chuẩn.
   * Lớp 2: Nếu JSON bị lỗi định dạng (do ký tự lạ/escape), dùng Regex để bóc tách thông tin thô.
   */
  const parseOcrResult = (rawString: string): EkycOcrObject | null => {
    if (!rawString) return null;

    // --- LỚP 1: Parse JSON chuẩn ---
    try {
      const outer = JSON.parse(rawString);
      let obj = outer?.object;

      // Nếu object là chuỗi JSON được mã hoá, parse tiếp lần 2
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

    // --- LỚP 2: Regex fallback để bóc tách chuỗi thô ---
    try {
      // Bóc tách name (hỗ trợ cả nháy kép escaped và nháy đơn/kép thường)
      const nameMatch = rawString.match(/"name"\s*:\s*\\?"([^"\\]+)\\?"/i) ||
        rawString.match(/"name"\s*:\s*"([^"]+)"/i);

      // Bóc tách birth_day dạng dd/MM/yyyy
      const dobMatch = rawString.match(/"birth_day"\s*:\s*\\?"?([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);

      // Bóc tách gender (Nam/Nữ)
      const genderMatch = rawString.match(/"gender"\s*:\s*\\?"([^"\\]+)\\?"/i) ||
        rawString.match(/"gender"\s*:\s*"([^"]+)"/i);

      // Bóc tách id (số CCCD/CMND)
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
    // Chỉ hoạt động trên Android thực tế
    if (Platform.OS !== 'android') {
      Alert.alert('Thông báo', 'Tính năng eKYC chỉ hỗ trợ trên thiết bị Android.');
      return;
    }

    try {
      // Yêu cầu quyền Camera và Record Audio
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      if (
        granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        Alert.alert('Quyền hạn', 'Cần cấp quyền Camera và Record Audio để thực hiện eKYC.');
        return;
      }
    } catch (err) {
      console.log('Lỗi yêu cầu quyền Android:', err);
      return;
    }

    setIsLoading(true);
    try {
      const ekycConfig = {
        accessToken: "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6IjE0OTNlNTBhLWY4YjItNDNjZC1iYTAxLWY3NDkzYTE2MzNjNyIsInN1YiI6IjE5YjhlMzE1LTZjYmEtMTFmMS04ZmE3LTIzY2FhMmMyMzZhMiIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJvanR0ZXN0MTI4QGdtYWlsLmNvbSIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoib2p0dGVzdDEyOEBnbWFpbC5jb20iLCJleHAiOjE3ODM4NzY3MTQsInV1aWRfYWNjb3VudCI6IjE5YjhlMzE1LTZjYmEtMTFmMS04ZmE3LTIzY2FhMmMyMzZhMiIsImF1dGhvcml0aWVzIjpbIlVTRVIiXSwianRpIjoiYzA2ZGFkZGEtZmEzNS00ZThiLWJlNTQtYzU4YTEwZGY2MDQxIiwiY2xpZW50X2lkIjoiY2xpZW50YXBwIn0.HMDQ67Lvu0jrYktEIyDpiqw-JuNKUyo2rUXDFe5qAPY2TJJbi30irPr5fc4ntdq7oLxpmWTCJgYjCwjwLzmWqT5nn2ITFCEsQ2Q5_GMOubIyO36kqippar98lT-XY56FM7GenLa-EUknGtTyxcSuYXXa_l70m2DSiEnXE7psr41gfipCHDDD-115WniHWPl-YvD6CtS6Pu4U0myI-q5ty34LcMCDEy0ixdicBFWZiMgURPct_6oBJC1XpYWxgx9daOqYL2CpTKllDDCc8b3hsx3buJJF04z-rD8ti35n6ohiIuQZcl6tuxX26ttijr00dkSmukmrUZverHFYU3EADw",
        tokenId: "54b1cd72-2cbc-1617-e063-63199f0afd44",
        tokenKey: "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANvv/lIURXikmYrtJBiOyrBeWjYxjROW5z8jvkbh1XLgME7nCHRKUD1N/CyNB+FEPqULHiJX98l9yG0zHRugE+ECAwEAAQ==",
        documentType: 1, // CMND/CCCD
        versionSdk: 1,   // STANDARD
        isShowTutorial: false,
        isEnableScanQrCode: false,
      };

      const result = await startVnptEkyc(ekycConfig);

      if (result && result.lastStep === 'Done' && result.ocrResult) {
        if (onSuccess) {
          // Chế độ tạo bệnh nhân: parse OCR và gọi callback
          const ocrData = parseOcrResult(result.ocrResult);
          if (ocrData) {
            onSuccess(ocrData);
          } else {
            Alert.alert('Lỗi', 'Không thể bóc tách thông tin từ CCCD. Vui lòng kiểm tra lại chất lượng chụp giấy tờ.');
          }
        } else {
          // Chế độ standalone: lưu trạng thái verified vào cache
          await AsyncStorage.setItem('@ekyc_verified', 'true');
          setIsVerified(true);
          Alert.alert('Thành công', 'Xác thực danh tính CCCD thành công!');
        }
      } else {
        Alert.alert('Thông báo', 'Không hoàn thành luồng xác thực eKYC.');
      }
    } catch (error: any) {
      Alert.alert('Thông báo', error.message || 'Quá trình eKYC bị dừng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.removeItem('@ekyc_verified');
      setIsVerified(false);
      Alert.alert('Đã reset', 'Đã xóa dữ liệu xác thực. Bạn có thể tiến hành xác thực lại.');
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
