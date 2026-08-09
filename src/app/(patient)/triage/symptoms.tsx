import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { TranslatedSymptomSearchItem } from "@/features/triage/types/triage.types";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { BodyGender } from "@/features/body-map/types";

export default function SymptomsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    regionId: string;
    labelVi: string;
    labelEn: string;
    searchPhrase: string;
    fallbackSearchPhrases?: string;
    gender?: string;
  }>();

  const {
    symptoms,
    isLoading,
    error,
    searchSymptomsByRegion,
    toggleSymptom,
    startDiagnosisSession,
  } = useTriage();

  const [selectedSymptom, setSelectedSymptom] = useState<TranslatedSymptomSearchItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.searchPhrase && params.regionId) {
      let fallbackSearchPhrases: string[] = [];
      try {
        if (params.fallbackSearchPhrases) {
          fallbackSearchPhrases = JSON.parse(params.fallbackSearchPhrases);
        }
      } catch (e) {
        console.error("Lỗi khi parse fallbackSearchPhrases:", e);
      }

      
      searchSymptomsByRegion({
        bodyPartId: params.regionId,
        gender: (params.gender as BodyGender) || "male",
        age: 30,
        searchPhrase: params.searchPhrase,
        fallbackSearchPhrases,
      });
    }
  }, [params.searchPhrase, params.regionId, params.gender]);

  const handleSymptomSelect = (symptom: TranslatedSymptomSearchItem) => {
    setSelectedSymptom(symptom);
  };

  const handleNext = async () => {
    if (selectedSymptom) {
      setIsSubmitting(true);
      try {
        
        toggleSymptom(params.regionId || "default", selectedSymptom);
        await startDiagnosisSession();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRetry = () => {
    if (params.searchPhrase && params.regionId) {
      let fallbackSearchPhrases: string[] = [];
      try {
        if (params.fallbackSearchPhrases) {
          fallbackSearchPhrases = JSON.parse(params.fallbackSearchPhrases);
        }
      } catch (e) {
        console.error("Lỗi khi parse fallbackSearchPhrases:", e);
      }

      searchSymptomsByRegion({
        bodyPartId: params.regionId,
        gender: (params.gender as BodyGender) || "male",
        age: 30,
        searchPhrase: params.searchPhrase,
        fallbackSearchPhrases,
      });
    }
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        {/* ── 1. HEADER (Đồng bộ style với body-map) ── */}
        <View className="bg-primary px-5 pt-12 pb-5 shadow-sm">
          <View className="flex-row items-center gap-3 mb-4">
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
              Triệu chứng vùng {params.labelVi || "cơ thể"}
            </Text>
          </View>

          {/* Thanh Tiến trình (Bước 2/3) */}
          <View className="mt-1">
            <Text className="text-white/80 text-[11px] font-semibold">
              Bước 2/3
            </Text>
            <View className="h-[3px] bg-white/25 w-full rounded-full mt-1.5 relative overflow-hidden">
              <View className="h-full bg-white w-2/3 rounded-full absolute left-0 top-0" />
            </View>
          </View>
        </View>

        {/* ── 2. NỘI DUNG CHÍNH ── */}
        <View className="flex-1 px-5 pt-4">
          <Text className="text-gray-500 text-[12px] font-medium mb-3">
            Chọn một triệu chứng mô tả đúng nhất tình trạng của bạn bên dưới:
          </Text>

          {/* Trạng thái Loading ban đầu */}
          {isLoading && symptoms.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-500 text-[13px] font-medium mt-3">
                Đang tải danh sách triệu chứng...
              </Text>
            </View>
          ) : error ? (
            /* Trạng thái Lỗi */
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-red-500 text-center text-[14px] font-medium mb-4">
                {error}
              </Text>
              <AppButton
                title="Thử lại"
                variant="outline"
                fullWidth={false}
                onPress={handleRetry}
              />
            </View>
          ) : symptoms.length === 0 ? (
            /* Trạng thái trống */
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 text-[14px] font-medium">
                Không tìm thấy triệu chứng phù hợp cho vùng này.
              </Text>
            </View>
          ) : (
            /* Danh sách triệu chứng */
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="gap-2.5">
                {symptoms.map((symptom) => {
                  const isSelected = selectedSymptom?.id === symptom.id;
                  return (
                    <Pressable
                      key={symptom.id}
                      onPress={() => handleSymptomSelect(symptom)}
                      className="p-4 rounded-[16px] border flex-row items-center justify-between bg-white"
                      style={({ pressed }) => [
                        isSelected
                          ? { borderColor: "#84AFEB", shadowColor: "#84AFEB", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }
                          : { borderColor: "#F1F5F9" },
                        pressed && { opacity: 0.8 }
                      ]}
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          className={`text-[14px] font-semibold ${
                            isSelected ? "text-[#547FB8]" : "text-gray-800"
                          }`}
                        >
                          {symptom.labelVi}
                        </Text>
                        <Text className="text-[11px] text-gray-400 mt-0.5">
                          {symptom.labelEn}
                        </Text>
                      </View>
                      <View
                        className={`w-[18px] h-[18px] rounded-full border items-center justify-center ${
                          isSelected
                            ? "border-[#84AFEB] bg-[#84AFEB]"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <View className="w-[8px] h-[8px] rounded-full bg-white" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ── 3. HÀNH ĐỘNG DƯỚI CÙNG ── */}
        <View className="px-5 pb-[58px] pt-3 bg-white border-t border-gray-50">
          <AppButton
            title="Tiếp theo"
            disabled={!selectedSymptom || isLoading}
            isLoading={isSubmitting}
            onPress={handleNext}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
