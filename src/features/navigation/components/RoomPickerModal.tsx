import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ApiFloor, RoomOption } from "../types/map.types";

interface RoomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  floors: ApiFloor[] | undefined;
  onSelect: (room: RoomOption) => void;
}

export function RoomPickerModal({
  isOpen,
  onClose,
  title,
  floors,
  onSelect,
}: RoomPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const allRooms = useMemo(() => {
    if (!floors) return [];
    const options: RoomOption[] = [];
    floors.forEach((floor) => {
      if (floor.rooms) {
        floor.rooms.forEach((room) => {
          options.push({
            id: room.id,
            roomCode: room.roomCode,
            roomLabel: room.roomLabel,
            floorNumber: floor.floorNumber,
            type: room.type,
          });
        });
      }
    });
    return options;
  }, [floors]);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return allRooms;
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allRooms.filter((r) => {
      const label = r.roomLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const code = r.roomCode.toLowerCase();
      return label.includes(q) || code.includes(q);
    });
  }, [searchQuery, allRooms]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-gray-800 text-[16px] font-extrabold">{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="p-4 bg-gray-50 flex-row items-center px-5 border-b border-gray-100">
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Tìm kiếm phòng khám..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-gray-800 text-sm font-semibold py-1.5"
              autoFocus={true}
            />
          </View>

          <FlatList
            data={filteredRooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-400 text-xs font-semibold">
                  Không tìm thấy phòng khám phù hợp
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                  setSearchQuery("");
                }}
                activeOpacity={0.7}
                className="flex-row items-center px-5 py-3.5 border-b border-gray-50 active:bg-gray-50"
              >
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3">
                  <Ionicons name="business" size={16} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-sm font-bold">{item.roomLabel}</Text>
                  <Text className="text-gray-400 text-[11px] font-semibold mt-0.5">
                    Tầng {item.floorNumber} • Mã phòng: {item.roomCode}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "80%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});
