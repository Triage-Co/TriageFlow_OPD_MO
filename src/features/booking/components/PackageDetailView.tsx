import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { packageService } from "@/features/booking/services/package.service";
import { ExamPackageDetail } from "@/features/booking/types/package.types";

export function PackageDetailView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const packageId = (params.packageId as string) || "";
  const patientId = (params.patientId as string) || "";
  const patientName = (params.patientName as string) || "";

  const [packageDetail, setPackageDetail] = useState<ExamPackageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackageDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await packageService.getPackageDetail(packageId);
      const detail = (res as any)?.data || res || null;
      setPackageDetail(detail);
    } catch (err: any) {
      console.error("[PackageDetail] Error fetching package detail:", err);
      setError("Không thể tải thông tin chi tiết. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (packageId) {
      fetchPackageDetail();
    }
  }, [packageId]);

  const handleContinue = () => {
    if (!packageDetail) return;
    router.push({
      pathname: "/(patient)/package/package-booking",
      params: {
        packageId: packageDetail.package_id,
        patientId: patientId,
        patientName: patientName,
        packageName: packageDetail.package_name,
        packagePrice: packageDetail.price,
      },
    });
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "LAB_TEST":
        return "flask-outline";
      case "IMAGING":
        return "eye-outline";
      case "CLINICAL":
      default:
        return "git-commit-outline";
    }
  };

  const getStepColor = (stepType: string) => {
    switch (stepType) {
      case "LAB_TEST":
        return "#4F46E5"; // Indigo
      case "IMAGING":
        return "#0D9488"; // Teal
      case "CLINICAL":
      default:
        return "#059669"; // Emerald
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + " đ";
  };

  const steps = packageDetail?.template?.steps || [];

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 bg-gray-50">
        {/* ── 1. HEADER ── */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.neutral700} />
          </TouchableOpacity>
          <Text className="text-gray-800 text-[17px] font-bold">
            Chi tiết gói dịch vụ
          </Text>
          <View className="w-10" />
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-xs font-bold mt-3">
              Đang tải chi tiết gói khám...
            </Text>
          </View>
        ) : error || !packageDetail ? (
          <View className="flex-1 justify-center items-center px-8 text-center space-y-4">
            <Ionicons name="alert-circle-outline" size={54} color="#EF4444" />
            <Text className="text-gray-800 text-[14px] font-bold text-center">
              {error || "Không tìm thấy dữ liệu gói khám."}
            </Text>
            <TouchableOpacity
              onPress={fetchPackageDetail}
              activeOpacity={0.8}
              className="bg-primary px-5 py-2.5 rounded-xl mt-2"
            >
              <Text className="text-white text-xs font-bold">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              className="flex-1"
            >
              {/* Package Card */}
              <View className="bg-white rounded-[32px] m-4 p-6 border border-gray-100">
                <View className="w-12 h-12 rounded-2xl bg-teal-50 items-center justify-center mb-4">
                  <Ionicons name="briefcase" size={24} color="#0D9488" />
                </View>
                <Text className="text-gray-800 text-[20px] font-black leading-6">
                  {packageDetail.package_name}
                </Text>
                <Text className="text-gray-500 text-[13px] font-medium leading-5 mt-2">
                  {packageDetail.description || "Gói kiểm tra sức khỏe định kỳ giúp phát hiện sớm các nguy cơ về sức khỏe."}
                </Text>

                <View className="border-t border-gray-100 mt-6 pt-5 flex-row justify-between items-center">
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                    Đơn giá trọn gói
                  </Text>
                  <Text className="text-teal-600 text-[22px] font-black">
                    {formatPrice(packageDetail.price)}
                  </Text>
                </View>
              </View>

              {/* Steps inside the package */}
              <View className="px-5 mt-2">
                <Text className="text-gray-800 text-[15px] font-black mb-4">
                  Danh mục dịch vụ bao gồm ({steps.length})
                </Text>

                {steps.length === 0 ? (
                  <Text className="text-gray-400 text-xs italic">
                    Chưa có danh mục dịch vụ cụ thể.
                  </Text>
                ) : (
                  steps.map((step, idx) => {
                    const iconName = getStepIcon(step.step_type);
                    const iconColor = getStepColor(step.step_type);
                    const isLast = idx === steps.length - 1;

                    return (
                      <View key={idx} className="flex-row items-stretch">
                        {/* Timeline bar */}
                        <View className="items-center mr-4">
                          <View
                            style={{ backgroundColor: iconColor + "20" }}
                            className="w-10 h-10 rounded-full items-center justify-center z-10 border border-white"
                          >
                            <Ionicons name={iconName} size={18} color={iconColor} />
                          </View>
                          {!isLast && (
                            <View className="w-[1.5px] bg-gray-200 flex-1 my-1" />
                          )}
                        </View>

                        {/* Step detail card */}
                        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 mb-4">
                          <Text className="text-gray-800 text-[14px] font-extrabold">
                            {idx + 1}. {step.step_name}
                          </Text>
                          <View className="flex-row items-center mt-2.5">
                            <Ionicons
                              name="information-circle-outline"
                              size={13}
                              color="#9CA3AF"
                              style={{ marginRight: 4 }}
                            />
                            <Text className="text-gray-400 text-[11px] font-semibold">
                              {step.step_type === "LAB_TEST"
                                ? "Xét nghiệm cận lâm sàng"
                                : step.step_type === "IMAGING"
                                ? "Chẩn đoán hình ảnh"
                                : "Khám lâm sàng tại phòng"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Sticky register button */}
            <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                  Tổng chi phí
                </Text>
                <Text className="text-gray-800 text-[18px] font-black mt-0.5">
                  {formatPrice(packageDetail.price)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.8}
                className="bg-teal-600 px-6 py-3.5 rounded-2xl"
              >
                <Text className="text-white text-sm font-black">
                  Đăng ký ngay
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
