import { Stack } from "expo-router";
import { TriageProvider } from "@/features/triage/context/TriageContext";

export default function PatientLayout() {
  return (
    <TriageProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </TriageProvider>
  );
}
