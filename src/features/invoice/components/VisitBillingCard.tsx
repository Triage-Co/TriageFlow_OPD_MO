import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/config/colors";
import { BillingVisit } from "../types/invoice.types";

interface VisitBillingCardProps {
  visit: BillingVisit;
  onPress: () => void;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function VisitBillingCard({ visit, onPress }: VisitBillingCardProps) {
  const totalOrders = visit.orders?.length || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.card}
    >
      {/* Header: Date & Badge */}
      <View style={styles.headerRow}>
        <View style={styles.dateBlock}>
          <View style={styles.calendarIconBox}>
            <Ionicons name="calendar" size={14} color={Colors.primary} />
          </View>
          <Text style={styles.dateText}>{formatDate(visit.visit_date)}</Text>
        </View>

        <View style={styles.serviceCountBadge}>
          <Text style={styles.serviceCountText}>{totalOrders} chỉ định</Text>
        </View>
      </View>

      {/* Service Orders Preview */}
      {visit.orders && visit.orders.length > 0 && (
        <View style={styles.ordersBox}>
          {visit.orders.slice(0, 3).map((ord, idx) => (
            <View key={ord.service_order_id || idx} style={styles.orderRow}>
              <View style={styles.orderLeft}>
                <View style={styles.orderDot} />
                <Text style={styles.orderName} numberOfLines={1}>
                  {ord.name || "Dịch vụ y tế"}
                </Text>
              </View>
              <Text style={styles.orderAmount}>{formatVND(ord.amount)}</Text>
            </View>
          ))}
          {visit.orders.length > 3 && (
            <Text style={styles.moreOrdersText}>
              + {visit.orders.length - 3} dịch vụ khác...
            </Text>
          )}
        </View>
      )}

      {/* Footer: Total & CTA Button */}
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.totalLabel}>TỔNG VIỆN PHÍ</Text>
          <Text style={styles.totalAmount}>{formatVND(visit.total_amount)}</Text>
        </View>

        <View style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Chi tiết</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  serviceCountBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  ordersBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  orderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#94A3B8",
    marginRight: 8,
  },
  orderName: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
    flex: 1,
  },
  orderAmount: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
  },
  moreOrdersText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 4,
    marginLeft: 13,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  totalLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.primary,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
  },
});
