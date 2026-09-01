import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/config/colors";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useVisitInvoice } from "../hooks/useInvoice";

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
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mins} • ${day}/${month}/${year}`;
}

export function VisitInvoiceDetailView() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string; patientId: string }>();
  const { bookingId, patientId } = params;

  const { loading, visitDetail, refetch } = useVisitInvoice(patientId, bookingId);

  const totalOrders = visitDetail?.orders?.length || 0;
  const totalSubItems =
    visitDetail?.orders?.reduce(
      (acc, ord) => acc + (ord.service_order_details?.length || 1),
      0
    ) || 0;

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header Immersive chuẩn hệ thống */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Hóa Đơn</Text>
          <View style={{ width: 32 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải chi tiết hóa đơn...</Text>
          </View>
        ) : !visitDetail ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
            <Text style={styles.errorTitle}>Không tìm thấy thông tin hóa đơn</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* THẺ BIÊN LAI E-RECEIPT CAO CẤP */}
            <View style={styles.receiptContainer}>
              {/* Receipt Top Banner: Ngày khám */}
              <View style={styles.receiptTopHeader}>
                <View style={styles.dateRow}>
                  <View style={styles.dateIconWrapper}>
                    <Ionicons name="calendar" size={16} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.dateLabel}>Thời gian khám</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(visitDetail.visit_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {totalSubItems} dịch vụ
                  </Text>
                </View>
              </View>

              {/* Đường kẻ răng cưa / phân cách biên lai */}
              <View style={styles.notchDividerContainer}>
                <View style={styles.notchLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.notchRight} />
              </View>

              {/* Danh sách các nhóm dịch vụ */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionHeading}>
                  DANH MỤC DỊCH VỤ ĐÃ THỰC HIỆN
                </Text>

                {visitDetail.orders && visitDetail.orders.length > 0 ? (
                  visitDetail.orders.map((order, orderIdx) => {
                    const subItems = order.service_order_details || [];
                    const hasSubItems = subItems.length > 0;

                    return (
                      <View
                        key={order.service_order_id || orderIdx}
                        style={[
                          styles.orderGroupCard,
                          orderIdx < visitDetail.orders.length - 1 &&
                            styles.orderGroupSpacing,
                        ]}
                      >
                        {/* Tiêu đề nhóm */}
                        <View style={styles.groupHeaderRow}>
                          <View style={styles.groupIconBox}>
                            <Ionicons
                              name="medical"
                              size={13}
                              color={Colors.primary}
                            />
                          </View>
                          <Text style={styles.groupTitleText} numberOfLines={1}>
                            {order.name || `Chỉ định #${orderIdx + 1}`}
                          </Text>
                        </View>

                        {/* Danh sách từng dịch vụ con */}
                        <View style={styles.subItemsList}>
                          {hasSubItems ? (
                            subItems.map((detail, detailIdx) => (
                              <View
                                key={detailIdx}
                                style={styles.subItemRow}
                              >
                                <Text
                                  style={styles.subItemName}
                                  numberOfLines={2}
                                >
                                  {detail.name || "Dịch vụ y tế"}
                                </Text>
                                <Text style={styles.subItemPrice}>
                                  {formatVND(detail.sub_total)}
                                </Text>
                              </View>
                            ))
                          ) : (
                            <View style={styles.subItemRow}>
                              <Text style={styles.subItemName}>
                                Phí dịch vụ chỉ định
                              </Text>
                              <Text style={styles.subItemPrice}>
                                {formatVND(order.amount)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Dòng tổng tiền nhóm con (nếu có từ 2 dịch vụ trở lên) */}
                        {hasSubItems && subItems.length > 1 && (
                          <View style={styles.groupSubtotalRow}>
                            <Text style={styles.groupSubtotalLabel}>
                              Cộng nhóm:
                            </Text>
                            <Text style={styles.groupSubtotalValue}>
                              {formatVND(order.amount)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyItemsText}>
                    Không có chi tiết danh mục dịch vụ.
                  </Text>
                )}
              </View>

              {/* Đường gạch phân cách tổng kết */}
              <View style={styles.footerDivider} />

              {/* TỔNG VIỆN PHÍ CUỐI CÙNG */}
              <View style={styles.totalBox}>
                <View style={styles.totalLeftCol}>
                  <Text style={styles.totalLabel}>TỔNG CỘNG VIỆN PHÍ</Text>
                  <Text style={styles.totalSubtitle}>Đã bao gồm VAT & dịch vụ</Text>
                </View>
                <Text style={styles.totalValue}>
                  {formatVND(visitDetail.total_amount)}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 54,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  errorTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // RECEIPT CARD
  receiptContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  receiptTopHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
  },
  // NOTCH DIVIDER
  notchDividerContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    backgroundColor: "#FFFFFF",
  },
  notchLeft: {
    position: "absolute",
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 2,
  },
  notchRight: {
    position: "absolute",
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 2,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginHorizontal: 16,
  },
  // ITEMS SECTION
  itemsSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  orderGroupCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderGroupSpacing: {
    marginBottom: 12,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  groupIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  groupTitleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    flex: 1,
  },
  subItemsList: {
    paddingTop: 8,
    gap: 8,
  },
  subItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  subItemName: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    flex: 1,
    paddingRight: 12,
    lineHeight: 18,
  },
  subItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  groupSubtotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  groupSubtotalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  groupSubtotalValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  emptyItemsText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  // TOTAL FOOTER
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
  },
  totalLeftCol: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  totalSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
});
