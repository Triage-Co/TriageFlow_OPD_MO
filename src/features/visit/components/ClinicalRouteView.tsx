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

  const displaySteps = React.useMemo(() => {
    const result: any[] = [];
    const processedServiceOrderIds = new Set<string>();

    for (let i = 0; i < visibleSteps.length; i++) {
      const step = visibleSteps[i];
      const isPayment = step.step_name?.toLowerCase().trim().startsWith("thanh toán") || step.step_type === "PAYMENT";
      const serviceOrderId = step.service_order_id;

      if (!isPayment && serviceOrderId) {
        if (processedServiceOrderIds.has(serviceOrderId)) {
          continue; 
        }
        processedServiceOrderIds.add(serviceOrderId);

        const siblingSteps = visibleSteps.filter(s => {
          const sIsPayment = s.step_name?.toLowerCase().trim().startsWith("thanh toán") || s.step_type === "PAYMENT";
          return s.service_order_id === serviceOrderId && !sIsPayment;
        });

        const isGroupCompleted = siblingSteps.every(s => s.step_status === "COMPLETED");
        const isGroupActive = siblingSteps.some(s => s.step_id === activeStepId);

        result.push({
          isGrouped: true,
          serviceOrderId,
          step_status: isGroupCompleted ? "COMPLETED" : "IN_PROGRESS",
          step_name: "Thực hiện chỉ định dịch vụ",
          subSteps: siblingSteps,
          step_id: step.step_id,
        });
      } else {
        result.push({
          ...step,
          isGrouped: false,
        });
      }
    }

    return result;
  }, [visibleSteps, activeStepId]);

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />

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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-xs mt-3">Đang tải lộ trình khám...</Text>
        </View>
      ) : displaySteps.length === 0 ? (
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
          {displaySteps.map((step: any, index: number) => {
            const isActive = step.isGrouped
              ? step.subSteps.some((s: any) => s.step_id === activeStepId)
              : step.step_id === activeStepId;
            const isLast = index === displaySteps.length - 1;

            return (
              <TimelineStepCard
                key={step.step_id}
                step={step}
                index={index}
                isLast={isLast}
                isActive={isActive}
                onPayPress={setSelectedStep}
                activeStepId={activeStepId}
                allSteps={visibleSteps}
              />
            );
          })}
        </ScrollView>
      )}

      <PaymentQrModal
        visible={!!selectedStep}
        selectedStep={selectedStep}
        patientName={patientName}
        qrImageUrl={qrImageUrl}
        isCheckingPayment={isCheckingPayment}
        onClose={() => setSelectedStep(null)}
        onConfirm={handleConfirmPayment}
      />

      <ServiceOrderListModal
        visible={isServiceOrderModalVisible}
        unpaidServiceOrders={unpaidServiceOrders}
        isFetchingServiceOrders={isFetchingServiceOrders}
        onClose={() => setIsServiceOrderModalVisible(false)}
        onPayOrderPress={setSelectedServiceOrder}
      />

      <ServiceOrderPaymentQrModal
        visible={!!selectedServiceOrder}
        selectedServiceOrder={selectedServiceOrder}
        patientName={patientName}
        onClose={() => setSelectedServiceOrder(null)}
      />
    </ScreenWrapper>
  );
}
