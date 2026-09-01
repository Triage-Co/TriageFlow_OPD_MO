import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { PatientPickerModal } from "@/shared/components/PatientPickerModal";
import { useInvoice } from "../hooks/useInvoice";
import { BillingSummaryCard } from "./BillingSummaryCard";
import { VisitBillingCard } from "./VisitBillingCard";

export function PatientBillingView() {
  const router = useRouter();
  const {
    patients,
    activePatient,
    setActivePatient,
    loading,
    refreshing,
    billingData,
    refetch,
  } = useInvoice();

  const [pickerVisible, setPickerVisible] = useState(false);

  const visits = billingData?.visits || [];

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 bg-gray-50">
        
        <View className="bg-primary pt-14 pb-5 flex-row items-center justify-between px-5 shadow-sm">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[18px] font-bold">
            Hóa Đơn & Viện Phí
          </Text>
          <TouchableOpacity
            onPress={() => setPickerVisible(true)}
            style={{ padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {activePatient?.full_name ? (
          <View className="bg-white px-5 py-3 border-b border-gray-100 flex-row justify-between items-center shadow-sm">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Ionicons name="person-circle" size={18} color={Colors.primary} />
              <Text className="text-gray-500 text-xs font-semibold" numberOfLines={1}>
                Hồ sơ: <Text className="text-gray-800 font-extrabold">{activePatient.full_name}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              className="bg-blue-50 px-2.5 py-1 rounded-md"
            >
              <Text className="text-primary text-[10px] font-black">
                {visits.length} ĐỢT KHÁM
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <FlatList
          data={visits}
          keyExtractor={(item, index) => item.booking_id || `visit-${index}`}
          contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refetch(true)}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View className="mb-4">
              
              <BillingSummaryCard summary={billingData?.summary} />

              <Text className="text-gray-800 text-[15px] font-bold mb-3 mt-1">
                Danh Sách Đợt Khám ({visits.length})
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <VisitBillingCard
              visit={item}
              onPress={() => {
                if (item.booking_id && activePatient?.patient_id) {
                  router.push({
                    pathname: "/(patient)/invoice/[bookingId]",
                    params: {
                      bookingId: item.booking_id,
                      patientId: activePatient.patient_id,
                    },
                  });
                }
              }}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text className="text-gray-400 text-xs mt-3 font-semibold">
                  Đang tải dữ liệu hóa đơn...
                </Text>
              </View>
            ) : (
              <View className="py-16 items-center justify-center px-6">
                <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
                  <Ionicons name="receipt-outline" size={32} color={Colors.primary} />
                </View>
                <Text className="text-gray-800 text-base font-bold text-center mb-1">
                  Chưa có hóa đơn viện phí
                </Text>
                <Text className="text-gray-400 text-xs text-center font-medium leading-5">
                  Các khoản viện phí và hóa đơn của bệnh nhân sẽ hiển thị tại đây sau khi thăm khám.
                </Text>
              </View>
            )
          }
        />

        <PatientPickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          selectedPatientId={activePatient?.patient_id}
          onConfirm={(patientId) => {
            const found = patients.find((p) => p.patient_id === patientId);
            if (found) {
              setActivePatient(found);
            }
            setPickerVisible(false);
          }}
        />
      </View>
    </ScreenWrapper>
  );
}
