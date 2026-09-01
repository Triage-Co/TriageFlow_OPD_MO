import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { formatVND as formatPrice } from "@/shared/utils/string.utils";
import { packageService } from "@/features/booking/services/package.service";
import { ExamPackage } from "@/features/booking/types/package.types";

export function PackageSelectView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const patientId = (params.patientId as string) || "";
  const patientName = (params.patientName as string) || "";

  const [packages, setPackages] = useState<ExamPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await packageService.getAllPackages();
      const list = (res as any)?.data || res || [];
      setPackages(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("[PackageSelect] Error fetching packages:", err);
      setError("Không thể tải danh sách gói khám. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filteredPackages = (packages || []).filter((item) =>
    (item?.package_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPackage = (pkg: ExamPackage) => {
    console.log(
      `[PackageSelect] Selected package: ${pkg.package_name} (${pkg.package_id})`
    );
    router.push({
      pathname: "/(patient)/package/package-detail",
      params: {
        packageId: pkg.package_id,
        patientId: patientId,
        patientName: patientName,
      },
    });
  };

  const renderPackageItem = ({ item }: { item: ExamPackage }) => {
    return (
      <TouchableOpacity
        onPress={() => handleSelectPackage(item)}
        activeOpacity={0.75}
        className="mx-5 my-2.5 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex-row items-center justify-between"
      >
        <View className="flex-1 pr-4">
          
          <View className="bg-blue-50 self-start px-3 py-1 rounded-full mb-2 border border-blue-100/60">
            <Text className="text-primary text-[10px] font-extrabold uppercase">
              Gói Sức Khỏe
            </Text>
          </View>
          
          <Text className="text-gray-800 text-[16px] font-extrabold leading-5">
            {item.package_name}
          </Text>
          
          {item.description ? (
            <Text
              className="text-gray-400 text-[12px] font-medium mt-1.5 leading-4"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          
          <Text className="text-primary text-[16px] font-black mt-3">
            {formatPrice(item.price)}
          </Text>
        </View>

        <View className="w-10 h-10 rounded-2xl bg-blue-50/70 items-center justify-center border border-blue-100/50">
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

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
              Gói khám sức khỏe
            </Text>
            {patientName ? (
              <Text className="text-primary text-[11px] font-semibold mt-0.5">
                Bệnh nhân: {patientName}
              </Text>
            ) : null}
          </View>
          <View className="w-10" />
        </View>

        <View className="px-5 mt-4 mb-2">
          <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm gói khám..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800 text-[13px] font-medium p-0 h-7"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-xs font-bold mt-3">
              Đang tải danh sách gói khám...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-8 text-center space-y-4">
            <Ionicons name="alert-circle-outline" size={54} color="#EF4444" />
            <Text className="text-gray-800 text-[14px] font-bold text-center">
              {error}
            </Text>
            <Pressable
              onPress={fetchPackages}
              className="bg-primary px-5 py-2.5 rounded-xl mt-2 active:opacity-85"
            >
              <Text className="text-white text-xs font-bold">Thử lại</Text>
            </Pressable>
          </View>
        ) : filteredPackages.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons name="search-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-400 text-[13px] font-bold mt-2 text-center">
              Không tìm thấy gói khám nào phù hợp.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPackages}
            renderItem={renderPackageItem}
            keyExtractor={(item) => item.package_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
