import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationStore } from "../store/useNavigationStore";
import { RoomOption } from "../types/map.types";

interface RoomDetailCardProps {
  room: RoomOption;
  onClose: () => void;
  onNavigateTo: (room: RoomOption) => void;
  onSetStart: (room: RoomOption) => void;
  isFullscreen?: boolean;
}

export function RoomDetailCard({
  room,
  onClose,
  onNavigateTo,
  onSetStart,
  isFullscreen = false,
}: RoomDetailCardProps) {
  const insets = useSafeAreaInsets();
  const startRoom = useNavigationStore((s) => s.startRoom);
  const targetRoom = useNavigationStore((s) => s.targetRoom);

  const isCurrentStart = startRoom?.id === room.id;
  const isCurrentTarget = targetRoom?.id === room.id;

  const bottomOffset = isFullscreen
    ? (insets.bottom > 0 ? insets.bottom + 12 : 20)
    : (insets.bottom > 0 ? insets.bottom + 74 : 88);

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      
      <View style={styles.headerRow}>
        <View style={styles.roomBadgeContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={17} color="#2563EB" />
          </View>
          <View style={styles.titleColumn}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {room.roomLabel}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.tagCode}>
                <Text style={styles.tagCodeText}>{room.roomCode || "PHÒNG"}</Text>
              </View>
              <Text style={styles.tagFloorText}>• Tầng {room.floorNumber}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        
        {/* Nút Điểm đến */}
        <TouchableOpacity
          onPress={() => onNavigateTo(room)}
          style={[styles.primaryActionBtn, isCurrentTarget && styles.targetActiveBtn]}
          activeOpacity={0.8}
        >
          <Ionicons name="flag" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.primaryActionText}>
            {isCurrentTarget ? "Điểm kết thúc" : "Điểm đến"}
          </Text>
        </TouchableOpacity>

        {/* Nút Điểm đi */}
        <TouchableOpacity
          onPress={() => onSetStart(room)}
          style={[styles.secondaryActionBtn, isCurrentStart && styles.secondaryActiveBtn]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="location"
            size={14}
            color={isCurrentStart ? "#15803D" : "#475569"}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.secondaryActionText, isCurrentStart && styles.secondaryActiveText]}>
            {isCurrentStart ? "Điểm xuất phát" : "Điểm đi"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  roomBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  titleColumn: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  tagCode: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  tagCodeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  tagFloorText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1.1,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  targetActiveBtn: {
    backgroundColor: "#1D4ED8",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActiveBtn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  secondaryActionText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  secondaryActiveText: {
    color: "#15803D",
  },
});
