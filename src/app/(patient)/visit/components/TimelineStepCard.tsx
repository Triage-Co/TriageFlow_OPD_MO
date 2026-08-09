import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";
import { useRouter } from "expo-router";

interface TimelineStepCardProps {
  step: any;
  index: number;
  isLast: boolean;
  isActive: boolean;
  onPayPress: (step: any) => void;
}

export const TimelineStepCard: React.FC<TimelineStepCardProps> = ({
  step,
  index,
  isLast,
  isActive,
  onPayPress,
}) => {
  const router = useRouter();
  const isCompleted = step.step_status === "COMPLETED";
  const isPendingPayment = step.payment_status === "PENDING";

  // Xác định màu sắc/icon trạng thái
  let statusText = "Chờ thực hiện";
  let statusBg = "bg-gray-100";
  let statusTextColor = "text-gray-500";
  let iconName: any = "ellipse-outline";
  let iconColor = "#9CA3AF";
  let borderStyle = "border-gray-200";

  if (isCompleted) {
    statusText = "Hoàn thành";
    statusBg = "bg-green-50";
    statusTextColor = "text-green-600";
    iconName = "checkmark-circle";
    iconColor = "#10B981";
    borderStyle = "border-green-100";
  } else if (isPendingPayment) {
    statusText = "Chờ thanh toán";
    statusBg = "bg-amber-50";
    statusTextColor = "text-amber-600 border-amber-200";
    iconName = "card-outline";
    iconColor = "#F59E0B";
    borderStyle = "border-amber-200/50";
  } else if (isActive) {
    statusText = "Đang thực hiện";
    statusBg = "bg-blue-50";
    statusTextColor = "text-primary";
    iconName = "play-circle";
    iconColor = Colors.primary;
    borderStyle = "border-[#84AFEB]/30";
  }

  const roomName = step.room_info?.room_name || "Đang xếp phòng";
  const specialtyName = step.specialty_info?.specialty_name || "Phòng chức năng";
  const queueNumber = step.queues?.[0]?.queue_number;

  return (
    <View className="flex-row">
      {/* Cột trái: Nối đường vẽ timeline */}
      <View className="items-center mr-4 w-8">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center z-10 ${
            isActive ? "bg-primary/20" : isCompleted ? "bg-green-100" : isPendingPayment ? "bg-amber-100" : "bg-gray-100"
          }`}
        >
          <Ionicons name={iconName} size={isActive || isPendingPayment ? 20 : 16} color={iconColor} />
        </View>
        {!isLast && (
          <View
            className={`w-[2px] flex-grow my-1 ${
              isCompleted ? "bg-green-400" : "bg-gray-200"
            }`}
          />
        )}
      </View>

      {/* Cột phải: Thông tin Card */}
      <View className="flex-1 pb-6">
        <View
          className={`bg-white rounded-[20px] border p-4 shadow-sm active:opacity-95 ${borderStyle} ${
            isActive ? "shadow-[#84AFEB]/10 border-primary" : ""
          }`}
        >
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-gray-800 text-[15px] font-bold flex-1 mr-2">
              {step.step_name || specialtyName}
            </Text>
            <View className={`${statusBg} px-2.5 py-0.5 rounded-full border border-transparent`}>
              <Text className={`${statusTextColor} text-[10px] font-bold`}>
                {statusText}
              </Text>
            </View>
          </View>

          {/* Chi tiết phòng và số thứ tự */}
          <View className="flex-row items-center gap-4 mt-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name="location" size={13} color="#9CA3AF" />
              <Text className="text-gray-500 text-[12px] font-semibold">
                {roomName}
              </Text>
            </View>
            {queueNumber && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="list" size={13} color="#9CA3AF" />
                <Text className="text-gray-500 text-[12px] font-semibold">
                  Số thứ tự: <Text className="text-gray-800 font-bold">{queueNumber}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Nút thanh toán trực tiếp từ timeline */}
          {isPendingPayment && (
            <Pressable
              onPress={() => onPayPress(step)}
              className="mt-3 bg-[#10B981] py-2 rounded-xl flex-row items-center justify-center gap-1 active:opacity-75"
            >
              <Ionicons name="card-outline" size={14} color="white" />
              <Text className="text-white text-xs font-bold">Thanh toán ngay</Text>
            </Pressable>
          )}

          {/* Hiển thị thêm thông tin chỉ đường hoặc ước tính cho bước đang chạy */}
          {isActive && !isPendingPayment && (
            <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between items-center">
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text className="text-gray-400 text-[11px] font-medium">
                  Chờ ước tính: ~10 phút
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(patient)/(tabs)/navigation",
                  })
                }
                className="bg-primary/10 px-3 py-1.5 rounded-full flex-row items-center gap-1 active:opacity-75"
              >
                <Ionicons name="navigate-outline" size={12} color={Colors.primary} />
                <Text className="text-primary text-[11px] font-bold">Đường đi</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
