import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationStore } from "../store/useNavigationStore";
import { useBuildingMap } from "../hooks/useBuildingMap";

/**
 * Header component for the map view. Displays the dynamic building details.
 */
export function MapHeader() {
  const insets = useSafeAreaInsets();
  const { activeFloor, activeBuildingId } = useNavigationStore();
  const { rawMap } = useBuildingMap(activeFloor, activeBuildingId || undefined);

  
  const buildingName = rawMap?.building?.name || "Tòa G2 – Khoa Khám Bệnh";
  const buildingAddress = rawMap?.building?.addressLabel || "Sơ đồ 3D chỉ đường trong bệnh viện";

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-white px-4 pb-3 border-b border-gray-100 shadow-sm z-20"
    >
      <View className="flex-row items-center justify-between h-12">
        <View>
          <Text className="text-gray-800 text-[16px] font-extrabold">{buildingName}</Text>
          <Text className="text-gray-400 text-[11px] font-medium mt-0.5">{buildingAddress}</Text>
        </View>
      </View>
    </View>
  );
}
