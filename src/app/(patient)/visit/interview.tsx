import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useTriage } from "@/features/triage/hooks/useTriage";
import { EvidenceChoiceId } from "@/features/triage/types/triage.types";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";

export default function InterviewScreen() {
  const router = useRouter();
  const {
    currentQuestion,
    shouldStop,
    isLoading,
    error,
    answerQuestion,
    triggerRecommendation,
    clearSession,
  } = useTriage();

  // State lưu đáp án của từng item: Record<itemId, choiceId>
  const [answers, setAnswers] = useState<Record<string, EvidenceChoiceId>>({});

  // Reset đáp án khi chuyển sang câu hỏi mới
  useEffect(() => {
    setAnswers({});
  }, [currentQuestion]);

  const handleSelectChoice = (itemId: string, choiceId: EvidenceChoiceId) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: choiceId,
    }));
  };

  const handleNext = async () => {
    const selectedAnswers = Object.entries(answers).map(([id, choice_id]) => ({
      id,
      choice_id,
    }));

    if (selectedAnswers.length > 0) {
      await answerQuestion(selectedAnswers);
    }
  };

  const handleSeeRecommendation = async () => {
    await triggerRecommendation();
  };

  const handleQuit = async () => {
    await clearSession();
    router.replace("/(patient)/body-map");
  };

  // Nút "Tiếp theo" chỉ active khi người dùng chọn ít nhất 1 đáp án
  const hasSelectedAny = Object.keys(answers).length > 0;

  // Đang tải câu hỏi đầu tiên (từ startDiagnosisSession)
  if (!currentQuestion && !shouldStop && isLoading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-500 text-[13px] font-medium mt-3">
            Đang chuẩn bị câu hỏi...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Không có câu hỏi và đã hết hỏi → hiển thị trạng thái kết thúc phiên
  if (!currentQuestion && !shouldStop && !isLoading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center p-5 bg-[#F8FAFC]">
          <Text className="text-gray-500 text-center text-[14px] font-medium mb-4">
            Không tìm thấy câu hỏi chẩn đoán hoặc phiên hỏi bệnh đã kết thúc.
          </Text>
          <AppButton title="Quay lại Trang chủ" onPress={handleQuit} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        {/* ── 1. HEADER ── */}
        <View className="bg-primary px-5 pt-12 pb-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={handleQuit}
                activeOpacity={0.7}
                className="p-1"
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close" }}
                  size={18}
                  tintColor="#FFFFFF"
                />
              </TouchableOpacity>
              <Text className="text-white text-[16px] font-bold">
                Khảo sát triệu chứng AI
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleQuit}
              activeOpacity={0.75}
              className="bg-white/20 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-[11px] font-bold">Hủy bỏ</Text>
            </TouchableOpacity>
          </View>

          {/* Thanh Tiến trình */}
          <View className="mt-1">
            <Text className="text-white/80 text-[11px] font-semibold">
              Bước 3/3
            </Text>
            <View className="h-[3px] bg-white/25 w-full rounded-full mt-1.5 relative overflow-hidden">
              <View className="h-full bg-white w-full rounded-full absolute left-0 top-0" />
            </View>
          </View>
        </View>

        {/* ── 2. NỘI DUNG HỎI BỆNH ── */}
        <View className="flex-1 px-5 pt-5">
          {error && (
            <View className="bg-red-50 border border-red-100 p-3 rounded-[12px] mb-4">
              <Text className="text-red-600 text-[12px] font-medium text-center">
                {error}
              </Text>
            </View>
          )}

          {/* Trạng thái kết thúc hỏi bệnh */}
          {shouldStop && !currentQuestion && (
            <View className="flex-1 items-center justify-center px-4">
              <View className="bg-green-50 border border-green-100 rounded-[20px] p-6 items-center w-full">
                <SymbolView
                  name={{ ios: "checkmark.circle.fill", android: "check_circle" }}
                  size={48}
                  tintColor="#16A34A"
                />
                <Text className="text-green-800 text-[17px] font-bold mt-3 text-center">
                  Khảo sát hoàn tất!
                </Text>
                <Text className="text-green-700 text-[13px] text-center mt-2 leading-5">
                  Hệ thống AI đã thu thập đủ thông tin. Nhấn nút bên dưới để xem đề xuất chuyên khoa phù hợp.
                </Text>
              </View>
            </View>
          )}

          {/* Câu hỏi đang hiển thị */}
          {currentQuestion && (
            <>
              <View className="bg-white rounded-[20px] p-5 border border-gray-50 shadow-sm mb-4">
                <Text className="text-gray-800 text-[16px] font-bold leading-6">
                  {currentQuestion.textVi || currentQuestion.text}
                </Text>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="gap-4">
                  {currentQuestion.items.map((item) => {
                    const selectedChoice = answers[item.id];
                    const showItemLabel =
                      currentQuestion.items.length > 1 ||
                      (item.nameVi && item.nameVi !== currentQuestion.textVi) ||
                      (item.name && item.name !== currentQuestion.text);

                    return (
                      <View
                        key={item.id}
                        className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm"
                      >
                        {showItemLabel && (
                          <Text className="text-gray-700 text-[14px] font-semibold mb-3">
                            {item.nameVi || item.name}
                          </Text>
                        )}

                        {/* 3 Nút lựa chọn: Có, Không, Không biết */}
                        <View className="flex-row gap-2">
                          {[
                            { id: "present" as EvidenceChoiceId, label: "Có" },
                            { id: "absent" as EvidenceChoiceId, label: "Không" },
                            { id: "unknown" as EvidenceChoiceId, label: "Không biết" },
                          ].map((choice) => {
                            const isChosen = selectedChoice === choice.id;
                            let btnBgStyle = "bg-[#F8FAFC] border-gray-200";
                            let textStyle = "text-gray-600";

                            if (isChosen) {
                              if (choice.id === "present") {
                                btnBgStyle = "bg-green-50 border-green-200";
                                textStyle = "text-green-700 font-bold";
                              } else if (choice.id === "absent") {
                                btnBgStyle = "bg-red-50 border-red-200";
                                textStyle = "text-red-700 font-bold";
                              } else {
                                btnBgStyle = "bg-gray-100 border-gray-300";
                                textStyle = "text-gray-800 font-bold";
                              }
                            }

                            return (
                              <Pressable
                                key={choice.id}
                                onPress={() => handleSelectChoice(item.id, choice.id)}
                                className={`flex-1 py-3 rounded-[12px] border items-center justify-center ${btnBgStyle}`}
                                style={({ pressed }) => pressed && { opacity: 0.8 }}
                              >
                                <Text className={`text-[12px] ${textStyle}`}>
                                  {choice.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </View>

        {/* ── 3. HÀNH ĐỘNG DƯỚI CÙNG ── */}
        <View className="px-5 pb-12 pt-3 bg-white border-t border-gray-50">
          {shouldStop ? (
            // Khi hết hỏi → nút "Xem đề xuất chuyên khoa"
            <AppButton
              title="Xem đề xuất chuyên khoa"
              isLoading={isLoading}
              onPress={handleSeeRecommendation}
            />
          ) : (
            // Đang hỏi bệnh → nút "Tiếp theo"
            <AppButton
              title="Tiếp theo"
              disabled={!hasSelectedAny || isLoading}
              isLoading={isLoading}
              onPress={handleNext}
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}
