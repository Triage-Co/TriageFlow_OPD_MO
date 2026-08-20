import React from "react";
import { Text, View } from "react-native";

type FormErrorBannerProps = {
  error?: string | null;
  className?: string;
};

export function FormErrorBanner({ error, className = "mb-4" }: FormErrorBannerProps) {
  if (!error) return null;

  return (
    <View className={`bg-red-50 border border-red-200 rounded-xl p-3 ${className}`}>
      <Text className="text-red-500 text-sm font-medium">{error}</Text>
    </View>
  );
}
