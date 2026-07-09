import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { useDoctorList } from "@/features/booking/hooks/useDoctorList";
import { Doctor } from "@/features/booking/types/doctor.types";

export default function DoctorListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Cưỡng bức sử dụng SP_4 và Ngoại tổng quát để test dữ liệu thực tế như yêu cầu
  const specialtyCode = "SP_4";
  const specialtyName = "Ngoại tổng quát";

  // Mặc định ngày 2026-07-09 có dữ liệu
  const [selectedDate, setSelectedDate] = useState("2026-07-09");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const { doctors, isLoading, error } = useDoctorList(specialtyCode, selectedDate);

  // Danh sách các ngày chọn
  const dateOptions = [
    { label: "T2", day: "6", fullDate: "2026-07-06", labelExtra: "06/07" },
    { label: "T3", day: "7", fullDate: "2026-07-07", labelExtra: "07/07" },
    { label: "T4", day: "8", fullDate: "2026-07-08", labelExtra: "Hôm nay" },
    { label: "T5", day: "9", fullDate: "2026-07-09", labelExtra: "09/07" },
    { label: "T6", day: "10", fullDate: "2026-07-10", labelExtra: "10/07" },
    { label: "T7", day: "11", fullDate: "2026-07-11", labelExtra: "11/07" },
    { label: "CN", day: "12", fullDate: "2026-07-12", labelExtra: "12/07" },
  ];

  // Trích xuất chữ cái viết tắt tên bác sĩ
  const getInitials = (fullName: string): string => {
    const cleanName = fullName.replace(/^(BS\.|BS|PGS\.|PGS|TS\.|TS|ThS\.|ThS)\s+/i, "");
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length === 0) return "DR";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0];
    const last = parts[parts.length - 1];
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    router.push({
      pathname: "/(patient)/visit/doctor-slots",
      params: {
        doctorId: doctor.staff_id,
        doctorName: doctor.account.full_name,
        specialtyName: doctor.specialty.specialty_name,
        selectedDate: selectedDate,
        licenseNumber: doctor.license_number,
        experienceYears: doctor.experience_years.toString(),
      },
    });
  };

  const renderDoctorItem = ({ item }: { item: Doctor }) => {
    const initials = getInitials(item.account.full_name);

    return (
      <Pressable
        onPress={() => handleSelectDoctor(item)}
        className="mx-5 mb-4 bg-white rounded-[24px] p-4 flex-row items-center border border-gray-100 shadow-sm active:opacity-90"
      >
        {/* Avatar tròn với tên viết tắt */}
        <View className="w-14 h-14 rounded-full bg-[#84AFEB]/20 items-center justify-center mr-4">
          <Text className="text-primary text-[16px] font-bold">{initials}</Text>
        </View>

        {/* Thông tin chi tiết */}
        <View className="flex-1">
          {/* Tên bác sĩ */}
          <Text className="text-gray-800 text-[15px] font-bold">
            {item.account.full_name}
          </Text>

          {/* Chuyên khoa */}
          <Text className="text-gray-500 text-[12px] font-medium mt-1">
            {item.specialty.specialty_name}
          </Text>

          {/* Nơi làm việc & Kinh nghiệm */}
          <View className="flex-row items-center mt-2.5 pt-2.5 border-t border-gray-50">
            <View className="flex-row items-center mr-4 flex-1">
              <SymbolView
                name="doc.text.fill"
                size={11}
                tintColor="#9CA3AF"
                style={{ marginRight: 4 }}
              />
              <Text className="text-gray-400 text-[11px] font-medium" numberOfLines={1}>
                Số CCHN: {item.license_number}
              </Text>
            </View>
            <View className="flex-row items-center">
              <SymbolView
                name="clock.fill"
                size={11}
                tintColor="#9CA3AF"
                style={{ marginRight: 4 }}
              />
              <Text className="text-gray-400 text-[11px] font-medium">
                {item.experience_years} năm KN
              </Text>
            </View>
          </View>
        </View>
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
            <SymbolView
              name="chevron.left"
              size={18}
              tintColor={Colors.neutral700}
            />
          </Pressable>
          <Text className="text-gray-800 text-[17px] font-bold">Chọn bác sĩ</Text>
          <View className="w-10" />
        </View>

        {/* ── Chuyên khoa hiện tại ── */}
        <View className="bg-primary/10 mx-5 my-2 p-3 rounded-[16px] border border-primary/20 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
              <SymbolView
                name="heart.text.square.fill"
                size={14}
                tintColor={Colors.neutral700}
              />
            </View>
            <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                Chuyên khoa chẩn đoán
              </Text>
              <Text className="text-gray-800 text-[14px] font-extrabold">
                {specialtyName}
              </Text>
            </View>
          </View>
          <View className="bg-primary/25 px-2.5 py-1 rounded-full">
            <Text className="text-primary text-[10px] font-bold">{specialtyCode}</Text>
          </View>
        </View>

        {/* ── 2. CHỌN NGÀY (DATE SELECTOR) ── */}
        <View className="mt-3">
          <Text className="text-gray-800 text-[14px] font-bold px-5 mb-2.5">Chọn ngày khám</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            className="flex-row"
          >
            {dateOptions.map((date) => {
              const isSelected = selectedDate === date.fullDate;
              return (
                <Pressable
                  key={date.fullDate}
                  onPress={() => setSelectedDate(date.fullDate)}
                  className={`w-14 py-3.5 rounded-[20px] items-center border ${
                    isSelected
                      ? "bg-primary border-primary shadow-sm"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold mb-1 ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {date.label}
                  </Text>
                  <Text
                    className={`text-[16px] font-bold ${
                      isSelected ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {date.day}
                  </Text>
                  <Text
                    className={`text-[8px] font-medium mt-1 ${
                      isSelected ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    {date.labelExtra}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 3. FILTER PILLS ── */}
        <View className="flex-row px-5 mt-5 mb-4 gap-2">
          <Pressable
            onPress={() => setSelectedFilter("all")}
            className={`px-4 py-2 rounded-full border ${
              selectedFilter === "all"
                ? "bg-primary border-primary"
                : "bg-white border-gray-100"
            }`}
          >
            <Text
              className={`text-[12px] font-bold ${
                selectedFilter === "all" ? "text-white" : "text-gray-500"
              }`}
            >
              Tất cả
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedFilter("high-rating")}
            className={`px-4 py-2 rounded-full border ${
              selectedFilter === "high-rating"
                ? "bg-primary border-primary"
                : "bg-white border-gray-100"
            }`}
          >
            <Text
              className={`text-[12px] font-bold ${
                selectedFilter === "high-rating" ? "text-white" : "text-gray-500"
              }`}
            >
              Đánh giá cao
            </Text>
          </Pressable>
        </View>

        {/* ── 4. DANH SÁCH BÁC SĨ ── */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-[12px] font-medium mt-3">
              Đang tìm kiếm bác sĩ trực ngày {selectedDate}...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-10">
            <SymbolView
              name="exclamationmark.circle.fill"
              size={36}
              tintColor="#EF4444"
            />
            <Text className="text-gray-800 text-[14px] font-bold mt-3 text-center">
              Lỗi tải dữ liệu
            </Text>
            <Text className="text-gray-400 text-[12px] font-medium mt-1 text-center">
              {error}
            </Text>
          </View>
        ) : doctors.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <SymbolView
              name="person.crop.circle.badge.exclamationmark"
              size={36}
              tintColor="#9CA3AF"
            />
            <Text className="text-gray-800 text-[14px] font-bold mt-3 text-center">
              Không có bác sĩ trực
            </Text>
            <Text className="text-gray-400 text-[12px] font-medium mt-1 text-center">
              Không tìm thấy lịch trực của bác sĩ thuộc chuyên khoa này vào ngày {selectedDate}. Vui lòng chọn ngày khác (Thử chọn T5 ngày 9).
            </Text>
          </View>
        ) : (
          <FlatList
            data={
              selectedFilter === "high-rating"
                ? doctors.filter((doc) => doc.experience_years >= 10)
                : doctors
            }
            keyExtractor={(item) => item.staff_id}
            renderItem={renderDoctorItem}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
