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
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { packageService } from "@/features/booking/services/package.service";
import { ExamPackage } from "@/features/booking/types/package.types";

export function PackageSelectView() {
  const router = useRouter();
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

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + " đ";
  };

  const renderPackageItem = ({ item }: { item: ExamPackage }) => {
    return (
      <TouchableOpacity
        onPress={() => handleSelectPackage(item)}
        activeOpacity={0.8}
        className="mx-4 my-2 p-5 rounded-3xl bg-white border border-gray-100 flex-row items-center justify-between"
      >
        <View className="flex-1 pr-4">
          {/* Badge */}
          <View className="bg-blue-50 self-start px-3 py-1 rounded-full mb-2">
            <Text className="text-primary text-[10px] font-extrabold uppercase">
              Gói Sức Khỏe
            </Text>
          </View>
          {/* Title */}
          <Text className="text-gray-800 text-[16px] font-extrabold leading-5">
            {item.package_name}
          </Text>
          {/* Description */}
          {item.description ? (
            <Text
              className="text-gray-400 text-[11px] font-semibold mt-1.5 leading-4"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          {/* Price */}
          <Text className="text-primary text-[15px] font-black mt-3">
            {formatPrice(item.price)}
          </Text>
        </View>

        {/* Action Icon */}
        <View className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center">
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

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
            Gói khám sức khỏe
          </Text>
          <View className="w-10" />
        </View>

        {/* ── 2. SEARCH BAR ── */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 py-2.5">
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm gói khám..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800 text-[13px] font-semibold p-0 h-7"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 3. LIST OF PACKAGES ── */}
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
              className="bg-primary px-5 py-2.5 rounded-xl mt-2"
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
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
