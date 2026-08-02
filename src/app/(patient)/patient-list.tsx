import { useEkyc } from "@/features/ekyc/hooks/useEkyc";
import type { EkycOcrObject } from "@/features/ekyc/types/ekyc.types";
import { usePatient } from "@/features/patient/hooks/usePatient";
import { Patient } from "@/features/patient/types/patient.types";
import { AppButton } from "@/shared/components/AppButton";
import { AppInput } from "@/shared/components/AppInput";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PatientListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    patients,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    clearError,
    fetchPatients,
    createPatientFromEkyc,
    updatePatient,
    deletePatient,
    getPatientDetail,
  } = usePatient();

  
  const [isEkycVisible, setIsEkycVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  
  const [editForm, setEditForm] = useState({
    fullName: "",
    gender: "" as "MALE" | "FEMALE" | "",
    dob: "",
    medicalCoverageId: "",
  });
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editPickerDate, setEditPickerDate] = useState(new Date());

  
  const handleEkycSuccess = useCallback(
    async (ocrData: EkycOcrObject) => {
      const res = await createPatientFromEkyc(ocrData);
      if (res.success) {
        setIsEkycVisible(false);
        Alert.alert("Thành công", "Hồ sơ bệnh nhân đã được tạo từ CCCD.");
      } else {
        Alert.alert("Thất bại", res.message || "Không thể tạo bệnh nhân. Vui lòng thử lại.");
      }
    },
    [createPatientFromEkyc]
  );

  const { isLoading: isEkycLoading, handleLaunchEkyc } = useEkyc(handleEkycSuccess);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleRefresh = () => {
    fetchPatients();
  };

  const handleSelectPatient = async (patientId: string) => {
    setIsFetchingDetail(true);
    try {
      const detail = await getPatientDetail(patientId);
      if (detail) {
        setSelectedPatient(detail);
        setIsDetailVisible(true);
      } else {
        Alert.alert("Lỗi", error || "Không thể tải chi tiết bệnh nhân.");
      }
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEkycVisible(true);
  };

  const handleOpenUpdate = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      fullName: patient.full_name,
      gender: patient.gender,
      dob: patient.dob ? patient.dob.split("T")[0] : "",
      medicalCoverageId: patient.medical_coverage_id || "",
    });
    setEditPickerDate(patient.dob ? new Date(patient.dob) : new Date());
    setIsEditVisible(true);
  };

  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEditPickerDate(selectedDate);
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      setEditForm((prev) => ({ ...prev, dob: `${y}-${m}-${d}` }));
    }
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    } catch {
      return dateString;
    }
  };

  const validateAndUpdate = async () => {
    if (!selectedPatient) return;
    const { fullName, gender, dob } = editForm;

    if (!fullName.trim() || !gender || !dob) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tất cả các trường.");
      return;
    }

    const success = await updatePatient(selectedPatient.patient_id, {
      full_name: fullName.trim(),
      gender: gender as "MALE" | "FEMALE",
      dob,
      medical_coverage_id: editForm.medicalCoverageId,
    });

    if (success) {
      Alert.alert("Thành công", "Cập nhật bệnh nhân thành công.");
      setIsEditVisible(false);
    } else {
      Alert.alert("Thất bại", error || "Đã xảy ra lỗi khi cập nhật bệnh nhân.");
    }
  };

  const confirmDelete = (patientId: string, fullName: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa bệnh nhân "${fullName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const success = await deletePatient(patientId);
            if (success) {
              Alert.alert("Thành công", "Đã xóa bệnh nhân thành công.");
            } else {
              Alert.alert("Thất bại", error || "Không thể xóa bệnh nhân.");
            }
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "BN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getGenderText = (gender?: string) => {
    if (!gender) return "Chưa xác định";
    return gender.toUpperCase() === "MALE" ? "Nam" : "Nữ";
  };

  
  const renderRightActions = (patient: Patient, progress: any, dragX: any, swipeable: any) => {
    return (
      <View className="flex-row h-full ml-3 bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-200">
        <Pressable
          onPress={() => {
            swipeable.close();
            handleOpenUpdate(patient);
          }}
          className="bg-blue-50 w-16 justify-center items-center active:opacity-75"
        >
          <SymbolView
            name={{ ios: "pencil", android: "edit" }}
            size={18}
            tintColor="#3B82F6"
          />
          <Text className="text-[#3B82F6] text-[10px] font-bold mt-1">Sửa</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            swipeable.close();
            confirmDelete(patient.patient_id, patient.full_name);
          }}
          className="bg-red-50 w-16 justify-center items-center active:opacity-75"
        >
          <SymbolView
            name={{ ios: "trash", android: "delete" }}
            size={18}
            tintColor="#EF4444"
          />
          <Text className="text-red-500 text-[10px] font-bold mt-1">Xóa</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenWrapper edges={["bottom", "left", "right"]}>
      {/* ── Immersive Header ── */}
      <View
        className="bg-primary rounded-b-[28px] px-6 pb-6 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:opacity-70"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "chevron_left" }}
              size={20}
              tintColor="#FFFFFF"
            />
          </Pressable>
          <Text className="text-white text-xl font-bold tracking-tight">Hồ Sơ Khám Bệnh</Text>
        </View>

        <Pressable
          onPress={handleOpenCreate}
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SymbolView
            name={{ ios: "plus", android: "add" }}
            size={22}
            tintColor="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* ── Body Content ── */}
      <View className="flex-1 px-5 pt-4">
        {(isLoading && patients.length === 0) || isDeleting ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#84AFEB" />
            <Text className="text-gray-400 text-xs mt-2">
              {isDeleting ? "Đang thực hiện xóa..." : "Đang tải danh sách..."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.patient_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#84AFEB" />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mt-4">
                <SymbolView
                  name={{ ios: "person.2.slash", android: "people_outline" }}
                  size={48}
                  tintColor="#9CA3AF"
                />
                <Text className="text-gray-500 font-semibold text-[15px] mt-4">
                  Chưa có bệnh nhân nào
                </Text>
                <Text className="text-gray-400 text-xs text-center mt-2 px-6">
                  Vui lòng nhấn nút "+" ở góc trên bên phải để thêm bệnh nhân mới vào tài khoản của bạn.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={(prog, drag, sw) => renderRightActions(item, prog, drag, sw)}
                containerStyle={{ marginBottom: 12 }}
              >
                <Pressable
                  onPress={() => handleSelectPatient(item.patient_id)}
                  className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-neutral-100 shadow-sm active:opacity-75"
                >
                  {/* Initial Avatar */}
                  <View className="bg-primary/10 w-12 h-12 rounded-xl items-center justify-center">
                    <Text className="text-primary font-bold text-base">
                      {getInitials(item.full_name)}
                    </Text>
                  </View>

                  {/* Patient Info */}
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold text-[15px]">{item.full_name}</Text>
                    <View className="flex-row items-center gap-2 mt-1.5">
                      <Text className="text-gray-400 text-xs">CCCD: {item.citizen_id}</Text>
                      <View className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                      <Text className="text-gray-400 text-xs">
                        {getGenderText(item.gender)}
                      </Text>
                    </View>
                  </View>

                  {/* Right Arrow */}
                  <SymbolView
                    name={{ ios: "chevron.right", android: "chevron_right" }}
                    size={16}
                    tintColor="#9CA3AF"
                  />
                </Pressable>
              </Swipeable>
            )}
          />
        )}
      </View>

      {/* Global Fetch Detail Loading Overlay */}
      {isFetchingDetail && (
        <View className="absolute inset-0 bg-black/10 items-center justify-center z-50">
          <View className="bg-white p-4 rounded-2xl flex-row items-center gap-3 shadow-md">
            <ActivityIndicator size="small" color="#84AFEB" />
            <Text className="text-gray-700 text-sm font-medium">Đang tải thông tin...</Text>
          </View>
        </View>
      )}

      {/* ── Popup: Tạo bệnh nhân qua eKYC ── */}
      <Modal
        visible={isEkycVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isEkycLoading && !isCreating) setIsEkycVisible(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-[28px] overflow-hidden">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-800 text-xl font-bold">Thêm hồ sơ bệnh nhân</Text>
                <Pressable
                  onPress={() => setIsEkycVisible(false)}
                  disabled={isEkycLoading || isCreating}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SymbolView
                    name={{ ios: "xmark.circle.fill", android: "cancel" }}
                    size={24}
                    tintColor={isEkycLoading || isCreating ? "#D1D5DB" : "#9CA3AF"}
                  />
                </Pressable>
              </View>

              {/* Icon & Intro */}
              <View className="items-center mb-6">
                <View className="bg-primary/10 w-24 h-24 rounded-3xl items-center justify-center mb-4">
                  <SymbolView
                    name={{ ios: "creditcard.viewfinder", android: "badge" }}
                    size={48}
                    tintColor="#84AFEB"
                  />
                </View>
                <Text className="text-gray-800 text-lg font-bold text-center mb-1">
                  Xác thực CCCD
                </Text>
              </View>

              {/* Lưu ý */}
              <View className="bg-blue-50 rounded-2xl p-4 mb-6 gap-y-2">
                <Text className="text-blue-700 font-bold text-xs mb-1">Lưu ý trước khi quét:</Text>
                <View className="flex-row items-start gap-2">
                  <Text className="text-blue-500 text-xs">•</Text>
                  <Text className="text-blue-600 text-xs flex-1">Cần cấp quyền Camera và ghi âm</Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-blue-500 text-xs">•</Text>
                  <Text className="text-blue-600 text-xs flex-1">
                    Thông tin sẽ được lấy trực tiếp từ CCCD của bạn
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-blue-500 text-xs">•</Text>
                  <Text className="text-blue-600 text-xs flex-1">
                    Bảo hiểm y tế có thể cập nhật sau trong phần chỉnh sửa hồ sơ
                  </Text>
                </View>
              </View>

              {/* Trạng thái đang tạo bệnh nhân */}
              {isCreating && (
                <View className="bg-green-50 rounded-2xl p-4 flex-row items-center gap-3 mb-4">
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text className="text-green-700 text-sm font-medium flex-1">
                    Đang tạo hồ sơ bệnh nhân...
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View className="gap-2">
                <Pressable
                  onPress={handleLaunchEkyc}
                  disabled={isEkycLoading || isCreating}
                  className={`h-[52px] rounded-xl items-center justify-center flex-row gap-2 ${isEkycLoading || isCreating ? "bg-gray-300" : "bg-primary active:opacity-90"
                    }`}
                >
                  {isEkycLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <SymbolView
                        name={{ ios: "camera.viewfinder", android: "camera_alt" }}
                        size={18}
                        tintColor="#FFFFFF"
                      />
                      <Text className="text-white font-bold text-[15px]">
                        Bắt đầu quét eKYC
                      </Text>
                    </>
                  )}
                </Pressable>
                <AppButton
                  title="Hủy"
                  variant="secondary"
                  onPress={() => setIsEkycVisible(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Popup: Cập nhật thông tin bệnh nhân ── */}
      <Modal
        visible={isEditVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-[28px] overflow-hidden">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-800 text-xl font-bold">Cập nhật thông tin</Text>
                <Pressable
                  onPress={() => setIsEditVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SymbolView
                    name={{ ios: "xmark.circle.fill", android: "cancel" }}
                    size={24}
                    tintColor="#9CA3AF"
                  />
                </Pressable>
              </View>

              {/* Họ và tên */}
              <View className="border border-neutral-200 rounded-xl px-4 h-[52px] mb-3.5 justify-center">
                <Text
                  className={editForm.fullName ? "text-sm text-neutral-700" : "text-sm text-neutral-400"}
                  onPress={() => { }}
                >
                  {editForm.fullName || "Họ và tên bệnh nhân"}
                </Text>
              </View>

              {/* Ngày sinh trigger */}
              <Pressable
                onPress={() => setShowEditDatePicker(true)}
                className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-4 h-[52px] mb-3.5 active:opacity-75"
              >
                <Text
                  className={
                    editForm.dob
                      ? "flex-1 text-sm text-neutral-700"
                      : "flex-1 text-sm text-neutral-400"
                  }
                >
                  {editForm.dob ? formatDisplayDate(editForm.dob) : "Ngày sinh bệnh nhân"}
                </Text>
                <Text className="text-base text-neutral-400">📅</Text>
              </Pressable>

              {/* Giới tính toggle */}
              <View className="flex-row gap-3 mb-6">
                <Pressable
                  className={
                    editForm.gender === "MALE"
                      ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center"
                      : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center"
                  }
                  onPress={() => setEditForm((p) => ({ ...p, gender: "MALE" }))}
                >
                  <Text
                    className={
                      editForm.gender === "MALE"
                        ? "text-primary font-bold text-sm"
                        : "text-neutral-400 font-medium text-sm"
                    }
                  >
                    Nam
                  </Text>
                </Pressable>
                <Pressable
                  className={
                    editForm.gender === "FEMALE"
                      ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center"
                      : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center"
                  }
                  onPress={() => setEditForm((p) => ({ ...p, gender: "FEMALE" }))}
                >
                  <Text
                    className={
                      editForm.gender === "FEMALE"
                        ? "text-primary font-bold text-sm"
                        : "text-neutral-400 font-medium text-sm"
                    }
                  >
                    Nữ
                  </Text>
                </Pressable>
              </View>
<AppInput
  placeholder="Mã bảo hiểm y tế"
  value={editForm.medicalCoverageId}
  onChangeText={(v) => setEditForm((p) => ({ ...p, medicalCoverageId: v }))}
/>

              {/* Actions */}
              <View className="gap-2">
                <AppButton
                  title="Lưu thay đổi"
                  variant="primary"
                  isLoading={isUpdating}
                  onPress={validateAndUpdate}
                />
                <AppButton
                  title="Hủy"
                  variant="secondary"
                  onPress={() => setIsEditVisible(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Popup: Chi tiết bệnh nhân ── */}
      <Modal
        visible={isDetailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-[28px] p-6">
            {/* Header info */}
            <View className="items-center mb-6">
              <View className="bg-primary/10 w-20 h-20 rounded-2xl items-center justify-center mb-4">
                <Text className="text-primary font-bold text-2xl">
                  {getInitials(selectedPatient?.full_name)}
                </Text>
              </View>
              <Text className="text-gray-800 text-lg font-bold">
                {selectedPatient?.full_name}
              </Text>
              <Text className="text-primary text-xs font-semibold mt-1">
                {getGenderText(selectedPatient?.gender)}
              </Text>
            </View>

            {/* Detailed details fields */}
            <View className="bg-neutral-50 rounded-2xl p-4 gap-y-3 mb-6">
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-xs">Ngày sinh</Text>
                <Text className="text-gray-700 text-xs font-bold">
                  {formatDisplayDate(selectedPatient?.dob)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-xs">Số CCCD / CMND</Text>
                <Text className="text-gray-700 text-xs font-bold">
                  {selectedPatient?.citizen_id}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-xs">Mã Bảo hiểm Y tế</Text>
                <Text className="text-gray-700 text-xs font-bold">
                  {selectedPatient?.medical_coverage_id || "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <AppButton
              title="Đóng"
              variant="primary"
              onPress={() => setIsDetailVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
