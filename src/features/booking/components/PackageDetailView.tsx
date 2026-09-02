import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { formatVND } from "@/shared/utils/string.utils";
import { getStepVisualInfo } from "@/shared/utils/flow.utils";
import { packageService } from "@/features/booking/services/package.service";
import { ExamPackageDetail } from "@/features/booking/types/package.types";
import { AppButton } from "@/shared/components/AppButton";

export function PackageDetailView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const steps = packageDetail?.template?.steps || [];

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 bg-gray-50/50">
        
        <View
          style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
          className="flex-row items-center justify-between px-5 pb-3 bg-white border-b border-gray-100/80"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.neutral700} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-gray-800 text-[17px] font-bold">
              Chi tiết gói dịch vụ
            </Text>
            {patientName ? (
              <Text className="text-primary text-[11px] font-semibold mt-0.5">
                Bệnh nhân: {patientName}
              </Text>
            ) : null}
          </View>
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
              contentContainerStyle={{ paddingBottom: 120 }}
              className="flex-1"
            >
              
              <View className="bg-white rounded-3xl m-5 p-6 border border-slate-100 shadow-sm">
                <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mb-4 border border-blue-100/60">
                  <Ionicons name="briefcase" size={22} color={Colors.primary} />
                </View>
                <Text className="text-gray-800 text-[19px] font-extrabold leading-6">
                  {packageDetail.package_name}
                </Text>
                <Text className="text-gray-500 text-[13px] font-medium leading-5 mt-2">
                  {packageDetail.description || "Gói kiểm tra sức khỏe định kỳ giúp tầm soát và phát hiện sớm các nguy cơ sức khỏe."}
                </Text>

                <View className="border-t border-slate-100 mt-5 pt-4 flex-row justify-between items-center">
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                    Đơn giá trọn gói
                  </Text>
                  <Text className="text-primary text-[20px] font-black">
                    {formatVND(packageDetail.price)}
                  </Text>
                </View>
              </View>

              <View className="px-5 mt-1">
                <Text className="text-gray-800 text-[15px] font-extrabold mb-4">
                  Danh mục dịch vụ bao gồm ({steps.length})
                </Text>

                {steps.length === 0 ? (
                  <View className="bg-white rounded-2xl p-5 border border-slate-100 items-center">
                    <Text className="text-gray-400 text-xs font-medium italic">
                      Chưa có danh mục dịch vụ cụ thể.
                    </Text>
                  </View>
                ) : (
                  steps.map((step, idx) => {
                    const { icon: iconName, color: iconColor } = getStepVisualInfo(step.step_type, Colors.primary);
                    const isLast = idx === steps.length - 1;

                    return (
                      <View key={idx} className="flex-row items-stretch">
                        
                        <View className="items-center mr-3.5">
                          <View
                            style={{ backgroundColor: iconColor + "15" }}
                            className="w-10 h-10 rounded-full items-center justify-center z-10 border border-white shadow-sm"
                          >
                            <Ionicons name={iconName} size={18} color={iconColor} />
                          </View>
                          {!isLast && (
                            <View className="w-[1.5px] bg-slate-200 flex-1 my-1" />
                          )}
                        </View>

                        <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3.5">
                          <Text className="text-gray-800 text-[14px] font-bold">
                            {idx + 1}. {step.step_name}
                          </Text>
                          <View className="flex-row items-center mt-2">
                            <Ionicons
                              name="information-circle-outline"
                              size={13}
                              color="#9CA3AF"
                              style={{ marginRight: 4 }}
                            />
                            <Text className="text-gray-400 text-[11px] font-medium">
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

            <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 flex-row justify-between items-center shadow-lg">
              <View className="flex-1 pr-4">
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                  Tổng chi phí
                </Text>
                <Text className="text-primary text-[18px] font-black mt-0.5">
                  {formatVND(packageDetail.price)}
                </Text>
              </View>
              <View className="w-44">
                <AppButton
                  title="Đăng ký ngay"
                  variant="primary"
                  onPress={handleContinue}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
