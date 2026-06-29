import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
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
  const snapPoints = useMemo(() => ["50%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      console.log(`[BottomSheet] Bottom Sheet opened for: ${regionId}`);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, regionId]);

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      onClose();
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

        {/* Content */}
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
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="gap-2">
              {symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
                
                const cardClassName = isSelected
                  ? "p-4 rounded-[16px] border border-[#84AFEB] bg-[#84AFEB]/5 flex-row items-center justify-between shadow-sm active:opacity-80"
                  : "p-4 rounded-[16px] border border-slate-100 bg-white flex-row items-center justify-between active:opacity-80";

                const textClassName = isSelected
                  ? "text-[14px] font-semibold text-[#547FB8]"
                  : "text-[14px] font-semibold text-slate-800";

                const checkboxClassName = isSelected
                  ? "w-[18px] h-[18px] rounded-[4px] border border-[#84AFEB] bg-[#84AFEB] items-center justify-center"
                  : "w-[18px] h-[18px] rounded-[4px] border border-slate-300 items-center justify-center";

                return (
                  <Pressable
                    key={symptom.id}
                    onPress={() => onToggleSymptom(symptom)}
                    className={cardClassName}
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
              })}
            </View>
          </BottomSheetScrollView>
        )}
      </View>
    </BottomSheet>
  );
}
