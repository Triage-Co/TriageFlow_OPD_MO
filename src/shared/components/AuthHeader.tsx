import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type AuthHeaderProps = {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  onBack?: () => void;
  titleSize?: "large" | "normal";
};

export function AuthHeader({
  title,
  subtitle,
  showBackButton = false,
  showLogo = false,
  onBack,
  titleSize = "normal",
}: AuthHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const isLarge = titleSize === "large" || showLogo;

  return (
    <View
      className="bg-primary rounded-b-[28px] px-6 pb-8 shadow-sm"
      style={{ paddingTop: insets.top + (showLogo ? 24 : 20) }}
    >
      {/* Back button */}
      {showBackButton && (
        <Pressable
          onPress={handleBack}
          className="mb-5 self-start active:opacity-70"
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Text className="text-[40px] text-white leading-none">←</Text>
        </Pressable>
      )}

      {/* Logo row */}
      {showLogo && (
        <View className="flex-row items-center gap-2 mb-7">
          <View className="w-8 h-8 bg-white/25 rounded-lg items-center justify-center relative">
            <View className="absolute w-3.5 h-[3px] bg-white rounded-sm" />
            <View className="absolute w-[3px] h-3.5 bg-white rounded-sm" />
          </View>
          <Text className="text-white text-sm font-semibold">TriageFlowOPD</Text>
        </View>
      )}

      {/* Title + subtitle */}
      <Text
        className={`font-extrabold text-white tracking-tight mb-1.5 leading-tight ${
          isLarge ? "text-[34px]" : "text-[28px]"
        }`}
      >
        {title}
      </Text>
      <Text className="text-[13.5px] text-white/80">{subtitle}</Text>
    </View>
  );
}
