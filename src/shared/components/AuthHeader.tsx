import React from "react";
import { Image, Pressable, Text, View } from "react-native";
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
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
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
        <View className="flex-row items-center gap-2.5 mb-6">
          <View className="w-10 h-10 bg-white rounded-xl items-center justify-center p-1 shadow-sm">
            <Image
              source={require("../../../assets/images/logo.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-white text-base font-bold tracking-wide">TriageFlow OPD</Text>
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
