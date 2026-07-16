import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationStore } from "../store/useNavigationStore";

export function MapHeader() {
  const insets = useSafeAreaInsets();
  const { viewMode, setViewMode } = useNavigationStore();

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

        {/* 2D / 3D Perspective Toggle Switch */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl">
          {(["2D", "3D"] as const).map((mode) => {
            const isSelected = viewMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg active:opacity-75 ${
                  isSelected ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-[12px] font-bold ${
                    isSelected ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
