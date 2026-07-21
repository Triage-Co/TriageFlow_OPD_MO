import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MapHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-white px-4 pb-3 border-b border-gray-100 shadow-sm z-20"
    >
      <View className="flex-row items-center justify-between h-12">
        {/* Hospital Building Title */}
        <View>
          <Text className="text-gray-800 text-[16px] font-extrabold">Tòa G2 – Khoa Khám Bệnh</Text>
          <Text className="text-gray-400 text-[11px] font-medium mt-0.5">Sơ đồ 3D chỉ đường trong bệnh viện</Text>
        </View>
      </View>
    </View>
  );
}
