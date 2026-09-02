import React from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";
import { formatVND, getQrCodeUrl } from "@/shared/utils/string.utils";

interface ServiceOrderPaymentQrModalProps {
  visible: boolean;
  selectedServiceOrder: any;
  patientName: string;
  onClose: () => void;
}

export const ServiceOrderPaymentQrModal: React.FC<ServiceOrderPaymentQrModalProps> = ({
  visible,
  selectedServiceOrder,
  patientName,
  onClose,
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
          
          <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
            <Text className="text-gray-800 text-lg font-bold">Thanh Toán Đơn Chỉ Định</Text>
            <Pressable
              onPress={onClose}
              className="p-1 active:opacity-75"
            >
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          {selectedServiceOrder && (
            <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
              <View className="items-center space-y-4">
                <Text className="text-gray-500 text-xs text-center px-4 leading-[18px]">
                  Quét mã QR dưới đây bằng ứng dụng ngân hàng của bạn để thanh toán đơn dịch vụ chỉ định.
                </Text>

                <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-md items-center justify-center">
                  {selectedServiceOrder.qr_code ? (
                    <Image
                      source={{
                        uri: getQrCodeUrl(selectedServiceOrder.qr_code),
                      }}
                      style={{ width: 200, height: 200 }}
                      contentFit="contain"
                    />
                  ) : (
                    <View className="w-52 h-52 items-center justify-center bg-gray-50 rounded-xl">
                      <Text className="text-gray-400 text-xs font-semibold">Chưa có mã QR</Text>
                    </View>
                  )}
                </View>

                <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Số tiền</Text>
                    <Text className="text-primary text-xs font-extrabold">
                      {formatVND(selectedServiceOrder.total_price)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Bệnh nhân</Text>
                    <Text className="text-gray-800 text-xs font-bold">{patientName}</Text>
                  </View>
                  <View className="border-t border-gray-100 my-1" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400 text-xs font-semibold">Trạng thái</Text>
                    <View className="flex-row items-center gap-1">
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text className="text-primary text-xs font-bold">Đang chờ thanh toán...</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="pt-2">
                <Pressable
                  onPress={onClose}
                  className="w-full py-4 bg-gray-100 rounded-2xl items-center justify-center active:opacity-75"
                >
                  <Text className="text-gray-700 font-bold text-sm">Đóng</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
