import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { NotificationItem } from "@/features/notification/types/notification.types";

interface NotificationCardProps {
  item: NotificationItem;
  onDelete: (id: string) => void;
}

function formatNotificationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay === 1) {
      const timeStr = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `Hôm qua ${timeStr}`;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${time} • ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function getNotificationStyle(message: string): {
  iconType: "ionicons" | "fa5";
  iconName: string;
  iconBg: string;
  iconColor: string;
  tagText: string;
  tagBg: string;
  tagColor: string;
} {
  const lower = message.toLowerCase();

  if (lower.includes("đơn thuốc") || lower.includes("thuốc") || lower.includes("nhà thuốc")) {
    return {
      iconType: "ionicons",
      iconName: "medkit",
      iconBg: "bg-emerald-50",
      iconColor: "#059669",
      tagText: "Nhà thuốc",
      tagBg: "bg-emerald-50 border border-emerald-200/60",
      tagColor: "text-emerald-700",
    };
  }

  if (lower.includes("lịch hẹn") || lower.includes("hẹn khám") || lower.includes("appointment")) {
    return {
      iconType: "ionicons",
      iconName: "calendar",
      iconBg: "bg-purple-50",
      iconColor: "#8B5CF6",
      tagText: "Lịch hẹn",
      tagBg: "bg-purple-50 border border-purple-200/60",
      tagColor: "text-purple-700",
    };
  }

  if (lower.includes("thanh toán") || lower.includes("viện phí") || lower.includes("hóa đơn") || lower.includes("tiền")) {
    return {
      iconType: "ionicons",
      iconName: "wallet",
      iconBg: "bg-amber-50",
      iconColor: "#D97706",
      tagText: "Viện phí",
      tagBg: "bg-amber-50 border border-amber-200/60",
      tagColor: "text-amber-700",
    };
  }

  if (lower.includes("phòng khám") || lower.includes("bác sĩ") || lower.includes("hàng đợi") || lower.includes("khám")) {
    return {
      iconType: "fa5",
      iconName: "stethoscope",
      iconBg: "bg-blue-50",
      iconColor: "#2563EB",
      tagText: "Khám bệnh",
      tagBg: "bg-blue-50 border border-blue-200/60",
      tagColor: "text-blue-700",
    };
  }

  return {
    iconType: "ionicons",
    iconName: "notifications",
    iconBg: "bg-sky-50",
    iconColor: "#0284C7",
    tagText: "Hệ thống",
    tagBg: "bg-sky-50 border border-sky-200/60",
    tagColor: "text-sky-700",
  };
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ item, onDelete }) => {
  const style = getNotificationStyle(item.message);
  const timeFormatted = formatNotificationTime(item.created_at);

  return (
    <View className="bg-white rounded-[24px] p-4 mb-3 border border-gray-100 shadow-sm">
      <View className="flex-row items-start gap-3">
        {/* Category Icon */}
        <View className={`w-11 h-11 rounded-2xl ${style.iconBg} items-center justify-center border border-gray-100/80 shrink-0 mt-0.5`}>
          {style.iconType === "fa5" ? (
            <FontAwesome5 name={style.iconName as any} size={19} color={style.iconColor} />
          ) : (
            <Ionicons name={style.iconName as any} size={22} color={style.iconColor} />
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className={`px-2.5 py-0.5 rounded-full ${style.tagBg}`}>
              <Text className={`text-[10px] font-extrabold uppercase ${style.tagColor}`}>
                {style.tagText}
              </Text>
            </View>
            <Text className="text-[11px] font-semibold text-gray-400">
              {timeFormatted}
            </Text>
          </View>

          <Text className="text-[14px] text-gray-700 font-bold leading-5 mb-2.5">
            {item.message}
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text className="text-[11px] text-gray-400 font-medium">Chi tiết</Text>
            </View>

            <Pressable
              onPress={() => onDelete(item.id)}
              hitSlop={10}
              className="flex-row items-center gap-1 py-1 px-2.5 rounded-xl bg-gray-50 active:bg-red-50"
            >
              <Ionicons name="trash-outline" size={13} color="#9CA3AF" />
              <Text className="text-[11px] font-bold text-gray-400">Xóa</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};
