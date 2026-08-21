import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Colors } from "@/config/colors";
import { packageService } from "@/features/booking/services/package.service";
import { RoomSlot } from "@/features/booking/types/package.types";

interface DateItem {
  dateStr: string; // YYYY-MM-DD
  dayNum: string;  // e.g. "05"
  dayLabel: string; // e.g. "Th 4" or "Hôm nay"
}

export function PackageBookingView() {
  const router = useRouter();
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

      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const dayVal = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayVal}`;

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
      const list = (res as any)?.data || res || [];
      const available = (Array.isArray(list) ? list : []).filter(
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

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleSelectSlot = (slot: RoomSlot) => {
    setSelectedSlot(slot);
  };

  const handleRegisterPackage = async () => {
    if (!patientId || !packageId || !selectedSlot) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày và giờ khám hợp lệ.");
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
      const paymentObj = rawData?.payment?.data || rawData?.payment || {};

      if (paymentObj && (paymentObj.qrCode || paymentObj.checkoutUrl || paymentObj.accountNumber)) {
        router.push({
          pathname: "/(patient)/visit/payment-qr",
          params: {
            stepId: rawData?.step_id || "",
            bookingId: bookingId,
            bin: paymentObj.bin || "",
            accountNumber: paymentObj.accountNumber || "",
            accountName: paymentObj.accountName || "",
            amount: (paymentObj.amount || packagePrice || 0).toString(),
            description: paymentObj.description || `Thanh toán ${packageName}`,
            checkoutUrl: paymentObj.checkoutUrl || "",
            qrCode: paymentObj.qrCode || "",
            orderCode: (paymentObj.orderCode || "").toString(),
            ordercode: (paymentObj.orderCode || "").toString(),
            specialtyName: packageName,
            doctorName: "Gói khám sức khỏe",
            selectedDate: selectedDate,
            slotTime: selectedSlot.start_time,
            patientName: patientName || "Bệnh nhân",
            patientId: patientId,
            isPackageBooking: "true",
            queueNumber: "GÓI KHÁM",
          },
        });
      } else {
        const code = bookingId || rawData?.service_order_id || "";
        setCreatedBookingCode(code);
        setIsSuccessModalVisible(true);
      }
    } catch (err: any) {
      console.error("[PackageBooking] Error registering package:", err);
      Alert.alert(
        "Đăng ký thất bại",
        err?.message || "Hệ thống gặp sự cố khi đăng ký gói khám. Vui lòng thử lại sau!"
      );
    } finally {
      setIsBooking(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + " đ";
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <ScreenWrapper edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-1 bg-gray-50">
        {/* ── 1. HEADER ── */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.neutral700} />
          </TouchableOpacity>
          <Text className="text-gray-800 text-[17px] font-bold">
            Chọn lịch khám gói
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* ── 2. TỔNG QUAN GÓI ĐÃ CHỌN ── */}
          <View className="mx-5 bg-white rounded-[24px] p-4 border border-gray-100 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-gray-800 text-[15px] font-extrabold" numberOfLines={1}>
                {packageName}
              </Text>
              <Text className="text-teal-600 text-[13px] font-bold mt-1">
                Đơn giá: {formatPrice(packagePrice)}
              </Text>
            </View>
            <View className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100">
              <Text className="text-teal-700 text-[10px] font-black uppercase">
                Khám Trọn Gói
              </Text>
            </View>
          </View>

          {/* ── 3. CHỌN NGÀY ── */}
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
                    className={`mx-1 py-3 px-4 rounded-2xl items-center justify-center min-w-[70px] border ${isSelected
                        ? "bg-teal-600 border-teal-600"
                        : "bg-white border-gray-100"
                      }`}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: isSelected ? "#FFFFFF" : "#9CA3AF" }}
                    >
                      {item.dayLabel}
                    </Text>
                    <Text
                      className="text-[18px] font-black mt-0.5"
                      style={{ color: isSelected ? "#FFFFFF" : "#1F2937" }}
                    >
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 4. CHỌN KHUNG GIỜ ── */}
          <View className="mt-6 px-5 mb-10">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-800 text-[14px] font-extrabold">
                Chọn giờ khám
              </Text>
              <Text className="text-gray-400 text-[11px] font-bold">
                {formatDateDisplay(selectedDate)}
              </Text>
            </View>

            {isFetchingSlots ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#0D9488" />
                <Text className="text-gray-400 text-xs font-bold mt-2">
                  Đang tìm kiếm ca khám trống...
                </Text>
              </View>
            ) : slots.length === 0 ? (
              <View className="py-10 bg-white rounded-2xl border border-gray-100 items-center justify-center px-6">
                <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                <Text className="text-gray-400 text-xs font-bold text-center mt-2.5">
                  Không còn ca khám nào trống trong ngày này. Vui lòng chọn ngày khác!
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2.5">
                {slots.map((item) => {
                  const isSelected = selectedSlot?.slot_id === item.slot_id;
                  const isFull = item.status === "FULL" || item.capacity <= 0;

                  return (
                    <TouchableOpacity
                      key={item.slot_id}
                      onPress={() => !isFull && handleSelectSlot(item)}
                      disabled={isFull}
                      activeOpacity={0.7}
                      style={{ width: "31%" }}
                      className={`py-3 px-1 rounded-xl items-center justify-center border ${isSelected
                          ? "bg-teal-600 border-teal-600"
                          : isFull
                            ? "bg-gray-100 border-gray-200"
                            : "bg-white border-gray-200"
                        }`}
                    >
                      <Text
                        className="text-[12px] font-black"
                        style={{ color: isSelected ? "#FFFFFF" : isFull ? "#9CA3AF" : "#374151" }}
                      >
                        {item.start_time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── 5. CONFIRM STICKY BAR ── */}
        <View className="p-5 bg-white border-t border-gray-100 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">
              Ca khám đã chọn
            </Text>
            <Text className="text-gray-800 text-[15px] font-black mt-0.5" numberOfLines={1}>
              {selectedSlot
                ? `${selectedSlot.start_time} (${formatDateDisplay(selectedDate)})`
                : "Chưa chọn khung giờ"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRegisterPackage}
            disabled={!selectedSlot || isBooking}
            activeOpacity={0.8}
            className={`px-8 py-3.5 rounded-2xl flex-row items-center justify-center ${selectedSlot && !isBooking ? "bg-teal-600" : "bg-gray-300"
              }`}
          >
            {isBooking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-sm font-black">Xác nhận đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── 6. SUCCESS DIALOG ── */}
        <Modal
          visible={isSuccessModalVisible}
          transparent
          animationType="fade"
        >
          <View
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            className="flex-1 items-center justify-center p-6"
          >
            <View className="bg-white rounded-[32px] p-6 items-center text-center max-w-sm w-full">
              <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text className="text-gray-800 text-[18px] font-black text-center">
                Đăng ký Gói khám thành công!
              </Text>
              <Text className="text-gray-500 text-xs font-semibold text-center mt-2 leading-5">
                Bạn đã đăng ký giữ chỗ gói khám thành công. Vui lòng di chuyển đến Quầy Thu ngân của bệnh viện để thanh toán và bắt đầu khám bệnh.
              </Text>

              {createdBookingCode ? (
                <View className="bg-gray-50 rounded-xl p-3 my-4 w-full flex-row justify-between items-center px-4 border border-gray-100">
                  <Text className="text-gray-400 text-xs font-bold">Mã Booking</Text>
                  <Text className="text-primary text-[14px] font-extrabold">{createdBookingCode}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.dismissAll();
                  router.replace("/(patient)/(tabs)/home");
                }}
                activeOpacity={0.8}
                className="bg-primary w-full py-3.5 rounded-2xl mt-2"
              >
                <Text className="text-white text-center text-sm font-black">
                  Về trang chủ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}
