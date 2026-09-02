import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatVND, getQrCodeUrl } from "@/shared/utils/string.utils";
import { formatDateTime } from "@/shared/utils/date.utils";

export interface PrescriptionDetailViewProps {
  prescription?: any;
  showHeaderInfo?: boolean;
}

export function PrescriptionDetailView({
  prescription,
  showHeaderInfo = true,
}: PrescriptionDetailViewProps) {
  if (!prescription) {
    return (
      <View className="flex-1 justify-center items-center px-6 py-12">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Ionicons name="medkit-outline" size={36} color="#4B5563" />
        </View>
        <Text className="text-gray-900 text-base font-bold mb-1.5 text-center">
          Chưa có đơn thuốc của phiên khám này
        </Text>
        <Text className="text-gray-400 text-xs text-center px-6 leading-5">
          Sau khi hoàn tất quá trình khám, bác sĩ sẽ kê đơn và đơn thuốc sẽ xuất hiện tại đây.
        </Text>
      </View>
    );
  }

  const details = prescription.prescriptionDetails || prescription.details || [];
  const qrData =
    prescription.prescription_code ||
    prescription.prescription_id ||
    prescription.id ||
    "";
  const prescriptionQrUrl = qrData ? getQrCodeUrl(qrData, 240) : null;

  return (
    <View className="gap-4">
      {/* Header Info: 1 bên là thông tin, 1 bên là mã QR tạo từ mã đơn thuốc, kèm dòng Lời dặn của Bác sĩ ở dưới */}
      {showHeaderInfo && (prescription.prescription_code || prescription.doctor || prescription.created_at || prescription.diagnosis_note) && (
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              Thông tin đơn thuốc
            </Text>
            {prescription.prescription_code ? (
              <Text className="text-gray-900 font-bold text-xs font-mono">
                {prescription.prescription_code}
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center pt-3.5 gap-4">
            {/* Bên trái: Thông tin đơn thuốc */}
            <View className="flex-1 gap-2.5 justify-center">
              <View>
                <Text className="text-gray-400 text-[11px] font-semibold">Mã đơn thuốc</Text>
                <Text className="text-gray-800 text-[13px] font-bold font-mono mt-0.5">
                  {prescription.prescription_code || "—"}
                </Text>
              </View>

              {prescription.doctor?.full_name && (
                <View>
                  <Text className="text-gray-400 text-[11px] font-semibold">Bác sĩ kê đơn</Text>
                  <Text className="text-gray-800 text-[13px] font-bold mt-0.5">
                    BS. {prescription.doctor.full_name}
                  </Text>
                </View>
              )}

              {prescription.created_at && (
                <View>
                  <Text className="text-gray-400 text-[11px] font-semibold">Ngày kê đơn</Text>
                  <Text className="text-gray-800 text-[12px] font-semibold mt-0.5">
                    {formatDateTime(prescription.created_at)}
                  </Text>
                </View>
              )}
            </View>

            {/* Bên phải: Mã QR được tạo từ mã đơn thuốc */}
            {prescriptionQrUrl ? (
              <View className="items-center justify-center p-2.5 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm shrink-0">
                <Image
                  source={{ uri: prescriptionQrUrl }}
                  style={{ width: 88, height: 88 }}
                  resizeMode="contain"
                />
                <Text className="text-gray-400 text-[9px] font-bold mt-1 text-center">
                  Quét lấy thuốc
                </Text>
              </View>
            ) : null}
          </View>

          {/* Dòng Lời dặn của Bác sĩ trực tiếp dưới thẻ thông tin */}
          {prescription.diagnosis_note ? (
            <View className="mt-3.5 pt-3 border-t border-gray-100">
              <Text className="text-gray-400 text-[11px] font-semibold">
                Lời dặn của Bác sĩ:
              </Text>
              <Text className="text-gray-800 text-[13px] font-medium leading-[19px] mt-1">
                {prescription.diagnosis_note}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Danh mục thuốc */}
      <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between pb-3.5 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons name="list" size={18} color="#111827" />
            <Text className="text-gray-900 text-[15px] font-black">
              Danh mục thuốc ({details.length})
            </Text>
          </View>
        </View>

        {details.length > 0 ? (
          <View>
            {details.map((item: any, idx: number) => {
              const medicineName =
                item.medicine?.medicine_name || item.medicine_name || `Thuốc ${idx + 1}`;
              const unit = item.medicine?.unit || item.unit || "Đơn vị";
              const hasUnitPrice = item.unit_price !== undefined && item.unit_price !== null;
              const isLast = idx === details.length - 1;

              return (
                <View
                  key={item.prescription_detail_id || idx}
                  className={`py-3.5 ${!isLast ? "border-b border-gray-100/80" : ""}`}
                >
                  {/* Dòng 1: Tên thuốc và Số lượng (Màu đen) */}
                  <View className="flex-row justify-between items-start">
                    <Text className="text-gray-900 text-[14px] font-bold flex-1 mr-3 leading-5">
                      {idx + 1}. {medicineName}
                    </Text>
                    <Text className="text-gray-900 text-[13px] font-bold shrink-0">
                      x{item.quantity} {unit}
                    </Text>
                  </View>

                  {/* Dòng 2: Hướng dẫn dùng thuốc */}
                  {item.dosage_instruction ? (
                    <Text className="text-gray-500 text-[12.5px] font-medium leading-[18px] mt-1 pl-4">
                      {item.dosage_instruction}
                    </Text>
                  ) : null}

                  {/* Dòng 3: Đơn giá của thuốc */}
                  {hasUnitPrice && (
                    <View className="flex-row items-center mt-1.5 pl-4">
                      <Text className="text-gray-400 text-[11px] font-medium">
                        Đơn giá: <Text className="text-gray-700 font-semibold">{formatVND(item.unit_price)}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text className="text-gray-400 text-xs text-center py-5">
            Không có chi tiết danh mục thuốc.
          </Text>
        )}

        {/* Tổng tiền thuốc của nguyên đơn (Màu đen) */}
        {typeof prescription.total_amount === "number" && (
          <View className="mt-2 pt-3.5 border-t border-gray-100 flex-row justify-between items-center">
            <Text className="text-gray-700 text-sm font-bold">Tổng tiền thuốc:</Text>
            <Text className="text-gray-900 text-base font-black">
              {formatVND(prescription.total_amount)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
