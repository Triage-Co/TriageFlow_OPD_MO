import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";
import { InvoiceSummary } from "../types/invoice.types";

interface BillingSummaryCardProps {
  summary?: InvoiceSummary | null;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

export function BillingSummaryCard({ summary }: BillingSummaryCardProps) {
  const total = summary?.total_amount || 0;
  const visitCount = summary?.visit_count || 0;

  return (
    <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-gray-500 text-xs font-semibold mb-1">
          Tổng viện phí phát sinh
        </Text>
        <Text className="text-gray-900 text-[22px] font-black tracking-tight">
          {formatVND(total)}
        </Text>
      </View>

      <View className="bg-blue-50 px-3 py-2 rounded-2xl flex-row items-center gap-1.5 border border-blue-100">
        <Ionicons name="calendar" size={14} color={Colors.primary} />
        <Text className="text-primary text-xs font-bold">
          {visitCount} đợt khám
        </Text>
      </View>
    </View>
  );
}
