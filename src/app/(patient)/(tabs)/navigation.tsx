import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { MapHeader } from "@/features/navigation/components/MapHeader";
import { MapViewer } from "@/features/navigation/components/map/MapViewer";
import { useNavigationStore } from "@/features/navigation/store/useNavigationStore";
import { useBuildingMap } from "@/features/navigation/hooks/useBuildingMap";
import { fetchRoute } from "@/features/navigation/services/map.service";
import { RoomPickerModal } from "@/features/navigation/components/RoomPickerModal";
import { RoomOption } from "@/features/navigation/types/map.types";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { bookingStorageService } from "@/features/booking/services/booking-storage.service";
import { useLocalSearchParams } from "expo-router";
import { stripRoomName } from "@/shared/utils/string.utils";
import { showGlobalToast } from "@/shared/components/ToastProvider";

// Helper to match a room across floors in building map
function findRoomInFloors(
  floors: any[],
  roomId?: string,
  roomCode?: string,
  roomName?: string
): RoomOption | null {
  if (!roomId && !roomCode && !roomName) return null;
  const cleanName = roomName ? stripRoomName(roomName) : "";
  const normName = cleanName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const targetCodeLower = roomCode?.toLowerCase().trim();

  for (const floor of floors) {
    const room = floor.rooms?.find((r: any) => {
      // 1. Match by ID if provided
      if (roomId && (r.id === roomId || r.roomId === roomId)) {
        return true;
      }

      const rCode = (r.roomCode || "").toLowerCase().trim();
      const rLabel = r.roomLabel || "";
      const rLabelStripped = stripRoomName(rLabel);
      const normLabel = rLabel
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      const normLabelStripped = rLabelStripped
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      // 2. Match by Room Code (e.g. "P101", "XQ01")
      if (targetCodeLower && rCode === targetCodeLower) {
        return true;
      }

      // 3. Match by Normalized & Stripped Room Label
      if (normName) {
        if (rCode === normName) return true;
        if (normLabel === normName) return true;
        if (normLabelStripped === normName) return true;
        if (normLabel.includes(normName) || normName.includes(normLabel)) return true;
        if (
          normLabelStripped.includes(normName) ||
          normName.includes(normLabelStripped)
        ) {
          return true;
        }
      }

      return false;
    });

    if (room) {
      return {
        id: room.id,
        roomCode: room.roomCode,
        roomLabel: room.roomLabel,
        floorNumber: floor.floorNumber,
        type: room.type,
      };
    }
  }
  return null;
}

export default function NavigationScreen() {
  const params = useLocalSearchParams<{
    targetRoomName?: string;
    targetRoomId?: string;
    targetRoomCode?: string;
    startRoomName?: string;
    startRoomId?: string;
    startRoomCode?: string;
    _t?: string;
  }>();

  const targetRoomName = params.targetRoomName;
  const targetRoomId = params.targetRoomId;
  const targetRoomCode = params.targetRoomCode;
  const startRoomName = params.startRoomName;
  const startRoomId = params.startRoomId;
  const startRoomCode = params.startRoomCode;
  const triggerTime = params._t;

  const {
    activeFloor,
    setActiveFloor,
    activeBuildingId,
    setActiveBuildingId,
    startRoom,
    setStartRoom,
    targetRoom,
    setTargetRoom,
    routeData,
    setRouteData,
  } = useNavigationStore();

  const { rawMap } = useBuildingMap(activeFloor, activeBuildingId || undefined);
  const { fetchStepDetail } = useBooking();

  const [modalType, setModalType] = useState<"start" | "target" | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function initAutoRouting() {
      try {
        let resolvedTargetRoomName = targetRoomName;
        let resolvedBuildingId = "00b03ef8-7702-4b08-a07e-ec887432453c"; // Default building

        if (resolvedTargetRoomName || targetRoomId) {
          const activeBooking = await bookingStorageService.getActiveBookingStep();
          if (activeBooking) {
            const stepDetail = await fetchStepDetail(activeBooking.stepId, { skipGlobalToast: true });
            if (stepDetail) {
              resolvedBuildingId =
                (stepDetail.flow?.booking?.slot?.shift?.room as any)?.floor?.buildingId ||
                resolvedBuildingId;
            }
          }
        } else {
          const activeBooking = await bookingStorageService.getActiveBookingStep();
          if (!activeBooking) return;

          const stepDetail = await fetchStepDetail(activeBooking.stepId, { skipGlobalToast: true });
          if (!stepDetail) return;

          resolvedTargetRoomName = stepDetail.flow?.booking?.slot?.shift?.room?.room_name;
          if (!resolvedTargetRoomName) return;

          resolvedBuildingId =
            (stepDetail.flow?.booking?.slot?.shift?.room as any)?.floor?.buildingId ||
            resolvedBuildingId;
        }

        setActiveBuildingId(resolvedBuildingId);

        const { fetchBuildingMap } = require("@/features/navigation/services/map.service");
        const mapData = await fetchBuildingMap(resolvedBuildingId);
        if (!mapData || !mapData.floors) return;

        let foundTarget: RoomOption | null = null;
        let foundStart: RoomOption | null = null;

        // 1. Match Target Room
        foundTarget = findRoomInFloors(
          mapData.floors,
          targetRoomId,
          targetRoomCode,
          resolvedTargetRoomName
        );

        // 2. Match Start Room if explicitly passed from previous step
        const hasExplicitStart = Boolean(startRoomName || startRoomId || startRoomCode);
        if (hasExplicitStart) {
          foundStart = findRoomInFloors(
            mapData.floors,
            startRoomId,
            startRoomCode,
            startRoomName
          );
        }

        const isExplicitTarget = Boolean(targetRoomName || targetRoomId || targetRoomCode);

        // Only search for default start point if target was NOT explicitly requested via step click AND no explicit start room
        if (!isExplicitTarget && !hasExplicitStart) {
          for (const floor of mapData.floors) {
            const room = floor.rooms?.find((r: any) => {
              const l = (r.roomLabel || "").toLowerCase();
              return l.includes("sảnh") || l.includes("tiếp nhận") || l.includes("nhà thuốc");
            });
            if (room) {
              foundStart = {
                id: room.id,
                roomCode: room.roomCode,
                roomLabel: room.roomLabel,
                floorNumber: floor.floorNumber,
                type: room.type,
              };
              break;
            }
          }

          if (!foundStart && mapData.floors.length > 0) {
            const firstFloor =
              mapData.floors.find((f: any) => f.floorNumber === 1) || mapData.floors[0];
            if (firstFloor && firstFloor.rooms?.length > 0) {
              const room = firstFloor.rooms[0];
              foundStart = {
                id: room.id,
                roomCode: room.roomCode,
                roomLabel: room.roomLabel,
                floorNumber: firstFloor.floorNumber,
                type: room.type,
              };
            }
          }
        }

        if (foundTarget) {
          setTargetRoom(foundTarget);
          if (foundStart) {
            // Set start room from previous step
            setStartRoom(foundStart);
            setActiveFloor(foundStart.floorNumber);
          } else if (isExplicitTarget) {
            // Step 1: No previous room, user can choose origin or scan QR
            setStartRoom(null);
            setRouteData(null);
            setActiveFloor(foundTarget.floorNumber);
          }
        } else if (isExplicitTarget) {
          showGlobalToast(
            `Không tìm thấy phòng "${stripRoomName(resolvedTargetRoomName || targetRoomName || "")}" trên bản đồ. Vui lòng chọn thủ công!`,
            "error"
          );
        }

        if (foundStart && !foundTarget) {
          setStartRoom(foundStart);
        }
      } catch (err) {
        console.warn("[NavigationScreen] Auto-routing error:", err);
      }
    }

    initAutoRouting();
  }, [targetRoomName, targetRoomId, targetRoomCode, startRoomName, startRoomId, startRoomCode, triggerTime]);

  
  useEffect(() => {
    if (startRoom && targetRoom) {
      setRouteLoading(true);
      fetchRoute(startRoom.id, "ROOM", targetRoom.id, "ROOM")
        .then((data) => {
          setRouteData(data);
        })
        .catch((err) => {
          console.warn("[NavigationScreen] fetchRoute error:", err);
          setRouteData(null);
        })
        .finally(() => {
          setRouteLoading(false);
        });
    } else {
      setRouteData(null);
    }
  }, [startRoom, targetRoom]);

  const handleReset = () => {
    setStartRoom(null);
    setTargetRoom(null);
    setRouteData(null);
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <View className="flex-1 bg-[#F8FAFC] relative">
        <MapHeader />

        {/* Hospital 3D Canvas View */}
        <MapViewer />

        {/* Dynamic Floor Switcher (floating side list from rawMap.floors) */}
        {rawMap?.floors && rawMap.floors.length > 1 && (
          <View className="absolute right-4 top-24 z-20 flex-col items-center">
            {rawMap?.floors
              ?.slice()
              ?.sort((a, b) => a.floorNumber - b.floorNumber)
              ?.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setActiveFloor(f.floorNumber)}
                  style={{
                    backgroundColor: activeFloor === f.floorNumber ? "#3b82f6" : "#ffffff",
                    borderColor: activeFloor === f.floorNumber ? "#3b82f6" : "#e5e7eb",
                  }}
                  className="w-10 h-10 rounded-full items-center justify-center border shadow-md mb-2 active:scale-95"
                >
                  <Text
                    style={{ color: activeFloor === f.floorNumber ? "#ffffff" : "#374151" }}
                    className="text-xs font-extrabold"
                  >
                    T{f.floorNumber}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Compact Floating Routing Panel (Top-Left Corner) */}
        <View className="absolute left-4 top-24 z-20 w-[190px] bg-white/95 rounded-[20px] border border-gray-100 shadow-md p-3">
          <View className="flex-row items-center justify-between pb-2 border-b border-gray-50 mb-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="navigate" size={14} color="#3b82f6" />
              <Text className="text-gray-800 text-[11px] font-black tracking-tight">Chỉ đường</Text>
            </View>
            {(startRoom || targetRoom) && (
              <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                <Ionicons name="refresh" size={12} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          <View className="space-y-2">
            {/* Start location picker */}
            <TouchableOpacity
              onPress={() => setModalType("start")}
              activeOpacity={0.7}
              className={`flex-row items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                startRoom ? "bg-emerald-50/20 border-emerald-100" : "bg-gray-50 border-gray-100"
              }`}
            >
              <Text className="text-[10px] font-bold text-gray-700 truncate flex-1 mr-1">
                {startRoom ? `${startRoom.roomLabel}` : "Điểm xuất phát..."}
              </Text>
              <Ionicons name="search" size={10} color={startRoom ? "#10b981" : "#9CA3AF"} />
            </TouchableOpacity>

            {/* Target location picker */}
            <TouchableOpacity
              onPress={() => setModalType("target")}
              activeOpacity={0.7}
              className={`flex-row items-center justify-between px-2.5 py-1.5 rounded-lg border mt-2 ${
                targetRoom ? "bg-rose-50/20 border-rose-100" : "bg-gray-50 border-gray-100"
              }`}
            >
              <Text className="text-[10px] font-bold text-gray-700 truncate flex-1 mr-1">
                {targetRoom ? `${targetRoom.roomLabel}` : "Điểm cần đến..."}
              </Text>
              <Ionicons name="search" size={10} color={targetRoom ? "#ef4444" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          {/* Route status loading spinner */}
          {routeLoading && (
            <View className="flex-row items-center justify-center gap-1.5 py-1.5 bg-gray-50 rounded-lg border border-gray-50 mt-2">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-[9px] font-semibold text-gray-500">Đang tính...</Text>
            </View>
          )}

          {/* Route details distance indicator */}
          {routeData && !routeLoading && (
            <View className="p-2 bg-blue-50/30 rounded-lg border border-blue-50/50 mt-2 flex-row items-center justify-between">
              <View>
                <Text className="text-gray-400 text-[8px] font-bold">Khoảng cách</Text>
                <Text className="font-extrabold text-blue-800 text-xs mt-0.5">
                  ~{Math.round(routeData.totalDistance || routeData.distance || 0)}m
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Search Modal for selecting location options */}
        <RoomPickerModal
          isOpen={modalType !== null}
          onClose={() => setModalType(null)}
          title={modalType === "start" ? "Chọn điểm xuất phát" : "Chọn điểm đến"}
          floors={rawMap?.floors}
          onSelect={(room) => {
            if (modalType === "start") {
              setStartRoom(room);
              setActiveFloor(room.floorNumber);
            } else {
              setTargetRoom(room);
              setActiveFloor(room.floorNumber);
            }
          }}
        />
      </View>
    </ScreenWrapper>
  );
}
