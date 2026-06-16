import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
};

/**
 * AppInput – shared input component
 * Style theo Figma: border nhẹ, rounded-xl, placeholder only (không cần label)
 * label prop vẫn support nhưng không bắt buộc
 */
export function AppInput({
  label,
  error,
  secureTextEntry,
  rightIcon,
  ...props
}: AppInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const actualSecure = isPassword ? !isPasswordVisible : false;

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text className="text-sm text-gray-600 mb-1.5 font-medium">{label}</Text>
      ) : null}

      <View
        className="flex-row items-center bg-white px-4 rounded-xl"
        style={{
          height: 52,
          borderWidth: isFocused ? 1.5 : 1,
          borderColor: error
            ? "#FCA5A5"
            : isFocused
            ? "#5B9BD5"
            : "#E5E7EB",
        }}
      >
        <TextInput
          className="flex-1 text-sm text-gray-800"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword ? actualSecure : secureTextEntry}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ fontSize: 14 }}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: "#9CA3AF", fontSize: 18 }}>
              {isPasswordVisible ? "🙈" : "👁"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {rightIcon && !isPassword ? rightIcon : null}
      </View>

      {error ? (
        <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>
      ) : null}
    </View>
  );
}
