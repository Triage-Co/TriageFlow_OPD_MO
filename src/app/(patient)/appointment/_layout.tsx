import React from "react";
import { Stack } from "expo-router";

export default function AppointmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="method-select" />
      <Stack.Screen name="specialty-select" />
      <Stack.Screen name="my-appointments" />
    </Stack>
  );
}
