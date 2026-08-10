import React from "react";
import { Pressable, Text, View } from "react-native";

type GenderToggleProps = {
  value: "MALE" | "FEMALE" | "";
  onChange: (value: "MALE" | "FEMALE") => void;
  className?: string;
};

export function GenderToggle({ value, onChange, className = "mb-3.5" }: GenderToggleProps) {
  return (
    <View className={`flex-row gap-3 ${className}`}>
      <Pressable
        className={
          value === "MALE"
            ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
            : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
        }
        onPress={() => onChange("MALE")}
      >
        <Text
          className={
            value === "MALE"
              ? "text-primary font-bold text-sm"
              : "text-neutral-400 font-medium text-sm"
          }
        >
          Nam
        </Text>
      </Pressable>

      <Pressable
        className={
          value === "FEMALE"
            ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
            : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
        }
        onPress={() => onChange("FEMALE")}
      >
        <Text
          className={
            value === "FEMALE"
              ? "text-primary font-bold text-sm"
              : "text-neutral-400 font-medium text-sm"
          }
        >
          Nữ
        </Text>
      </Pressable>
    </View>
  );
}
