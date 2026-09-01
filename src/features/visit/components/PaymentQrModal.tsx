import React from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

interface PaymentQrModalProps {
  visible: boolean;
  selectedStep: any;
  patientName: string;
  qrImageUrl: string;
  isCheckingPayment: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({
  visible,
  selectedStep,
  patientName,
  qrImageUrl,
  isCheckingPayment,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isCheckingPayment) onClose();
      }}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-[36px] p-6 space-y-6 max-h-[85%]">
          
          <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
            <Text className="text-gray-800 text-lg font-bold">Quét Mã Chuyển Khoản</Text>
            <Pressable
              disabled={isCheckingPayment}
              onPress={onClose}
              className="p-1 active:opacity-75"
            >
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
            <View className="items-center space-y-4">
              <Text className="text-gray-500 text-xs text-center px-4 leading-[18px]">
                Mở ứng dụng ngân hàng và quét mã QR để đóng phí cho dịch vụ khám.
              </Text>

              <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-md">
                {qrImageUrl ? (
                  <Image
                    source={{ uri: qrImageUrl }}
                    className="w-52 h-52"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-52 h-52 items-center justify-center bg-gray-50 rounded-xl">
                    <Text className="text-gray-400 text-xs font-semibold">Chưa có mã QR</Text>
                  </View>
                )}
              </View>

              <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 text-xs">Dịch vụ</Text>
                  <Text className="text-gray-800 text-xs font-bold text-right flex-1 ml-4">
                    {selectedStep?.step_name || "Dịch vụ y tế"}
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
                    <Ionicons name="time" size={13} color="#F59E0B" />
                    <Text className="text-[#F59E0B] text-xs font-bold">Chờ giao dịch</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="pt-2 gap-3 flex-row">
              <Pressable
                disabled={isCheckingPayment}
                onPress={onClose}
                className="flex-1 py-4 bg-gray-100 rounded-2xl items-center justify-center active:opacity-75"
              >
                <Text className="text-gray-700 font-bold text-sm">Đóng</Text>
              </Pressable>
              <Pressable
                disabled={isCheckingPayment}
                onPress={onConfirm}
                className="flex-[2] py-4 bg-primary rounded-2xl items-center justify-center flex-row gap-2 active:opacity-90"
              >
                {isCheckingPayment ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm">Đang xác nhận...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm">Tôi đã thanh toán xong</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
