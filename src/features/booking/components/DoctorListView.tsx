import { Colors } from "@/config/colors";
import { useDoctorList } from "@/features/booking/hooks/useDoctorList";
import { Doctor } from "@/features/booking/types/doctor.types";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function DoctorListView() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const specialtyCode = (params.specialtyCode as string) || "SP_1";
  const specialtyName = (params.specialtyName as string) || "Chuyên khoa";

  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dateNum = String(d.getDate()).padStart(2, "0");

      const fullDate = `${year}-${month}-${dateNum}`;
      const day = String(d.getDate());

      const dayOfWeek = d.getDay();
      const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const label = labels[dayOfWeek];

      const labelExtra = i === 0 ? "Hôm nay" : `${dateNum}/${month}`;

      options.push({
        label,
        day,
        fullDate,
        labelExtra,
      });
    }
    return options;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0].fullDate);

  const { doctors, isLoading, error } = useDoctorList(specialtyCode, selectedDate);

  const getInitials = (fullName?: string): string => {
    if (!fullName) return "DR";
    const cleanName = fullName.replace(/^(BS\.|BS|PGS\.|PGS|TS\.|TS|ThS\.|ThS)\s+/i, "");
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length === 0) return "DR";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0];
    const last = parts[parts.length - 1];
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    const doctorName = doctor.full_name || doctor.account?.user_name || "Bác sĩ";
    router.push({
      pathname: "/(patient)/triage/doctor-slots",
      params: {
        doctorId: doctor.staff_id,
        doctorName: doctorName,
        specialtyName: doctor.specialty?.specialty_name || "Chuyên khoa",
        selectedDate: selectedDate,
        licenseNumber: doctor.license_number || "",
        experienceYears: (doctor.experience_years ?? 0).toString(),
        patientId: (params.patientId as string) || "",
        patientName: (params.patientName as string) || "",
      },
    });
  };

  const renderDoctorItem = ({ item }: { item: Doctor }) => {
    const doctorName = item.full_name || item.account?.user_name || "Bác sĩ";
    const initials = getInitials(doctorName);

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
            {doctorName}
          </Text>

          {/* Chuyên khoa */}
          <Text className="text-gray-500 text-[12px] font-medium mt-1">
            {item.specialty?.specialty_name || "Chuyên khoa"}
          </Text>

          {/* Kinh nghiệm */}
          <View className="flex-row items-center mt-2.5 pt-2.5 border-t border-gray-50">
            <Ionicons
              name="time-outline"
              size={12}
              color="#9CA3AF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-gray-400 text-[11px] font-medium">
              Kinh nghiệm: {item.experience_years ?? 0} năm
            </Text>
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
            <Ionicons
              name="chevron-back"
              size={20}
              color={Colors.neutral700}
            />
          </Pressable>
          <Text className="text-gray-800 text-[17px] font-bold">Chọn bác sĩ</Text>
          <View className="w-10" />
        </View>

        {/* ── Chuyên khoa hiện tại ── */}
        <View className="bg-primary/10 mx-5 my-2 p-3 rounded-[16px] border border-primary/20 flex-row items-center">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
              <Ionicons
                name="heart-outline"
                size={16}
                color={Colors.neutral700}
              />
            </View>
            <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                Chuyên khoa
              </Text>
              <Text className="text-gray-800 text-[14px] font-extrabold">
                {specialtyName}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. CHỌN NGÀY (DATE SELECTOR) ── */}
        <View className="mt-3">
          <Text className="text-gray-800 text-[14px] font-bold px-5 mb-2.5">Chọn ngày khám</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, flexDirection: "row" }}
          >
            {dateOptions.map((date) => {
              const isSelected = selectedDate === date.fullDate;
              return (
                <TouchableOpacity
                  key={`${isSelected ? "active" : "inactive"}-${date.fullDate}`}
                  onPress={() => setSelectedDate(date.fullDate)}
                  activeOpacity={0.8}
                  className={`w-14 py-3.5 rounded-[20px] items-center border ${isSelected
                    ? "bg-primary border-primary shadow-sm"
                    : "bg-white border-gray-100"
                    }`}
                >
                  <Text
                    className={`text-[11px] font-semibold mb-1 ${isSelected ? "text-white" : "text-gray-400"
                      }`}
                  >
                    {date.label}
                  </Text>
                  <Text
                    className={`text-[16px] font-bold ${isSelected ? "text-white" : "text-gray-800"
                      }`}
                  >
                    {date.day}
                  </Text>
                  <Text
                    className="text-[8px] font-medium mt-1"
                    style={{ color: isSelected ? "rgba(255, 255, 255, 0.8)" : "#9CA3AF" }}
                  >
                    {date.labelExtra}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
            <Ionicons
              name="alert-circle"
              size={40}
              color="#EF4444"
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
            <Ionicons
              name="alert-circle"
              size={40}
              color="#9CA3AF"
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
            data={doctors}
            keyExtractor={(item) => item.staff_id}
            renderItem={renderDoctorItem}
            contentContainerStyle={{ paddingBottom: 30, paddingTop: 12 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
