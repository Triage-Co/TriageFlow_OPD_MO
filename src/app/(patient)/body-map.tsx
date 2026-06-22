import { BodyMap } from "@/features/body-map/BodyMap";
import { BodyRegion } from "@/features/body-map/types";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

export default function BodyMapScreen() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const { height: windowHeight } = useWindowDimensions();

  const handleSelectRegion = (region: BodyRegion) => {
    setSelectedRegion(region);
  };

  const handleNext = () => {
    if (selectedRegion) {
      console.log("Selected body region:", selectedRegion);
    }
  };

  const cardHeight = Math.min(windowHeight * 0.62, 520);

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <View className="flex-1 justify-between">

        {/* ── 1. HEADER PHÂN LOẠI AI (Y CHANG FIGMA) ── */}
        <View className="bg-primary px-5 pt-12 pb-5 shadow-sm">
          {/* Hàng nút quay lại + Tiêu đề */}
          <View className="flex-row items-center gap-3 mb-4">
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-70 p-1"
            >
              <SymbolView
                name={{ ios: "chevron.left", android: "arrow_back" }}
                size={18}
                tintColor="#FFFFFF"
              />
            </Pressable>
            <Text className="text-white text-[16px] font-bold">
              Chọn vùng đau
            </Text>
          </View>

          {/* Thanh Tiến trình (Bước 1/3) */}
          <View className="mt-1">
            <Text className="text-white/80 text-[11px] font-semibold">
              Bước 1/3
            </Text>
            {/* Thanh bar */}
            <View className="h-[3px] bg-white/25 w-full rounded-full mt-1.5 relative overflow-hidden">
              <View className="h-full bg-white w-1/3 rounded-full absolute left-0 top-0" />
            </View>
          </View>
        </View>

        {/* ── 2. NỘI DUNG CHÍNH CHỌN VÙNG ĐAU (THÂN DƯỚI) ── */}
        <View className="flex-1 px-5 justify-between mt-4">
          <View>
            {/* Card trắng chứa Body Map SVG */}
            <View
              style={{ height: cardHeight }}
              className="bg-white rounded-[20px] py-5 items-center justify-center shadow shadow-black/5 border border-white/50"
            >
              <Text className="text-gray-500 text-[12px] font-medium text-center mt-3 mb-3">
                Nhấn vào vùng cơ thể bạn đang cảm thấy khó chịu
              </Text>
              <BodyMap
                selectedRegionId={selectedRegion?.id}
                onSelectRegion={handleSelectRegion}
              />
            </View>
            {selectedRegion && (
              <View className="bg-white/70 rounded-[14px] px-4 py-2.5 mt-2 flex-row items-center justify-between border border-white/40 shadow-sm">
                <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  Vùng đang chọn:
                </Text>
                <Text className="text-primary text-[14px] font-bold">
                  {selectedRegion.labelVi}
                </Text>
              </View>
            )}
          </View>

          {/* ── 3. PHẦN HÀNH ĐỘNG DƯỚI CÙNG (NÚT BẤM & TABBAR GIẢ Y CHANG FIGMA) ── */}
          <View className="gap-3 mb-12">
            {/* Nút Tiếp theo bo tròn hoàn toàn */}
            <AppButton
              title="Tiếp theo"
              disabled={!selectedRegion}
              onPress={handleNext}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}
