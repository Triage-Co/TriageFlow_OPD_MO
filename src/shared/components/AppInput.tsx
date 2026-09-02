import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
};

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
            ? Colors.primary
            : "#E5E7EB",
        }}
      >
        <TextInput
          className="flex-1 text-sm text-gray-800"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword ? actualSecure : secureTextEntry}
          autoCapitalize="none"
          style={{ fontSize: 14 }}
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#9CA3AF"
            />
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
