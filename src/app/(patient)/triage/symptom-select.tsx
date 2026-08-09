import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  TextInput,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { Colors } from "@/config/colors";
import { StatusBar } from "expo-status-bar";
import { TranslatedSymptomSearchItem } from "@/features/triage/types/triage.types";

export default function SymptomSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const regionId = (params.regionId as string) || "";
  const regionLabelVi = (params.regionLabelVi as string) || "Cơ thể";

  const {
    symptoms,
    selectedSymptomsMap,
    toggleSymptom,
    isLoading,
  } = useTriage();

  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(15);

  
  const selectedSymptoms = useMemo(() => {
    return selectedSymptomsMap[regionId] || [];
  }, [selectedSymptomsMap, regionId]);

  
  useEffect(() => {
    setSearchQuery("");
    setVisibleCount(15);
  }, [regionId]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setVisibleCount(15); 
  };

  
  const filteredSymptoms = useMemo(() => {
    if (!searchQuery.trim()) return symptoms;
    const q = searchQuery.toLowerCase().trim();
    return symptoms.filter(
      (s) =>
        s.labelVi.toLowerCase().includes(q) ||
        s.labelEn.toLowerCase().includes(q)
    );
  }, [symptoms, searchQuery]);

  
  const visibleSymptoms = useMemo(() => {
    return filteredSymptoms.slice(0, visibleCount);
  }, [filteredSymptoms, visibleCount]);

  
  const handleLoadMore = () => {
    if (visibleCount < filteredSymptoms.length) {
      setVisibleCount((prev) => prev + 15);
    }
  };

  const handleToggle = (symptom: TranslatedSymptomSearchItem) => {
    toggleSymptom(regionId, symptom);
  };

  return (
    <ScreenWrapper edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── HEADER ── */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-gray-100"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-gray-800 text-[16px] font-extrabold flex-1 text-center mx-2" numberOfLines={1}>
            Triệu chứng: {regionLabelVi}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-3 py-1.5 bg-[#5B9BD5] rounded-full active:opacity-90 animate-fade-in"
          >
            <Text className="text-white text-[12px] font-bold">
              Xong ({selectedSymptoms.length})
            </Text>
          </Pressable>
        </View>

        {/* ── THANH TÌM KIẾM ── */}
        <View className="px-5 pt-4 pb-2 bg-white">
          <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3">
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-2.5 text-[15px] text-slate-800 p-0"
              placeholder="Tìm kiếm triệu chứng..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => handleSearchChange("")}
                className="p-1 rounded-full active:bg-gray-200"
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ── NỘI DUNG DANH SÁCH ── */}
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-10 bg-white">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-500 text-[14px] font-medium mt-3">
                Đang tải danh sách triệu chứng...
              </Text>
            </View>
          ) : symptoms.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10 bg-white px-5">
              <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
              <Text className="text-gray-400 text-[15px] font-semibold text-center mt-2">
                Không tìm thấy triệu chứng cho vùng này.
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibleSymptoms}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
              className="bg-white flex-1"
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.2}
              ListEmptyComponent={
                <View className="items-center justify-center py-10">
                  <Ionicons name="search-outline" size={48} color="#94A3B8" />
                  <Text className="text-gray-400 text-[15px] font-semibold text-center mt-2">
                    Không tìm thấy triệu chứng phù hợp.
                  </Text>
                </View>
              }
              renderItem={({ item: symptom }) => {
                const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);

                const textClassName = isSelected
                  ? "text-[15px] font-semibold text-[#547FB8]"
                  : "text-[15px] font-medium text-slate-700";

                const checkboxClassName = isSelected
                  ? "w-5 h-5 rounded-[6px] border border-[#84AFEB] bg-[#84AFEB] items-center justify-center"
                  : "w-5 h-5 rounded-[6px] border border-slate-300 items-center justify-center";

                return (
                  <Pressable
                    onPress={() => handleToggle(symptom)}
                    className="p-4 rounded-[16px] border flex-row items-center justify-between mb-3"
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
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View className="flex-1 pr-3">
                      <Text className={textClassName}>
                        {symptom.labelVi}
                      </Text>
                    </View>
                    <View className={checkboxClassName}>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
