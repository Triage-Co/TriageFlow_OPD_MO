import { BodyMap } from "@/features/body-map/BodyMap";
import { BodyRegion, BodyGender } from "@/features/body-map/types";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from "react-native";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { Colors } from "@/config/colors";
import { TranslatedSymptomSearchItem } from "@/features/triage/types/triage.types";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { patientService } from "@/features/patient/services/patient.service";
import { calculateAgeFromDob } from "@/shared/utils/date.utils";
import { Patient } from "@/features/patient/types/patient.types";
import { AppAlert } from "@/shared/utils/alert.utils";

export function BodyMapView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientId = params.patientId as string | undefined;

  const { user } = useAuthContext();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [inputText, setInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

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

  const gender: BodyGender = selectedPatient
    ? (selectedPatient.gender?.toLowerCase() === "female" ? "female" : "male")
    : (user?.gender?.toLowerCase() === "female" ? "female" : "male");

  const age = selectedPatient?.dob ? calculateAgeFromDob(selectedPatient.dob) : 30;

  const {
    selectedSymptomsMap,
    toggleSymptom,
    getAllSelectedSymptoms,
    startDiagnosisSession,
    parseAndAddSymptoms,
    isLoading,
    error,
    searchSymptomsByRegion,
  } = useTriage();

  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);

  const handleSelectRegion = (region: BodyRegion) => {
    setSelectedRegion(region);

    searchSymptomsByRegion({
      bodyPartId: region.id,
      gender,
      age,
      searchPhrase: region.name || "",
      fallbackSearchPhrases: region.fallbackSearchPhrases,
    });

    router.push({
      pathname: "/(patient)/triage/symptom-select",
      params: {
        regionId: region.id,
        regionLabelVi: region.labelVi || region.name || "",
      },
    });
  };

  const handleParseSubmit = async () => {
    if (!inputText.trim() || isParsing) return;
    Keyboard.dismiss();
    setIsParsing(true);
    try {
      const result = await parseAndAddSymptoms({
        text: inputText.trim(),
        gender,
        age,
      });

      if (result.addedCount > 0) {
        setInputText("");
      } else {
        AppAlert.info(
          "Không tìm thấy triệu chứng y khoa tương ứng từ mô tả này. Bạn hãy thử gõ rõ ràng hơn hoặc chọn trực tiếp trên mô hình cơ thể nhé!",
          "Gợi ý mô tả"
        );
      }
    } catch (e) {
      console.error("[BodyMapView] Lỗi khi parse:", e);
    } finally {
      setIsParsing(false);
    }
  };

  const allSelected = getAllSelectedSymptoms();
  const hasAnySelected = allSelected.length > 0;

  const handleNext = async () => {
    if (hasAnySelected && !isLoading) {
      await startDiagnosisSession(patientId);
    }
  };

  const handleRemoveSymptom = (symptom: TranslatedSymptomSearchItem) => {
    for (const [regionId, symptomsList] of Object.entries(selectedSymptomsMap)) {
      if (symptomsList.some((s) => s.id === symptom.id)) {
        toggleSymptom(regionId, symptom);
        break;
      }
    }
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1">
        
        {/* Top Header */}
        <View className="bg-primary px-5 pt-12 pb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
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
                Chọn triệu chứng khám
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

          <View className="mt-1">
            <Text className="text-white/80 text-[11px] font-semibold">
              Bước 1/3
            </Text>
            <View className="h-[3px] bg-white/25 w-full rounded-full mt-1.5 relative overflow-hidden">
              <View className="h-full bg-white w-1/3 rounded-full absolute left-0 top-0" />
            </View>
          </View>
        </View>

        <View className="flex-1 px-4 pt-3 pb-2">
          {error && (
            <View className="bg-red-50 border border-red-200 p-3 rounded-[12px] mb-2.5 flex-row items-center gap-2">
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

          {/* Ô Input Nhập mô tả triệu chứng tự do / AI NLP Parse */}
          <View className="bg-white rounded-2xl px-3.5 py-2 mb-2.5 border border-gray-200/80 flex-row items-center gap-2.5 shadow-sm">
            <Ionicons name="sparkles" size={17} color={Colors.primary} />
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Mô tả triệu chứng (VD: Sốt cao, đau đầu...)"
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              onSubmitEditing={handleParseSubmit}
              className="flex-1 text-[13px] text-gray-900 font-medium py-1"
            />
            {isParsing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : inputText.trim().length > 0 ? (
              <TouchableOpacity
                onPress={handleParseSubmit}
                className="bg-primary px-3 py-1.5 rounded-xl flex-row items-center gap-1 active:opacity-80"
              >
                <Text className="text-white text-xs font-bold">Phân tích</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Body Map Card - Chiếm trọn không gian linh hoạt flex-1 */}
          <View className="flex-1 bg-white rounded-[24px] py-2 px-2 items-center justify-center shadow-sm border border-gray-100/80">
            <BodyMap
              gender={gender}
              selectedRegionId={selectedRegion?.id}
              onSelectRegion={handleSelectRegion}
            />
          </View>

          {/* Danh sách triệu chứng đã chọn gắn liền mạch phía dưới */}
          {hasAnySelected && (
            <View className="mt-2.5 max-h-36">
              <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                Triệu chứng đã chọn ({allSelected.length})
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 4 }}
              >
                <View className="flex-row flex-wrap gap-2">
                  {allSelected.map((symptom) => (
                    <Pressable
                      key={symptom.id}
                      onPress={() => handleRemoveSymptom(symptom)}
                      className="flex-row items-center bg-[#84AFEB]/15 border border-[#84AFEB]/40 rounded-[12px] px-3 py-1.5 gap-1.5 active:opacity-70"
                    >
                      <Text className="text-[#1E3A8A] text-[12px] font-bold">
                        {symptom.labelVi || symptom.labelEn}
                      </Text>
                      <View className="w-4 h-4 rounded-full bg-[#84AFEB]/25 items-center justify-center">
                        <SymbolView
                          name={{ ios: "xmark", android: "close" }}
                          size={8}
                          tintColor="#1E3A8A"
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}
