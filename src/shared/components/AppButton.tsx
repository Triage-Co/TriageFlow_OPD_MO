import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  View,
} from "react-native";

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
          backgroundColor: "#5B9BD5",
          borderRadius: 999,
          height: 52,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          width: fullWidth ? ("100%" as const) : undefined,
          opacity: isDisabled ? 0.6 : 1,
        };
      case "secondary":
        return {
          backgroundColor: "#DBEAFE",
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
          borderColor: "#5B9BD5",
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
      case "primary": return "#FFFFFF";
      case "secondary": return "#2563EB";
      case "outline": return "#5B9BD5";
      case "ghost": return "#5B9BD5";
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
          <ActivityIndicator size="small" color={variant === "primary" ? "#fff" : "#5B9BD5"} />
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
