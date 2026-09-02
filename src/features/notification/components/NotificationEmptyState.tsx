import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";

export const NotificationEmptyState: React.FC = () => {
  return (
    <View className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm items-center justify-center my-6">
      <View className="w-16 h-16 rounded-2xl bg-blue-50/80 items-center justify-center mb-4 border border-blue-100/60">
        <Ionicons name="notifications-off-outline" size={32} color={Colors.primary} />
      </View>
      <Text className="text-gray-800 text-[16px] font-extrabold text-center mb-1">
        Không có thông báo nào
      </Text>
      <Text className="text-gray-400 text-xs font-semibold text-center leading-5 max-w-[240px]">
        Các thông báo về lượt khám, kết quả, đơn thuốc hoặc nhắc lịch hẹn sẽ xuất hiện tại đây.
      </Text>
    </View>
  );
};
