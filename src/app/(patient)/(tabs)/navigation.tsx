import React from "react";
import { View } from "react-native";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { MapHeader } from "@/features/navigation/components/MapHeader";
import { MapViewer } from "@/features/navigation/components/map/MapViewer";

export default function NavigationScreen() {
  return (
    <ScreenWrapper edges={["left", "right"]}>
      <View className="flex-1 bg-[#F8FAFC]">
        <MapHeader />
        <MapViewer />
      </View>
    </ScreenWrapper>
  );
}
