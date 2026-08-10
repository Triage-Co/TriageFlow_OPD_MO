import React from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useClinicalRoute } from "../hooks/useClinicalRoute";

import { TimelineStepCard } from "./TimelineStepCard";
import { PaymentQrModal } from "./PaymentQrModal";
import { ServiceOrderListModal } from "./ServiceOrderListModal";
import { ServiceOrderPaymentQrModal } from "./ServiceOrderPaymentQrModal";

export function ClinicalRouteView() {
  const router = useRouter();
  const {
    patientName,
    isLoading,
    isRefreshing,
    selectedStep,
    setSelectedStep,
    isCheckingPayment,
    isServiceOrderModalVisible,
    setIsServiceOrderModalVisible,
    selectedServiceOrder,
    setSelectedServiceOrder,
    isFetchingServiceOrders,
    unpaidServiceOrders,
    formattedDate,
    visibleSteps,
    activeStepId,
    qrImageUrl,
    handleRefresh,
    handleConfirmPayment,
  } = useClinicalRoute();

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Header Area */}
      <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="p-1 active:opacity-70 w-10 items-start"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-white text-[17px] font-bold">Lộ Trình Khám</Text>
          <Text className="text-white/80 text-[12px] font-medium mt-0.5">
            {patientName} • {formattedDate}
          </Text>
        </View>
        <Pressable
          onPress={() => setIsServiceOrderModalVisible(true)}
          className="p-1 active:opacity-70 w-10 items-end relative"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="wallet-outline" size={24} color="white" />
          {unpaidServiceOrders.length > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-[16px] items-center justify-center px-1">
              <Text className="text-[10px] text-white font-extrabold">{unpaidServiceOrders.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Timeline Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-xs mt-3">Đang tải lộ trình khám...</Text>
        </View>
      ) : visibleSteps.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="trail-sign-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-400 text-sm mt-3 text-center">
            Không tìm thấy lộ trình chi tiết cho lượt khám này.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 50 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {visibleSteps.map((step: any, index: number) => {
            const isActive = step.step_id === activeStepId;
            const isLast = index === visibleSteps.length - 1;

            return (
              <TimelineStepCard
                key={step.step_id}
                step={step}
                index={index}
                isLast={isLast}
                isActive={isActive}
                onPayPress={setSelectedStep}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Payment QR Modal */}
      <PaymentQrModal
        visible={!!selectedStep}
        selectedStep={selectedStep}
        patientName={patientName}
        qrImageUrl={qrImageUrl}
        isCheckingPayment={isCheckingPayment}
        onClose={() => setSelectedStep(null)}
        onConfirm={handleConfirmPayment}
      />

      {/* Modal 1: Danh sách đơn dịch vụ chỉ định */}
      <ServiceOrderListModal
        visible={isServiceOrderModalVisible}
        unpaidServiceOrders={unpaidServiceOrders}
        isFetchingServiceOrders={isFetchingServiceOrders}
        onClose={() => setIsServiceOrderModalVisible(false)}
        onPayOrderPress={setSelectedServiceOrder}
      />

      {/* Modal 2: Quét mã QR thanh toán đơn dịch vụ chỉ định */}
      <ServiceOrderPaymentQrModal
        visible={!!selectedServiceOrder}
        selectedServiceOrder={selectedServiceOrder}
        patientName={patientName}
        onClose={() => setSelectedServiceOrder(null)}
      />
    </ScreenWrapper>
  );
}
