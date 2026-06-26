import { Colors } from "@/config/colors";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BodyModel } from "./components/BodyModel";
import { useBodyPartInteraction } from "./hooks/useBodyPartInteraction";
import { BodyGender, BodyRegion, BodySide, SelectedBodyPart } from "./types";

type BodyMapProps = {
  gender?: BodyGender;
  selectedPartId?: string | null;
  selectedRegionId?: string | null;
  onSelectPart?: (part: SelectedBodyPart) => void;
  onSelectRegion?: (part: BodyRegion) => void;
};

const FALLBACK_PRIMARY = "#006BFF";

export function BodyMap({
  gender = "male",
  selectedPartId,
  selectedRegionId,
  onSelectPart,
  onSelectRegion,
}: BodyMapProps) {
  const [side, setSide] = useState<BodySide>("front");
  const strokeColor = Colors.primary ?? FALLBACK_PRIMARY;
  const activePartId = selectedPartId ?? selectedRegionId ?? null;

  const handleSelectPart = (part: SelectedBodyPart) => {
    onSelectPart?.(part);
    onSelectRegion?.(part);
  };

  const {
    pressedPartId,
    handlePressPart,
    handlePressInPart,
    handlePressOutPart,
  } = useBodyPartInteraction({
    gender,
    side,
    onSelectPart: handleSelectPart,
  });

  const toggleSide = () => {
    setSide((currentSide) => (currentSide === "front" ? "back" : "front"));
  };

  return (
    <View className="w-full h-full items-center justify-between">
      <View className="flex-1 w-full items-center justify-center">
        <BodyModel
          gender={gender}
          side={side}
          strokeColor={strokeColor}
          selectedPartId={activePartId}
          pressedPartId={pressedPartId}
          onPressPart={handlePressPart}
          onPressInPart={handlePressInPart}
          onPressOutPart={handlePressOutPart}
        />
      </View>

      <Pressable
        onPress={toggleSide}
        className="flex-row items-center justify-center gap-[7px] py-2 px-[14px] rounded-full mt-1"
        android_ripple={{ color: "rgba(132, 175, 235, 0.2)" }}
      >
        <SymbolView
          name={{ ios: "arrow.triangle.2.circlepath", android: "sync" }}
          size={16}
          tintColor={strokeColor}
        />

        <Text className="text-primary text-[16px] font-medium">
          Rotate model
        </Text>
      </Pressable>
    </View>
  );
}
