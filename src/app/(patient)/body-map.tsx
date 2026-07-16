import { BodyMap } from "@/features/body-map/BodyMap";
import { BodyRegion } from "@/features/body-map/types";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  useWindowDimensions,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { SymptomBottomSheet } from "@/features/triage/components/SymptomBottomSheet";
import { Colors } from "@/config/colors";
import { TranslatedSymptomSearchItem } from "@/features/triage/types/triage.types";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { patientService } from "@/features/patient/services/patient.service";
import { calculateAgeFromDob } from "@/shared/utils/date.utils";
import { Patient } from "@/features/patient/types/patient.types";

export default function BodyMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientId = params.patientId as string | undefined;
  
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuthContext();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (patientId) {
      patientService.getPatientById(patientId).then(res => {
        if (res?.data) {
          setSelectedPatient(res.data);
        }
      }).catch(err => {
        console.log("[BodyMap] Lỗi khi lấy chi tiết bệnh nhân:", err);
      });
    }
  }, [patientId]);

  const gender = selectedPatient
    ? (selectedPatient.gender?.toLowerCase() === "female" ? "female" : "male")
    : (user?.gender?.toLowerCase() === "female" ? "female" : "male");

  const age = selectedPatient?.dob ? calculateAgeFromDob(selectedPatient.dob) : 30;

  // Context của Triage
  const {
    selectedSymptomsMap,
    toggleSymptom,
    getAllSelectedSymptoms,
    startDiagnosisSession,
    isLoading,
    error,
    symptoms,
    searchSymptomsByRegion,
  } = useTriage();

  // State cục bộ cho Bottom Sheet
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const handleSelectRegion = (region: BodyRegion) => {
    setSelectedRegion(region);
    setIsBottomSheetOpen(true);

    // Chỉ khi người dùng chọn vùng mới gọi API/local để lấy triệu chứng
    searchSymptomsByRegion({
      bodyPartId: region.id,
      gender,
      age,
      searchPhrase: region.name || "",
      fallbackSearchPhrases: region.fallbackSearchPhrases,
    });
  };

  const allSelected = getAllSelectedSymptoms();
  const hasAnySelected = allSelected.length > 0;

  const handleNext = async () => {
    if (hasAnySelected && !isLoading) {
      await startDiagnosisSession(patientId);
    }
  };

  // Bỏ chọn một triệu chứng từ tag list
  const handleRemoveSymptom = (symptom: TranslatedSymptomSearchItem) => {
    // Tìm regionId của triệu chứng này trong map
    for (const [regionId, symptomsList] of Object.entries(selectedSymptomsMap)) {
      if (symptomsList.some((s) => s.id === symptom.id)) {
        toggleSymptom(regionId, symptom);
        break;
      }
    }
  };

  const cardHeight = Math.min(windowHeight * 0.52, 420);

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <View className="flex-1 justify-between">

        {/* ── 1. HEADER PHÂN LOẠI AI ── */}
        <View className="bg-primary px-5 pt-12 pb-5 shadow-sm">
          {/* Hàng nút quay lại + Tiêu đề + Nút Tiếp tục */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                className="p-2"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <SymbolView
                  name={{ ios: "chevron.left", android: "arrow_back" }}
                  size={28}
                  tintColor="#FFFFFF"
                />
              </TouchableOpacity>
              <Text className="text-white text-[16px] font-bold">
                Chọn vùng đau
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!hasAnySelected || isLoading}
              activeOpacity={0.9}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: hasAnySelected && !isLoading ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isLoading && (
                <ActivityIndicator size="small" color={Colors.primary} />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: hasAnySelected && !isLoading ? Colors.primary : "rgba(255,255,255,0.6)",
                }}
              >
                {isLoading
                  ? "Đang xử lý..."
                  : `Tiếp tục${hasAnySelected ? ` (${allSelected.length})` : ""}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thanh Tiến trình (Bước 1/3) */}
          <View className="mt-1">
            <Text className="text-white/80 text-[11px] font-semibold">
              Bước 1/3
            </Text>
            <View className="h-[3px] bg-white/25 w-full rounded-full mt-1.5 relative overflow-hidden">
              <View className="h-full bg-white w-1/3 rounded-full absolute left-0 top-0" />
            </View>
          </View>
        </View>

        {/* ── 2. NỘI DUNG CHÍNH ── */}
        <View className="flex-1 px-5 mt-4">
          {/* Thông báo lỗi nếu có */}
          {error && (
            <View className="bg-red-50 border border-red-200 p-3 rounded-[12px] mb-3 flex-row items-center gap-2">
              <SymbolView
                name={{ ios: "exclamationmark.triangle.fill", android: "warning" }}
                size={16}
                tintColor="#EF4444"
              />
              <Text className="text-red-600 text-[12px] font-semibold flex-1">
                {error}
              </Text>
            </View>
          )}

          {/* Card trắng chứa Body Map SVG */}
          <View
            style={{ height: cardHeight }}
            className="bg-white rounded-[20px] py-3 items-center justify-center shadow shadow-black/5 border border-white/50"
          >
            <Text className="text-gray-500 text-[12px] font-medium text-center mb-2">
              Nhấn vào vùng cơ thể bạn đang cảm thấy khó chịu
            </Text>
            <BodyMap
              gender={gender}
              selectedRegionId={selectedRegion?.id}
              onSelectRegion={handleSelectRegion}
            />
          </View>

          {/* ── 3. DANH SÁCH TRIỆU CHỨNG ĐÃ CHỌN ── */}
          <View className="mt-4 flex-1">
            {hasAnySelected ? (
              <View className="flex-1">
                <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  Triệu chứng đã chọn ({allSelected.length})
                </Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 16 }}
                >
                  <View className="flex-row flex-wrap gap-2">
                    {allSelected.map((symptom) => (
                      <Pressable
                        key={symptom.id}
                        onPress={() => handleRemoveSymptom(symptom)}
                        className="flex-row items-center bg-[#84AFEB]/10 border border-[#84AFEB]/30 rounded-[12px] px-3 py-1.5 gap-1.5 active:opacity-70"
                      >
                        <Text className="text-[#3E5C8A] text-[12px] font-semibold">
                          {symptom.labelVi}
                        </Text>
                        <View className="w-3.5 h-3.5 rounded-full bg-[#84AFEB]/20 items-center justify-center">
                          <SymbolView
                            name={{ ios: "xmark", android: "close" }}
                            size={7}
                            tintColor="#3E5C8A"
                          />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View className="bg-[#84AFEB]/5 rounded-[16px] px-4 py-4 border border-[#84AFEB]/10 items-center justify-center">
                <Text className="text-[#547FB8] text-[12px] font-semibold text-center">
                  Nhấn vào các vùng cơ thể để bắt đầu chọn triệu chứng
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── 4. BOTTOM SHEET HIỂN THỊ TRIỆU CHỨNG ── */}
      {selectedRegion && (
        <SymptomBottomSheet
          visible={isBottomSheetOpen}
          regionId={selectedRegion.id}
          regionLabelVi={selectedRegion.labelVi || selectedRegion.name || ""}
          symptoms={symptoms}
          isLoading={isLoading}
          selectedSymptoms={selectedSymptomsMap[selectedRegion.id] || []}
          onToggleSymptom={(symptom) => toggleSymptom(selectedRegion.id, symptom)}
          onClose={() => setIsBottomSheetOpen(false)}
        />
      )}
    </ScreenWrapper>
  );
}
