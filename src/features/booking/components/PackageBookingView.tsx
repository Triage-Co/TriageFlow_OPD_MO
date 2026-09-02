import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { formatVND } from "@/shared/utils/string.utils";
import { formatDate, toISODateString } from "@/shared/utils/date.utils";
import { packageService } from "@/features/booking/services/package.service";
import { RoomSlot } from "@/features/booking/types/package.types";
import { AppButton } from "@/shared/components/AppButton";
import { AppAlert } from "@/shared/utils/alert.utils";

interface DateItem {
  dateStr: string; 
  dayNum: string; 
  dayLabel: string; 
}

export function PackageBookingView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const packageId = (params.packageId as string) || "";
  const patientId = (params.patientId as string) || "";
  const patientName = (params.patientName as string) || "";
  const packageName = (params.packageName as string) || "Gói khám sức khỏe";
  const packagePrice = Number(params.packagePrice || 0);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<RoomSlot | null>(null);
  const [slots, setSlots] = useState<RoomSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [createdBookingCode, setCreatedBookingCode] = useState("");

  const datesList = useMemo((): DateItem[] => {
    const list: DateItem[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);

      const dayVal = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = toISODateString(targetDate);

      let dayLabel = "";
      if (i === 0) {
        dayLabel = "Hôm nay";
      } else {
        const dayOfWeek = targetDate.getDay();
        const daysOfWeekLabel = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
        dayLabel = daysOfWeekLabel[dayOfWeek];
      }

      list.push({
        dateStr,
        dayNum: dayVal,
        dayLabel,
      });
    }
    return list;
  }, []);

  useEffect(() => {
    if (datesList.length > 0 && !selectedDate) {
      setSelectedDate(datesList[0].dateStr);
    }
  }, [datesList, selectedDate]);

  const loadSlots = async (date: string) => {
    setIsFetchingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await packageService.getRoomSlots(date);
      console.log("[PackageBooking] getRoomSlots response:", JSON.stringify(res));
      const raw = (res as any)?.data || res || [];
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.slots)) {
        list = raw.slots;
      } else if (raw && Array.isArray(raw.room_slots)) {
        list = raw.room_slots;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      }

      const normalized: RoomSlot[] = list.map((s: any, idx: number) => ({
        slot_id: s.slot_id || s.id || s.slotId || `slot-${idx}`,
        slot_index: s.slot_index || s.slotIndex || idx,
        shift_id: s.shift_id || s.shiftId || "",
        start_time: s.start_time || s.startTime || "",
        end_time: s.end_time || s.endTime || s.start_time || s.startTime || "",
        capacity: typeof s.capacity === "number" ? s.capacity : 1,
        max_capacity: typeof s.max_capacity === "number" ? s.max_capacity : 1,
        status: s.status || "AVAILABLE",
      }));

      const available = normalized.filter(
        (s) => s.status === "AVAILABLE" || s.capacity > 0
      );
      setSlots(available);
    } catch (err) {
      console.error("[PackageBooking] Error loading slots:", err);
      setSlots([]);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate]);

  const morningSlots = useMemo(() => {
    return slots.filter((slot) => {
      const sTime = slot.start_time || (slot as any).startTime;
      if (!sTime) return true;
      const parts = sTime.split(":");
      if (parts.length < 2) return true;
      const slotHours = parseInt(parts[0], 10);
      return slotHours < 12;
    });
  }, [slots]);

  const afternoonSlots = useMemo(() => {
    return slots.filter((slot) => {
      const sTime = slot.start_time || (slot as any).startTime;
      if (!sTime) return false;
      const parts = sTime.split(":");
      if (parts.length < 2) return false;
      const slotHours = parseInt(parts[0], 10);
      return slotHours >= 12;
    });
  }, [slots]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot: RoomSlot) => {
    if (slot.status === "FULL" || slot.capacity <= 0) return;
    setSelectedSlot(slot);
  };

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = selectedDate === todayStr;

  const renderSlotItem = (slot: RoomSlot) => {
    const slotId = slot.slot_id || (slot as any).id || "";
    const sTime = slot.start_time || (slot as any).startTime || "";
    const eTime = slot.end_time || (slot as any).endTime || sTime;

    let isPastSlot = false;
    if (isToday && sTime) {
      const parts = sTime.split(":");
      if (parts.length >= 2) {
        const slotHours = parseInt(parts[0], 10);
        const slotMinutes = parseInt(parts[1], 10);
        if (
          slotHours < currentHours ||
          (slotHours === currentHours && slotMinutes <= currentMinutes)
        ) {
          isPastSlot = true;
        }
      }
    }

    const isAvailable =
      (slot.status === "AVAILABLE" || slot.capacity > 0) &&
      slot.status !== "FULL" &&
      !isPastSlot;
    const isSelected = selectedSlot?.slot_id === slotId;

    return (
      <TouchableOpacity
        key={slotId}
        disabled={!isAvailable}
        onPress={() => isAvailable && handleSelectSlot(slot)}
        activeOpacity={0.7}
        style={[
          styles.slotButton,
          isSelected ? styles.slotButtonSelected : !isAvailable ? styles.slotButtonDisabled : styles.slotButtonDefault,
        ]}
      >
        <Text
          style={[
            styles.slotStartText,
            isSelected ? styles.textWhite : !isAvailable ? styles.textDisabled : styles.textDark,
          ]}
        >
          {sTime}
        </Text>

        <View
          style={[
            styles.slotDivider,
            isSelected ? styles.slotDividerSelected : styles.slotDividerDefault,
          ]}
        />

        <Text
          style={[
            styles.slotEndText,
            isSelected ? styles.textWhite : !isAvailable ? styles.textDisabled : styles.textMuted,
          ]}
        >
          {eTime}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleRegisterPackage = async () => {
    if (!patientId || !packageId || !selectedSlot) {
      AppAlert.info("Vui lòng chọn ngày và giờ khám hợp lệ.");
      return;
    }

    setIsBooking(true);
    try {
      const res = await packageService.createBookingWithPackage(
        patientId,
        selectedSlot.slot_id,
        packageId
      );

      console.log("[PackageBooking] createBookingWithPackage response:", JSON.stringify(res));

      const rawData = (res as any)?.data || res || {};
      const bookingId = rawData?.booking_id || "";
      const serviceOrderId = rawData?.service_order_id || "";
      const paymentObj = rawData?.payment?.data || rawData?.payment || {};

      if (paymentObj && (paymentObj.qrCode || paymentObj.checkoutUrl || paymentObj.accountNumber)) {
        const pkgDoctor = rawData?.doctor || "Bác sĩ phụ trách";
        const pkgRoom =
          rawData?.room ||
          (selectedSlot as any)?.shift?.room?.room_name ||
          (selectedSlot as any)?.room?.room_name ||
          "Phòng khám gói";
        const pkgTicketCode = rawData?.ticket_code || "";

        router.push({
          pathname: "/(patient)/visit/payment-qr",
          params: {
            stepId: rawData?.step_id || "",
            bookingId: bookingId,
            serviceOrderId: serviceOrderId,
            ticketCode: pkgTicketCode,
            bin: paymentObj.bin || "",
            accountNumber: paymentObj.accountNumber || "",
            accountName: paymentObj.accountName || "",
            amount: (paymentObj.amount || rawData?.amount || packagePrice || 0).toString(),
            description: paymentObj.description || `Thanh toán ${packageName}`,
            checkoutUrl: paymentObj.checkoutUrl || "",
            qrCode: paymentObj.qrCode || "",
            orderCode: (paymentObj.orderCode || "").toString(),
            ordercode: (paymentObj.orderCode || "").toString(),
            specialtyName: rawData?.package_name || packageName,
            doctorName: pkgDoctor,
            roomName: pkgRoom,
            selectedDate: selectedDate,
            slotTime: selectedSlot.start_time,
            patientName: patientName || "Bệnh nhân",
            patientId: patientId,
            isPackageBooking: "true",
            queueNumber: "GÓI KHÁM",
          },
        });
      } else {
        const code = bookingId || serviceOrderId || "";
        setCreatedBookingCode(code);
        setIsSuccessModalVisible(true);
      }
    } catch (err: any) {
      console.error("[PackageBooking] Error registering package:", err);
      AppAlert.error(
        err?.message || "Hệ thống gặp sự cố khi đăng ký gói khám. Vui lòng thử lại sau!",
        "Đăng ký thất bại"
      );
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-between bg-[#F8FAFC]">
        
        <View
          style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
          className="flex-row items-center justify-between px-5 pb-3 bg-white border-b border-gray-100/80"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.neutral700} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-gray-800 text-[17px] font-bold">
              Chọn lịch khám gói
            </Text>
            {patientName ? (
              <Text className="text-primary text-[11px] font-semibold mt-0.5">
                Bệnh nhân: {patientName}
              </Text>
            ) : null}
          </View>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          
          <View className="mx-5 mt-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-gray-800 text-[15px] font-extrabold" numberOfLines={1}>
                {packageName}
              </Text>
              <Text className="text-primary text-[13px] font-bold mt-1">
                Đơn giá: {formatVND(packagePrice)}
              </Text>
            </View>
            <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100/60">
              <Text className="text-primary text-[10px] font-extrabold uppercase">
                Khám Trọn Gói
              </Text>
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-gray-800 text-[14px] font-extrabold px-5 mb-3">
              Chọn ngày khám
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, flexDirection: "row" }}
            >
              {datesList.map((item) => {
                const isSelected = item.dateStr === selectedDate;
                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    onPress={() => handleSelectDate(item.dateStr)}
                    activeOpacity={0.7}
                    style={[
                      styles.dateButton,
                      isSelected ? styles.dateButtonSelected : styles.dateButtonDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateLabelText,
                        isSelected ? styles.textWhite : styles.textMuted,
                      ]}
                    >
                      {item.dayLabel}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumText,
                        isSelected ? styles.textWhite : styles.textDark,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="mt-6 px-5 mb-28">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-800 text-[14px] font-extrabold">
                Chọn giờ khám
              </Text>
              <Text className="text-primary text-[12px] font-bold">
                {formatDate(selectedDate)}
              </Text>
            </View>

            {isFetchingSlots ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text className="text-gray-400 text-xs font-bold mt-2">
                  Đang tìm kiếm ca khám trống...
                </Text>
              </View>
            ) : slots.length === 0 ? (
              <View className="py-10 bg-white rounded-3xl border border-slate-100 shadow-sm items-center justify-center px-6">
                <Ionicons name="calendar-outline" size={36} color="#CBD5E1" />
                <Text className="text-gray-400 text-xs font-semibold text-center mt-2.5 leading-5">
                  Không còn ca khám nào trống trong ngày này. Vui lòng chọn ngày khác!
                </Text>
              </View>
            ) : (
              <View className="gap-6">
                
                {morningSlots.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="w-6 h-6 rounded-full bg-amber-50 items-center justify-center border border-amber-100">
                        <Ionicons name="sunny-outline" size={13} color="#D97706" />
                      </View>
                      <Text className="text-gray-800 text-[13px] font-bold">
                        Buổi sáng
                      </Text>
                    </View>

                    <View style={styles.slotsGrid}>
                      {morningSlots.map((slot: RoomSlot) => renderSlotItem(slot))}
                    </View>
                  </View>
                )}

                {afternoonSlots.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="w-6 h-6 rounded-full bg-blue-50 items-center justify-center border border-blue-100">
                        <Ionicons name="partly-sunny-outline" size={13} color={Colors.primary} />
                      </View>
                      <Text className="text-gray-800 text-[13px] font-bold">
                        Buổi chiều
                      </Text>
                    </View>

                    <View style={styles.slotsGrid}>
                      {afternoonSlots.map((slot: RoomSlot) => renderSlotItem(slot))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View className="p-5 bg-white border-t border-slate-100 flex-row justify-between items-center shadow-lg">
          <View className="flex-1 pr-4">
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">
              Ca khám đã chọn
            </Text>
            <Text className="text-gray-800 text-[15px] font-black mt-0.5" numberOfLines={1}>
              {selectedSlot
                ? `${selectedSlot.start_time} (${formatDate(selectedDate)})`
                : "Chưa chọn khung giờ"}
            </Text>
          </View>
          <View className="w-48">
            <AppButton
              title="Xác nhận đăng ký"
              variant="primary"
              isLoading={isBooking}
              disabled={!selectedSlot || isBooking}
              onPress={handleRegisterPackage}
            />
          </View>
        </View>

        <Modal
          visible={isSuccessModalVisible}
          transparent
          animationType="fade"
        >
          <View
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            className="flex-1 items-center justify-center p-6"
          >
            <View className="bg-white rounded-[32px] p-6 items-center text-center max-w-sm w-full shadow-lg">
              <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-4 border border-emerald-100/50">
                <Ionicons name="checkmark-circle" size={44} color="#10B981" />
              </View>
              <Text className="text-gray-800 text-[18px] font-extrabold text-center">
                Đăng ký Gói khám thành công!
              </Text>
              <Text className="text-gray-500 text-xs font-medium text-center mt-2 leading-5">
                Bạn đã đăng ký giữ chỗ gói khám thành công. Vui lòng di chuyển đến Quầy Thu ngân của bệnh viện để thanh toán và bắt đầu khám bệnh.
              </Text>

              {createdBookingCode ? (
                <View className="bg-gray-50 rounded-2xl p-3 my-4 w-full flex-row justify-between items-center px-4 border border-gray-100">
                  <Text className="text-gray-400 text-xs font-bold">Mã Booking</Text>
                  <Text className="text-primary text-[14px] font-extrabold">{createdBookingCode}</Text>
                </View>
              ) : null}

              <View className="w-full mt-2">
                <AppButton
                  title="Về trang chủ"
                  variant="primary"
                  onPress={() => {
                    setIsSuccessModalVisible(false);
                    router.dismissAll();
                    router.replace("/(patient)/(tabs)/home");
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    borderWidth: 1,
  },
  dateButtonDefault: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F1F5F9",
  },
  dateButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateLabelText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dateNumText: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotButton: {
    width: "22.5%",
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  slotButtonDefault: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F1F5F9",
  },
  slotButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F1F5F9",
    opacity: 0.4,
  },
  slotStartText: {
    fontSize: 14,
    fontWeight: "800",
  },
  slotDivider: {
    width: 20,
    height: 1.5,
    marginVertical: 4,
  },
  slotDividerDefault: {
    backgroundColor: "#E2E8F0",
  },
  slotDividerSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  slotEndText: {
    fontSize: 10,
    fontWeight: "700",
  },
  textWhite: {
    color: "#FFFFFF",
  },
  textDark: {
    color: "#1E293B",
  },
  textMuted: {
    color: "#94A3B8",
  },
  textDisabled: {
    color: "#CBD5E1",
  },
});
