import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "Multiple instances of Three.js being imported",
  "THREE.Clock: This module has been deprecated",
]);

import { Stack } from "expo-router";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
