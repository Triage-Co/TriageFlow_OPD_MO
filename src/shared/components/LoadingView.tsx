import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Colors } from "@/config/colors";

type LoadingViewProps = {
  message?: string | null;
  color?: string;
  size?: "small" | "large";
  className?: string;
};

export function LoadingView({
  message = "Đang tải...",
  color = Colors.primary,
  size = "large",
  className = "flex-1 items-center justify-center",
}: LoadingViewProps) {
  return (
    <View className={className}>
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text className="text-gray-500 text-[13px] font-medium mt-3 text-center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
