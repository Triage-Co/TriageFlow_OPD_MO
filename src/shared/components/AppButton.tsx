import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  View,
} from "react-native";
import { Colors } from "@/config/colors";

type AppButtonVariant = "primary" | "secondary" | "outline" | "ghost";

type AppButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: AppButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
};

export function AppButton({
  title,
  variant = "primary",
  isLoading = false,
  fullWidth = true,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;

  const containerStyle = (() => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: Colors.primary,
          borderRadius: 999,
          height: 52,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          width: fullWidth ? ("100%" as const) : undefined,
          opacity: isDisabled ? 0.6 : 1,
        };
      case "secondary":
        return {
          backgroundColor: Colors.neutral50,
          borderRadius: 999,
          height: 52,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          width: fullWidth ? ("100%" as const) : undefined,
          opacity: isDisabled ? 0.6 : 1,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderRadius: 999,
          height: 52,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          borderWidth: 1.5,
          borderColor: Colors.primary,
          width: fullWidth ? ("100%" as const) : undefined,
          opacity: isDisabled ? 0.6 : 1,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          height: 52,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          width: fullWidth ? ("100%" as const) : undefined,
        };
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case "primary":   return Colors.neutral100;
      case "secondary": return Colors.neutral700;
      case "outline":   return Colors.primary;
      case "ghost":     return Colors.primary;
    }
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[containerStyle, style]}
      {...props}
    >
      {isLoading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? Colors.neutral100 : Colors.primary}
          />
          <Text style={{ color: textColor, fontSize: 15, fontWeight: "600" }}>
            Đang xử lý...
          </Text>
        </View>
      ) : (
        <Text style={{ color: textColor, fontSize: 15, fontWeight: "600" }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
