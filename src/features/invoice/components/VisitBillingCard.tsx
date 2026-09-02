import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatVND } from "@/shared/utils/string.utils";
import { formatDate } from "@/shared/utils/date.utils";
import { BillingVisit } from "../types/invoice.types";

interface VisitBillingCardProps {
  visit: BillingVisit;
  onPress: () => void;
}

export function VisitBillingCard({ visit, onPress }: VisitBillingCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.card}
    >
      {/* Header Ngày Khám */}
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>{formatDate(visit.visit_date)}</Text>

        <View style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Chi tiết</Text>
          <Ionicons name="chevron-forward" size={13} color="#0F172A" />
        </View>
      </View>

      {/* Footer Tổng viện phí (Màu đen) */}
      <View style={styles.footerRow}>
        <Text style={styles.totalLabel}>TỔNG VIỆN PHÍ</Text>
        <Text style={styles.totalAmount}>{formatVND(visit.total_amount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  totalLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
});
