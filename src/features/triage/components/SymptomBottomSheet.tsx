import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, TextInput } from "react-native";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { TranslatedSymptomSearchItem } from "@/features/triage/types/triage.types";
import { SymbolView } from "expo-symbols";
import { Colors } from "@/config/colors";

type SymptomBottomSheetProps = {
  visible: boolean;
  regionId: string;
  regionLabelVi: string;
  symptoms: TranslatedSymptomSearchItem[];
  isLoading: boolean;
  selectedSymptoms: TranslatedSymptomSearchItem[];
  onToggleSymptom: (symptom: TranslatedSymptomSearchItem) => void;
  onClose: () => void;
};

export function SymptomBottomSheet({
  visible,
  regionId,
  regionLabelVi,
  symptoms,
  isLoading,
  selectedSymptoms,
  onToggleSymptom,
  onClose,
}: SymptomBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%"], []);

  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      console.log(`[BottomSheet] Bottom Sheet opened for: ${regionId}`);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, regionId]);

  // Reset tìm kiếm và số lượng hiển thị khi đổi vùng hoặc khi ẩn/hiện Bottom Sheet
  useEffect(() => {
    setSearchQuery("");
    setVisibleCount(5);
  }, [regionId, visible]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setVisibleCount(5); // Reset về 5 khi thay đổi từ khóa
  };

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      onClose();
    }
  };

  // 1. Lọc triệu chứng dựa trên từ khóa tìm kiếm
  const filteredSymptoms = useMemo(() => {
    if (!searchQuery.trim()) return symptoms;
    const q = searchQuery.toLowerCase().trim();
    return symptoms.filter(
      (s) =>
        s.labelVi.toLowerCase().includes(q) ||
        s.labelEn.toLowerCase().includes(q)
    );
  }, [symptoms, searchQuery]);

  // 2. Cắt danh sách để hiển thị phân trang (ban đầu 5 cái)
  const visibleSymptoms = useMemo(() => {
    return filteredSymptoms.slice(0, visibleCount);
  }, [filteredSymptoms, visibleCount]);

  // 3. Tải thêm khi lướt xuống cuối
  const handleLoadMore = () => {
    if (visibleCount < filteredSymptoms.length) {
      console.log(`[BottomSheet] Loading more symptoms. Current: ${visibleCount}/${filteredSymptoms.length}`);
      setVisibleCount((prev) => prev + 5);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View className="flex-1 px-5 pt-2 pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <Text className="text-gray-800 text-[16px] font-bold">
            Triệu chứng: {regionLabelVi || "Cơ thể"}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            className="p-1.5 bg-gray-100 rounded-full"
          >
            <SymbolView
              name={{ ios: "xmark", android: "close" }}
              size={18}
              tintColor="#64748B"
            />
          </Pressable>
        </View>

        {/* Thanh tìm kiếm triệu chứng */}
        {!isLoading && symptoms.length > 0 && (
          <View className="flex-row items-center bg-slate-100 rounded-xl px-3 py-2.5 mb-3.5">
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search" }}
              size={16}
              tintColor="#94A3B8"
            />
            <TextInput
              className="flex-1 ml-2 text-[14px] text-slate-800 p-0"
              placeholder="Tìm kiếm triệu chứng..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearchChange("")} className="p-1">
                <SymbolView
                  name={{ ios: "xmark.circle.fill", android: "cancel" }}
                  size={16}
                  tintColor="#94A3B8"
                />
              </Pressable>
            )}
          </View>
        )}

        {/* Nội dung danh sách triệu chứng */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-500 text-[13px] font-medium mt-3">
              Đang tải danh sách triệu chứng...
            </Text>
          </View>
        ) : symptoms.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-400 text-[14px] font-medium text-center">
              Không tìm thấy triệu chứng cho vùng này.
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={visibleSymptoms}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.15}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-400 text-[14px] font-medium text-center">
                  Không tìm thấy triệu chứng phù hợp.
                </Text>
              </View>
            }
            renderItem={({ item: symptom }) => {
              const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);

              const textClassName = isSelected
                ? "text-[14px] font-semibold text-[#547FB8]"
                : "text-[14px] font-semibold text-slate-800";

              const checkboxClassName = isSelected
                ? "w-[18px] h-[18px] rounded-[4px] border border-[#84AFEB] bg-[#84AFEB] items-center justify-center"
                : "w-[18px] h-[18px] rounded-[4px] border border-slate-300 items-center justify-center";

              return (
                <Pressable
                  onPress={() => onToggleSymptom(symptom)}
                  className="p-4 rounded-[16px] border flex-row items-center justify-between mb-2.5"
                  style={({ pressed }) => [
                    isSelected
                      ? {
                          borderColor: "#84AFEB",
                          backgroundColor: "rgba(132, 175, 235, 0.05)",
                          shadowColor: "#84AFEB",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      : {
                          borderColor: "#F1F5F9",
                          backgroundColor: "#FFFFFF",
                        },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <View className="flex-1 pr-3">
                    <Text className={textClassName}>
                      {symptom.labelVi}
                    </Text>
                  </View>
                  <View className={checkboxClassName}>
                    {isSelected && (
                      <SymbolView
                        name={{ ios: "checkmark", android: "check" }}
                        size={12}
                        tintColor="#FFFFFF"
                      />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </BottomSheet>
  );
}
