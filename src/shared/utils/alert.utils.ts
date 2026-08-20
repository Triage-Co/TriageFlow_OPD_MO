import { Alert } from "react-native";

export const AppAlert = {
  info: (message: string, title = "Thông báo", onPress?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", style: "default", onPress }]);
  },

  error: (message: string, title = "Lỗi", onPress?: () => void) => {
    Alert.alert(title, message, [{ text: "Đóng", style: "cancel", onPress }]);
  },

  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = "Xác nhận",
    cancelText = "Hủy"
  ) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: onCancel },
      { text: confirmText, style: "default", onPress: onConfirm },
    ]);
  },
};
