import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { startVnptEkyc } from '../services/ekyc.service';

export const useEkyc = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra cache khi hook được load
  useEffect(() => {
    const checkCache = async () => {
      try {
        const verified = await AsyncStorage.getItem('@ekyc_verified');
        if (verified === 'true') {
          setIsVerified(true);
        }
      } catch (err) {
        console.log('Lỗi đọc bộ nhớ cache eKYC:', err);
      }
    };
    checkCache();
  }, []);

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
        accessToken: "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6Ijg0MTg4NmU2LTg2YTEtNDg5OS05MTFhLWZmOWZjNjBhMDdjZiIsInN1YiI6IjE5YjhlMzE1LTZjYmEtMTFmMS04ZmE3LTIzY2FhMmMyMzZhMiIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJvanR0ZXN0MTI4QGdtYWlsLmNvbSIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoib2p0dGVzdDEyOEBnbWFpbC5jb20iLCJleHAiOjE3ODMzNTUzOTQsInV1aWRfYWNjb3VudCI6IjE5YjhlMzE1LTZjYmEtMTFmMS04ZmE3LTIzY2FhMmMyMzZhMiIsImF1dGhvcml0aWVzIjpbIlVTRVIiXSwianRpIjoiOWYxZWY2ZGQtNWJiMC00NDBhLWI1OWQtNzJmODJlYTc2OWIzIiwiY2xpZW50X2lkIjoiY2xpZW50YXBwIn0.rEny8xXYXq3XWVdT5wHf6VSTpJ9Lu89vvVQi9I_cX3e3aZVqRwoJk6VzWiTQqd9CsGHgPHrBipRI0ZfuLtRwXbTf5a1x0CWlCBe1jYr1BnfDaPLwwx2WNWcs2-fa41HpRNWf-_hpO9JDJq4VFVPOc9srIuIA2A_V3_D8MXMXshY5MekeNlrSyZmoa6BhRGNlWOcKZElbIy850vfHQw5DNCodtg7B0jUhqYYPzQ4LURBET0kT9MnzdZCWoDREYyWtogo39yxSQWFgJ-bKkWu9p0XV5CoX2FD9Dcp6W62cT2DuG_U0DSFnfGJUjTpJjtvVtmT5z5fYq6DPwrtcpJ-SHg",
        tokenId: "54b1cd72-2cbc-1617-e063-63199f0afd44",
        tokenKey: "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANvv/lIURXikmYrtJBiOyrBeWjYxjROW5z8jvkbh1XLgME7nCHRKUD1N/CyNB+FEPqULHiJX98l9yG0zHRugE+ECAwEAAQ==",
        documentType: 1, // CMND/CCCD
        versionSdk: 1,   // STANDARD
        isShowTutorial: false,
        isEnableScanQrCode: false,
      };

      const result = await startVnptEkyc(ekycConfig);

      if ((result && result.ocrResult) || result.lastStep === 'Done') {
        // Chỉ lưu trạng thái verified = true theo yêu cầu (không lưu OCR data)
        await AsyncStorage.setItem('@ekyc_verified', 'true');
        setIsVerified(true);
        Alert.alert('Thành công', 'Xác thực danh tính CCCD thành công!');
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
