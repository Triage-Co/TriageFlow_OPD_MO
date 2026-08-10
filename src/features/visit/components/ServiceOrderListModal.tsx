import React from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";

interface ServiceOrderListModalProps {
  visible: boolean;
  unpaidServiceOrders: any[];
  isFetchingServiceOrders: boolean;
  onClose: () => void;
  onPayOrderPress: (order: any) => void;
}

export const ServiceOrderListModal: React.FC<ServiceOrderListModalProps> = ({
  visible,
  unpaidServiceOrders,
  isFetchingServiceOrders,
  onClose,
  onPayOrderPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-[36px] p-6 space-y-6 max-h-[85%]">
          {/* Header Modal */}
          <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <Ionicons name="basket-outline" size={20} color={Colors.primary} />
              <View>
                <Text className="text-gray-800 text-[16px] font-extrabold uppercase">Các mục cần thanh toán</Text>
                <Text className="text-gray-400 text-[10px] font-bold">Danh sách dịch vụ chỉ định từ Bác sĩ</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="p-1 active:opacity-75"
            >
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* List Content */}
          {isFetchingServiceOrders ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-gray-400 text-xs font-semibold mt-3">Đang tải danh sách dịch vụ...</Text>
            </View>
          ) : unpaidServiceOrders.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {unpaidServiceOrders.map((order: any) => {
                const pendingDetails = order.serviceOrderDetails?.filter((d: any) => d.status === "PENDING") || [];
                const displayTotal = pendingDetails.reduce((sum: number, detail: any) => sum + (detail.price_at_order * (detail.quantity || 1)), 0);

                return (
                  <View key={order.service_order_id} className="bg-gray-50/50 border border-gray-100 rounded-3xl p-5 space-y-4">
                    {/* Order Info */}
                    <View className="flex-row justify-between items-center">
                      <View className="bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <Text className="text-amber-800 text-[10px] font-bold">Chờ thanh toán</Text>
                      </View>
                      <Text className="text-gray-400 text-[10px] font-semibold">
                        Ngày tạo: {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "---"}
                      </Text>
                    </View>

                    <View className="border-t border-gray-200 border-dashed my-1" />

                    {/* Detail items */}
                    <View className="space-y-2">
                      {pendingDetails.map((detail: any) => (
                        <View key={detail.service_order_detail_id} className="flex-row justify-between items-start">
                          <View className="max-w-[70%] space-y-0.5">
                            <Text className="text-gray-800 text-xs font-extrabold">
                              {detail.name || order.name || "Dịch vụ y tế"}
                            </Text>
                            <Text className="text-gray-400 text-[10px] font-bold">
                              Số lượng: {detail.quantity || 1}
                            </Text>
                          </View>
                          <Text className="text-gray-700 text-xs font-black">
                            {(detail.price_at_order * (detail.quantity || 1)).toLocaleString("vi-VN")} đ
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Total & Pay button */}
                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-200/60 mt-1">
                      <View className="space-y-0.5">
                        <Text className="text-gray-400 text-[10px] font-bold uppercase">Tổng thanh toán</Text>
                        <Text className="text-gray-900 text-base font-black">
                          {displayTotal.toLocaleString("vi-VN")} đ
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          onPayOrderPress({
                            ...order,
                            total_price: displayTotal,
                          });
                        }}
                        className="bg-primary px-5 py-2.5 rounded-xl flex-row items-center gap-1.5 active:opacity-75 shadow-sm shadow-primary/20"
                      >
                        <Ionicons name="card-outline" size={14} color="white" />
                        <Text className="text-white text-xs font-extrabold">Thanh toán QR</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View className="py-20 items-center justify-center space-y-2">
              <Text className="text-3xl">🎉</Text>
              <Text className="text-gray-800 font-extrabold text-sm">Bạn đã đóng hết phí chỉ định</Text>
              <Text className="text-gray-400 text-xs font-semibold text-center px-6">
                Không tìm thấy yêu cầu thanh toán dịch vụ nào đang chờ xử lý.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
