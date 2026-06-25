import React from "react";
import { Stack } from "expo-router";
import { TriageProvider } from "@/features/triage/context/TriageContext";

export default function VisitLayout() {
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
