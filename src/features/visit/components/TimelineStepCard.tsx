import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";
import { router } from "expo-router";
import { stripRoomName } from "@/shared/utils/string.utils";
import { getStatusBadgeInfo } from "@/shared/utils/status.utils";

interface TimelineStepCardProps {
  step: any;
  index: number;
  isLast: boolean;
  isActive: boolean;
  onPayPress?: (step: any) => void;
  activeStepId: string | null;
  allSteps?: any[];
  isHistoryMode?: boolean;
}

export const TimelineStepCard: React.FC<TimelineStepCardProps> = ({
  step,
  index,
  isLast,
  isActive,
  onPayPress,
  activeStepId,
  allSteps,
  isHistoryMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getPreviousPhysicalRoom = (targetStepId: string) => {
    if (!allSteps || allSteps.length === 0) return null;
    const targetIndex = allSteps.findIndex(
      (s: any) => (s.step_id || s.id) === targetStepId
    );
    if (targetIndex <= 0) return null;

    for (let i = targetIndex - 1; i >= 0; i--) {
      const prev = allSteps[i];
      const prevRoomName = prev.room_info?.room_name || prev.room_name;
      const prevRoomId = prev.room_info?.room_id || prev.room_id;
      const prevRoomCode = prev.room_info?.room_code || prev.room_code;

      if (
        prevRoomName &&
        prevRoomName.trim() !== "" &&
        prevRoomName !== "Đang xếp phòng" &&
        !prevRoomName.toLowerCase().includes("chờ xếp")
      ) {
        return {
          roomId: prevRoomId || "",
          roomName: stripRoomName(prevRoomName),
          roomCode: prevRoomCode || "",
        };
      }
    }
    return null;
  };

  if (step.isGrouped) {
    const isGroupCompleted = step.subSteps.every((s: any) => s.step_status === "COMPLETED");
    const isGroupActive = isActive;

    let gText = "Chờ thực hiện";
    let gBg = "bg-gray-100";
    let gTextColor = "text-gray-500";
    let gIcon: any = "ellipse-outline";
    let gIconColor = "#9CA3AF";
    let gBorder = "border-gray-200";

    if (isGroupCompleted) {
      gText = "Hoàn thành";
      gBg = "bg-green-50";
      gTextColor = "text-green-600";
      gIcon = "checkmark-circle";
      gIconColor = "#10B981";
      gBorder = "border-green-100";
    } else if (isGroupActive) {
      gText = "Đang thực hiện";
      gBg = "bg-blue-50";
      gTextColor = "text-primary";
      gIcon = "play-circle";
      gIconColor = Colors.primary;
      gBorder = "border-blue-200";
    }

    return (
      <View className="flex-row">
        
        <View className="items-center mr-4 w-8 text-center">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center z-10 bg-white border border-gray-100 ${
              isGroupActive ? "bg-blue-100" : isGroupCompleted ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <Ionicons name={gIcon} size={isGroupActive ? 20 : 16} color={gIconColor} />
          </View>
          {!isLast && (
            <View className={`w-[2px] flex-grow my-1 ${isGroupCompleted ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </View>

        <View className="flex-1 pb-6">
          <View className={`bg-white rounded-[20px] border p-4 shadow-sm ${gBorder} ${isGroupActive ? "border-primary" : ""}`}>
            
            <Pressable 
              onPress={() => setIsExpanded(!isExpanded)}
              className="flex-row justify-between items-center"
            >
              <View className="flex-1 mr-2 gap-0.5">
                <Text className={`text-[15px] font-bold ${isGroupActive ? "text-primary" : "text-gray-800"}`}>
                  Bước {index + 1}. Thực hiện chỉ định dịch vụ
                </Text>
                <Text className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                  Tổng cộng {step.subSteps.length} dịch vụ
                </Text>
              </View>
              <View className={`${gBg} px-2.5 py-0.5 rounded-full`}>
                <Text className={`${gTextColor} text-[10px] font-bold`}>
                  {gText}
                </Text>
              </View>
            </Pressable>

            {isExpanded && (
              <View className="mt-3 pt-3 border-t border-gray-100 gap-3">
                {step.subSteps.map((subStep: any, subIdx: number) => {
                  const isSubCompleted = subStep.step_status === "COMPLETED";
                  const isSubActive = subStep.step_id === activeStepId;
                  
                  let subText = "Chờ khám";
                  let subBg = "bg-gray-50";
                  let subTextColor = "text-gray-500";
                  if (isSubCompleted) {
                    subText = "Đã xong";
                    subBg = "bg-green-50";
                    subTextColor = "text-green-600";
                  } else if (subStep.queues?.[0]?.status === "SERVING") {
                    subText = "Đang gọi";
                    subBg = "bg-blue-50";
                    subTextColor = "text-primary";
                  } else if (subStep.queues?.[0]?.status === "QUEUED") {
                    subText = "Đang chờ";
                    subBg = "bg-amber-50";
                    subTextColor = "text-amber-600";
                  }

                  const subRoomName = subStep.room_info?.room_name || "Đang xếp phòng";
                  const subQueueNo = subStep.queues?.[0]?.queue_number;

                  return (
                    <View 
                      key={subStep.step_id} 
                      className={`p-3 rounded-[16px] border border-gray-100 bg-white ${
                        isSubActive ? "border-primary bg-blue-50" : ""
                      }`}
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className={`text-[13px] font-bold flex-1 mr-2 ${isSubActive ? "text-primary" : "text-gray-800"}`}>
                          {subIdx + 1}. {subStep.step_name}
                        </Text>
                        <View className={`${subBg} px-2 py-0.5 rounded-full`}>
                          <Text className={`${subTextColor} text-[9px] font-bold`}>
                            {subText}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center mt-1">
                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="location" size={11} color="#9CA3AF" />
                            <Text className="text-gray-500 text-[11px] font-semibold">
                              {subRoomName}
                            </Text>
                          </View>
                          {subQueueNo && (
                            <View className="flex-row items-center gap-1">
                              <Ionicons name="list" size={11} color="#9CA3AF" />
                              <Text className="text-gray-500 text-[11px] font-semibold">
                                Số: <Text className="text-gray-800 font-bold">{subQueueNo}</Text>
                              </Text>
                            </View>
                          )}
                        </View>

                        {isSubActive && !isHistoryMode && (
                          <Pressable
                            onPress={() => {
                              const prevRoom = getPreviousPhysicalRoom(subStep.step_id || subStep.id);
                              router.push({
                                pathname: "/(patient)/(tabs)/navigation",
                                params: {
                                  targetRoomName: stripRoomName(subRoomName),
                                  targetRoomId: subStep.room_info?.room_id || subStep.room_id || "",
                                  targetRoomCode: subStep.room_info?.room_code || "",
                                  startRoomName: prevRoom?.roomName || "",
                                  startRoomId: prevRoom?.roomId || "",
                                  startRoomCode: prevRoom?.roomCode || "",
                                  _t: String(Date.now()),
                                },
                              });
                            }}
                            className="bg-blue-100 px-2.5 py-1 rounded-full flex-row items-center gap-1 active:opacity-75"
                          >
                            <Ionicons name="navigate-outline" size={10} color={Colors.primary} />
                            <Text className="text-primary text-[10px] font-bold">Đường đi</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  const isCompleted = step.step_status === "COMPLETED";
  const isPendingPayment = step.payment_status === "PENDING";

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
    borderStyle = "border-amber-200";
  } else if (isActive) {
    statusText = "Đang thực hiện";
    statusBg = "bg-blue-50";
    statusTextColor = "text-primary";
    iconName = "play-circle";
    iconColor = Colors.primary;
    borderStyle = "border-blue-200";
  }

  const roomName = step.room_info?.room_name || "Đang xếp phòng";
  const specialtyName = step.specialty_info?.specialty_name || "Phòng chức năng";
  const queueNumber = step.queues?.[0]?.queue_number;

  return (
    <View className="flex-row">
      
      <View className="items-center mr-4 w-8">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center z-10 ${
            isActive ? "bg-blue-100" : isCompleted ? "bg-green-100" : isPendingPayment ? "bg-amber-100" : "bg-gray-100"
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

      <View className="flex-1 pb-6">
        <View
          className={`bg-white rounded-[20px] border p-4 shadow-sm ${borderStyle} ${
            isActive ? "border-primary" : ""
          }`}
        >
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-gray-800 text-[15px] font-bold flex-1 mr-2">
              Bước {index + 1}. {step.step_name || specialtyName}
            </Text>
            <View className={`${statusBg} px-2.5 py-0.5 rounded-full`}>
              <Text className={`${statusTextColor} text-[10px] font-bold`}>
                {statusText}
              </Text>
            </View>
          </View>

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

          {isPendingPayment && !isHistoryMode && (
            <Pressable
              onPress={() => onPayPress && onPayPress(step)}
              className="mt-3 bg-[#10B981] py-2 rounded-xl flex-row items-center justify-center gap-1 active:opacity-75"
            >
              <Ionicons name="card-outline" size={14} color="white" />
              <Text className="text-white text-xs font-bold">Thanh toán ngay</Text>
            </Pressable>
          )}

          {isActive && !isPendingPayment && !isHistoryMode && (
            <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between items-center">
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text className="text-gray-400 text-[11px] font-medium">
                  Chờ ước tính: ~10 phút
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  const prevRoom = getPreviousPhysicalRoom(step.step_id || step.id);
                  router.push({
                    pathname: "/(patient)/(tabs)/navigation",
                    params: {
                      targetRoomName: stripRoomName(roomName),
                      targetRoomId: step.room_info?.room_id || step.room_id || "",
                      targetRoomCode: step.room_info?.room_code || "",
                      startRoomName: prevRoom?.roomName || "",
                      startRoomId: prevRoom?.roomId || "",
                      startRoomCode: prevRoom?.roomCode || "",
                      _t: String(Date.now()),
                    },
                  });
                }}
                className="bg-blue-100 px-3 py-1.5 rounded-full flex-row items-center gap-1 active:opacity-75"
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
