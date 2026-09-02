import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useNotification } from "@/features/notification/hooks/useNotification";
import { NotificationCard } from "@/features/notification/components/NotificationCard";
import { NotificationEmptyState } from "@/features/notification/components/NotificationEmptyState";
import { Colors } from "@/config/colors";

export const NotificationListView: React.FC = () => {
  const router = useRouter();
  const {
    notifications,
    total,
    isLoading,
    isRefreshing,
    isLoadingMore,
    refresh,
    loadMore,
    removeOne,
    removeAll,
  } = useNotification();

  const handleConfirmClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa toàn bộ thông báo không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: removeAll,
        },
      ]
    );
  };

  const handleConfirmDeleteOne = (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có muốn xóa thông báo này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => removeOne(id),
        },
      ]
    );
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 bg-gray-50/50">
        
        {/* Signature App Header */}
        <View className="bg-primary rounded-b-[32px] px-6 pt-14 pb-6 shadow-md mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3.5">
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
              >
                <Ionicons name="arrow-back" size={22} color="white" />
              </Pressable>
              <View>
                <Text className="text-white text-[20px] font-extrabold tracking-tight">
                  Thông báo
                </Text>
                <Text className="text-white/80 text-xs font-medium mt-0.5">
                  {total > 0 ? `${total} thông báo` : "Cập nhật y tế của bạn"}
                </Text>
              </View>
            </View>

            {notifications.length > 0 && (
              <Pressable
                onPress={handleConfirmClearAll}
                hitSlop={8}
                className="flex-row items-center gap-1.5 py-2 px-3.5 rounded-full bg-white/20 active:bg-white/30"
              >
                <Ionicons name="trash-outline" size={14} color="white" />
                <Text className="text-white text-xs font-bold">Xóa tất cả</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Content Body */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 text-xs font-bold mt-3">
              Đang tải thông báo...
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationCard
                item={item}
                onDelete={handleConfirmDeleteOne}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 40,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor={Colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<NotificationEmptyState />}
            ListFooterComponent={
              isLoadingMore ? (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
};
