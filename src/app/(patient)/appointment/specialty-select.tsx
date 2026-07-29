import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { useSpecialties } from "@/features/appointment/hooks/useSpecialties";
import {
  getSpecialtyIcon,
  getSpecialtyColor,
} from "@/features/appointment/utils/specialty-icon.utils";
import { Specialty } from "@/features/appointment/types/specialty.types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding/margins

export default function SpecialtySelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { specialties, isLoading, error, refetch } = useSpecialties();
  const [searchQuery, setSearchQuery] = useState("");

  
  const filteredSpecialties = specialties.filter((item) =>
    item.specialty_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSpecialty = (specialty: Specialty) => {
    console.log(`[SpecialtySelect] Selected specialty, navigating to doctor-list: ${specialty.specialty_name} (${specialty.specialty_id})`);
    router.push({
      pathname: "/(patient)/visit/doctor-list",
      params: {
        specialtyCode: specialty.specialty_code,
        specialtyName: specialty.specialty_name,
        patientId: params.patientId as string || "",
      },
    });
  };

  const renderSpecialtyItem = ({ item }: { item: Specialty }) => {
    const styleTokens = getSpecialtyColor(item.specialty_code);
    const iconName = getSpecialtyIcon(item.specialty_code);

    return (
      <Pressable
        onPress={() => handleSelectSpecialty(item)}
        style={{ width: CARD_WIDTH }}
        className="m-1.5 p-4 rounded-3xl bg-white items-center justify-center border border-gray-100 shadow-sm shadow-black/5 active:opacity-90 active:scale-95"
      >
        {/* Icon Container with dynamic background color */}
        <View
          className={`w-14 h-14 items-center justify-center rounded-2xl mb-3 ${styleTokens.bg}`}
        >
          <Ionicons
            name={iconName}
            size={28}
            color={styleTokens.iconColor}
          />
        </View>

        {/* Specialty Name */}
        <Text
          className="text-gray-800 text-[13px] font-bold text-center mt-1 leading-5 h-10"
          numberOfLines={2}
        >
          {item.specialty_name}
        </Text>

        {/* Specialty Code (Subtle indicator) */}
        <Text className="text-[10px] text-gray-400 font-semibold mt-1">
          {item.specialty_code}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1">
        
        {/* ── 1. HEADER ── */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm active:opacity-75"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={Colors.neutral700}
            />
          </Pressable>
          <Text className="text-gray-800 text-[18px] font-bold">Chọn Chuyên Khoa</Text>
          <View className="w-10" />
        </View>

        {/* ── 2. SEARCH BAR ── */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center bg-white px-4 rounded-2xl border border-gray-100 shadow-sm h-12">
            <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
            <TextInput
              className="flex-1 text-sm text-gray-800 ml-2"
              placeholder="Tìm kiếm chuyên khoa..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} className="p-1 active:opacity-75">
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── 3. CONTENT AREA ── */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-[12px] font-medium mt-3">
              Đang tải danh sách chuyên khoa...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-10">
            <Ionicons
              name="alert-circle"
              size={48}
              color="#EF4444"
            />
            <Text className="text-gray-800 text-[15px] font-bold mt-3 text-center">
              Lỗi tải dữ liệu
            </Text>
            <Text className="text-gray-400 text-[12px] font-medium mt-1 text-center mb-6">
              {error}
            </Text>
            <Pressable
              onPress={refetch}
              className="bg-primary px-6 py-3 rounded-2xl active:opacity-90 shadow-sm"
            >
              <Text className="text-white text-sm font-bold">Thử lại</Text>
            </Pressable>
          </View>
        ) : filteredSpecialties.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Ionicons
              name="search-sharp"
              size={48}
              color="#9CA3AF"
            />
            <Text className="text-gray-800 text-[15px] font-bold mt-3 text-center">
              Không tìm thấy chuyên khoa
            </Text>
            <Text className="text-gray-400 text-[12px] font-medium mt-1 text-center">
              Không có kết quả nào phù hợp với từ khóa "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              data={filteredSpecialties}
              keyExtractor={(item) => item.specialty_id}
              renderItem={renderSpecialtyItem}
              numColumns={2}
              contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

      </View>
    </ScreenWrapper>
  );
}
