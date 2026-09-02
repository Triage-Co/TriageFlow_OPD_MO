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
import { RoomDetailCard } from "@/features/navigation/components/RoomDetailCard";
import { RoomOption } from "@/features/navigation/types/map.types";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { bookingStorageService } from "@/features/booking/services/booking-storage.service";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stripRoomName } from "@/shared/utils/string.utils";
import { showGlobalToast } from "@/shared/components/ToastProvider";

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

      if (targetCodeLower && rCode === targetCodeLower) {
        return true;
      }

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
  const navigation = useNavigation();
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
    selectedRoom,
    setSelectedRoom,
    setSelectedNodeId,
    routeData,
    setRouteData,
    resetNavigation,
  } = useNavigationStore();

  const { rawMap } = useBuildingMap(activeFloor, activeBuildingId || undefined);
  const { fetchStepDetail } = useBooking();

  const [modalType, setModalType] = useState<"start" | "target" | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: isFullscreen ? "none" : "flex" },
    });
    return () => {
      navigation.setOptions({
        tabBarStyle: { display: "flex" },
      });
    };
  }, [isFullscreen, navigation]);

  useEffect(() => {
    async function initAutoRouting() {
      // Chỉ tự động định tuyến khi người dùng chủ động bấm "Chỉ đường" (có truyền param phòng đích hoặc thời điểm kích hoạt)
      const hasExplicitTarget = Boolean(targetRoomName || targetRoomId || targetRoomCode);
      const hasExplicitStart = Boolean(startRoomName || startRoomId || startRoomCode);

      if (!hasExplicitTarget && !hasExplicitStart && !triggerTime) {
        return;
      }

      try {
        let resolvedTargetRoomName = targetRoomName;
        let resolvedBuildingId = "00b03ef8-7702-4b08-a07e-ec887432453c";

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
        }

        setActiveBuildingId(resolvedBuildingId);

        const { fetchBuildingMap } = require("@/features/navigation/services/map.service");
        const mapData = await fetchBuildingMap(resolvedBuildingId);
        if (!mapData || !mapData.floors) return;

        let foundTarget: RoomOption | null = null;
        let foundStart: RoomOption | null = null;

        if (hasExplicitTarget) {
          foundTarget = findRoomInFloors(
            mapData.floors,
            targetRoomId,
            targetRoomCode,
            resolvedTargetRoomName
          );
        }

        if (hasExplicitStart) {
          foundStart = findRoomInFloors(
            mapData.floors,
            startRoomId,
            startRoomCode,
            startRoomName
          );
        }

        if (foundTarget) {
          setTargetRoom(foundTarget);
          if (foundStart) {
            setStartRoom(foundStart);
            setActiveFloor(foundStart.floorNumber);
          } else {
            setStartRoom(null);
            setRouteData(null);
            setActiveFloor(foundTarget.floorNumber);
          }
        } else if (hasExplicitTarget) {
          showGlobalToast(
            `Không tìm thấy phòng "${stripRoomName(resolvedTargetRoomName || targetRoomName || "")}" trên bản đồ. Vui lòng chọn thủ công!`,
            "error"
          );
        }

        if (foundStart && !foundTarget) {
          setStartRoom(foundStart);
          setActiveFloor(foundStart.floorNumber);
        }
      } catch (err) {
        console.warn("[NavigationScreen] Auto-routing error:", err);
      }
    }

    initAutoRouting();
  }, [
    targetRoomName,
    targetRoomId,
    targetRoomCode,
    startRoomName,
    startRoomId,
    startRoomCode,
    triggerTime,
  ]);

  useEffect(() => {
    async function calculatePath() {
      if (!startRoom || !targetRoom) {
        setRouteData(null);
        return;
      }
      setRouteLoading(true);
      try {
        const route = await fetchRoute(startRoom.id, "ROOM", targetRoom.id, "ROOM");
        if (route) {
          setRouteData(route);
        } else {
          setRouteData(null);
        }
      } catch (error) {
        console.error("Lỗi khi tìm đường đi:", error);
        setRouteData(null);
      } finally {
        setRouteLoading(false);
      }
    }

    calculatePath();
  }, [startRoom, targetRoom]);

  const handleSwapRooms = () => {
    if (!startRoom && !targetRoom) return;
    const temp = startRoom;
    setStartRoom(targetRoom);
    setTargetRoom(temp);
    if (targetRoom) {
      setActiveFloor(targetRoom.floorNumber);
    }
  };

  const handleReset = () => {
    resetNavigation();
  };

  const totalDistance = Math.round(routeData?.totalDistance || routeData?.distance || 0);
  const estimatedMinutes = Math.max(1, Math.round(totalDistance / 40));

  const insets = useSafeAreaInsets();
  const topOffset = isFullscreen
    ? (insets.top > 0 ? insets.top + 12 : 52)
    : (insets.top > 0 ? insets.top + 58 : 96);

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        
        {!isFullscreen && <MapHeader />}

        <MapViewer
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />

        {rawMap?.floors && rawMap.floors.length > 1 && (
          <View style={[styles.floorSwitcher, { top: topOffset }]}>
            {rawMap.floors
              .slice()
              .sort((a, b) => a.floorNumber - b.floorNumber)
              .map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setActiveFloor(f.floorNumber)}
                  style={[
                    styles.floorButton,
                    activeFloor === f.floorNumber ? styles.floorButtonActive : styles.floorButtonInactive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.floorButtonText,
                      activeFloor === f.floorNumber ? styles.floorTextActive : styles.floorTextInactive,
                    ]}
                  >
                    T{f.floorNumber}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        <View style={[styles.kioskCard, { top: topOffset }]}>
          
          <View style={styles.kioskCardHeader}>
            <View style={styles.kioskHeaderLeft}>
              <Ionicons name="navigate-circle" size={18} color="#2563EB" />
              <Text style={styles.kioskHeaderTitle}>Lộ trình di chuyển</Text>
            </View>

            <View style={styles.kioskHeaderActions}>
              <TouchableOpacity
                onPress={() => setIsPanelExpanded(!isPanelExpanded)}
                style={styles.iconBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPanelExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>
              {(startRoom || targetRoom) && (
                <TouchableOpacity onPress={handleReset} style={styles.iconBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isPanelExpanded && (
            <View style={styles.kioskBody}>
              
              <View style={styles.roomSelectRow}>
                <View style={styles.dotStart} />
                <TouchableOpacity
                  onPress={() => setModalType("start")}
                  style={[styles.roomInput, startRoom && styles.roomInputSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roomText, !startRoom && styles.roomTextPlaceholder]} numberOfLines={1}>
                    {startRoom ? `${startRoom.roomLabel} (T${startRoom.floorNumber})` : "Chọn điểm xuất phát..."}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.swapRow}>
                <View style={styles.connectLine} />
                <TouchableOpacity onPress={handleSwapRooms} style={styles.swapBtn} activeOpacity={0.7}>
                  <Ionicons name="swap-vertical" size={14} color="#2563EB" />
                </TouchableOpacity>
              </View>

              <View style={styles.roomSelectRow}>
                <View style={styles.dotDestination} />
                <TouchableOpacity
                  onPress={() => setModalType("target")}
                  style={[styles.roomInput, targetRoom && styles.roomInputDestSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roomText, !targetRoom && styles.roomTextPlaceholder]} numberOfLines={1}>
                    {targetRoom ? `${targetRoom.roomLabel} (T${targetRoom.floorNumber})` : "Chọn điểm đến..."}
                  </Text>
                </TouchableOpacity>
              </View>

              {routeLoading ? (
                <View style={styles.statusLoading}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.statusLoadingText}>Đang tính đường đi tối ưu...</Text>
                </View>
              ) : routeData ? (
                <View style={styles.routeStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="walk" size={16} color="#2563EB" />
                    <Text style={styles.statText}>
                      ~{totalDistance}m • ~{estimatedMinutes} phút
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {selectedRoom && (
          <RoomDetailCard
            room={selectedRoom}
            isFullscreen={isFullscreen}
            onClose={() => {
              setSelectedRoom(null);
              setSelectedNodeId(null);
            }}
            onNavigateTo={(room) => {
              setTargetRoom(room);
              setSelectedRoom(null);
              setSelectedNodeId(null);
            }}
            onSetStart={(room) => {
              setStartRoom(room);
              setSelectedRoom(null);
              setSelectedNodeId(null);
            }}
          />
        )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },
  floorSwitcher: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 30,
    alignItems: "center",
  },
  floorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floorButtonActive: {
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#93C5FD",
  },
  floorButtonInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  floorButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  floorTextActive: {
    color: "#FFFFFF",
  },
  floorTextInactive: {
    color: "#334155",
  },
  kioskCard: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 25,
    width: 250,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  kioskCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  kioskHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kioskHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  kioskHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  kioskBody: {
    paddingTop: 10,
  },
  roomSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  dotDestination: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  roomInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  roomInputSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  roomInputDestSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  roomText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  roomTextPlaceholder: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    marginVertical: 2,
  },
  connectLine: {
    width: 2,
    height: 12,
    backgroundColor: "#CBD5E1",
    marginLeft: 4,
  },
  swapBtn: {
    marginLeft: 14,
    padding: 4,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
  },
  statusLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  statusLoadingText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563EB",
  },
  routeStats: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
});
