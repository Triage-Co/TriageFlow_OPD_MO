import { Stack } from "expo-router";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import "../../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
