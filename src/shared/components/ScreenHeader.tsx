import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

type ScreenHeaderProps = {
  title: string;
  showBackButton?: boolean;
  backText?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  progress?: {
    current: number;
    total: number;
  };
};

export function ScreenHeader({
  title,
  showBackButton = true,
  backText,
  onBack,
  rightElement,
  progress,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(patient)/(tabs)/home");
    }
  };

  const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <View
      className="bg-primary px-5 pb-5 shadow-sm"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3 flex-1">
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              className="flex-row items-center gap-1 p-1"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <SymbolView
                name={{ ios: "chevron.left", android: "arrow_back" }}
                size={26}
                tintColor="#FFFFFF"
              />
              {backText && (
                <Text className="text-white text-[16px] font-medium">
                  {backText}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <Text
            className="text-white text-[16px] font-bold flex-1"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {rightElement && <View>{rightElement}</View>}
      </View>

      {progress && (
        <View className="mt-1">
          <Text className="text-white/80 text-[11px] font-semibold">
            Bước {progress.current}/{progress.total}
          </Text>
          <View className="h-[3px] bg-white/25 w-full rounded-full mt-1.5 relative overflow-hidden">
            <View
              className="h-full bg-white rounded-full absolute left-0 top-0"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
