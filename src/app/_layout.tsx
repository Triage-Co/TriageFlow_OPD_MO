import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "Multiple instances of Three.js being imported",
  "THREE.Clock: This module has been deprecated",
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.",
]);

// Chặn các log không hỗ trợ tham số pixelStorei của Expo GL gây loãng console
const originalLog = console.log;
console.log = (...args) => {
  if (
    args &&
    args.length > 0 &&
    typeof args[0] === "string" &&
    args[0].includes("EXGL: gl.pixelStorei()")
  ) {
    return;
  }
  originalLog(...args);
};

import { Stack } from "expo-router";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/shared/components/ToastProvider";
import "../../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
