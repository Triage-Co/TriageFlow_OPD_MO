import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { AppInput } from "@/shared/components/AppInput";
import { AppButton } from "@/shared/components/AppButton";
import { usePatient } from "@/features/patient/hooks/usePatient";
import { Patient } from "@/features/patient/types/patient.types";
import { Gender } from "@/features/auth/types/auth.types";

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
    createPatient,
    updatePatient,
    deletePatient,
    getPatientDetail,
  } = usePatient();

  // Modals state
  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Form Create state
  const [form, setForm] = useState({
    fullName: "",
    gender: "" as Gender | "",
    dob: "", // YYYY-MM-DD
    citizenId: "",
    medicalCoverageId: "",
  });

  // Form Edit state
  const [editForm, setEditForm] = useState({
    fullName: "",
    gender: "" as Gender | "",
    dob: "", // YYYY-MM-DD
  });

  // Date pickers state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(2000, 0, 1));

  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editPickerDate, setEditPickerDate] = useState(new Date());

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
    setForm({
      fullName: "",
      gender: "",
      dob: "",
      citizenId: "",
      medicalCoverageId: "",
    });
    setPickerDate(new Date(2000, 0, 1));
    setIsCreateVisible(true);
  };

  const handleOpenUpdate = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      fullName: patient.full_name,
      gender: patient.gender,
      dob: patient.dob ? patient.dob.split("T")[0] : "",
    });
    setEditPickerDate(patient.dob ? new Date(patient.dob) : new Date());
    setIsEditVisible(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPickerDate(selectedDate);
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      setForm((prev) => ({ ...prev, dob: `${y}-${m}-${d}` }));
    }
  };

  const handleEditDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowEditDatePicker(false);
    }
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

  const validateAndCreate = async () => {
    const { fullName, gender, dob, citizenId, medicalCoverageId } = form;

    if (!fullName.trim() || !gender || !dob || !citizenId.trim() || !medicalCoverageId.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tất cả các trường.");
      return;
    }

    if (citizenId.trim().length < 9) {
      Alert.alert("Thông báo", "Số CCCD/CMND không hợp lệ.");
      return;
    }

    const success = await createPatient({
      full_name: fullName.trim(),
      gender: gender as Gender,
      dob,
      citizen_id: citizenId.trim(),
      medical_coverage_id: medicalCoverageId.trim(),
    });

    if (success) {
      Alert.alert("Thành công", "Tạo bệnh nhân mới thành công.");
      setIsCreateVisible(false);
    } else {
      Alert.alert("Thất bại", error || "Đã xảy ra lỗi khi tạo bệnh nhân.");
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
      gender: gender as Gender,
      dob,
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

  // Swipeable right actions
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
          <Text className="text-white text-xl font-bold tracking-tight">Quản lý Bệnh Nhân</Text>
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

      {/* ── Popup: Tạo bệnh nhân mới ── */}
      <Modal
        visible={isCreateVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="w-full bg-white rounded-[28px] overflow-hidden"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-800 text-xl font-bold">Thêm bệnh nhân mới</Text>
                <Pressable
                  onPress={() => setIsCreateVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SymbolView
                    name={{ ios: "xmark.circle.fill", android: "cancel" }}
                    size={24}
                    tintColor="#9CA3AF"
                  />
                </Pressable>
              </View>

              {/* Form Input fields */}
              <AppInput
                placeholder="Họ và tên bệnh nhân"
                value={form.fullName}
                onChangeText={(text) => setForm((p) => ({ ...p, fullName: text }))}
                autoCapitalize="words"
              />

              {/* Ngày sinh picker trigger */}
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-4 h-[52px] mb-3.5 active:opacity-75"
              >
                <Text
                  className={
                    form.dob
                      ? "flex-1 text-sm text-neutral-700"
                      : "flex-1 text-sm text-neutral-400"
                  }
                >
                  {form.dob ? formatDisplayDate(form.dob) : "Ngày sinh bệnh nhân"}
                </Text>
                <Text className="text-base text-neutral-400">📅</Text>
              </Pressable>

              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={handleDateChange}
                    locale="vi"
                  />
                  {Platform.OS === "ios" && (
                    <Pressable
                      className="self-end px-5 py-2 mt-1 mb-2 active:opacity-70"
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text className="text-primary font-semibold text-base">Chọn</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Giới tính toggle buttons */}
              <View className="flex-row gap-3 mb-3.5">
                <Pressable
                  className={
                    form.gender === "MALE"
                      ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                      : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
                  }
                  onPress={() => setForm((p) => ({ ...p, gender: "MALE" }))}
                >
                  <Text
                    className={
                      form.gender === "MALE"
                        ? "text-primary font-bold text-sm"
                        : "text-neutral-400 font-medium text-sm"
                    }
                  >
                    Nam
                  </Text>
                </Pressable>
                <Pressable
                  className={
                    form.gender === "FEMALE"
                      ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                      : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
                  }
                  onPress={() => setForm((p) => ({ ...p, gender: "FEMALE" }))}
                >
                  <Text
                    className={
                      form.gender === "FEMALE"
                        ? "text-primary font-bold text-sm"
                        : "text-neutral-400 font-medium text-sm"
                    }
                  >
                    Nữ
                  </Text>
                </Pressable>
              </View>

              <AppInput
                placeholder="Số CMND / CCCD"
                value={form.citizenId}
                onChangeText={(text) => setForm((p) => ({ ...p, citizenId: text }))}
                keyboardType="numeric"
              />

              <AppInput
                placeholder="Mã thẻ Bảo hiểm Y tế"
                value={form.medicalCoverageId}
                onChangeText={(text) => setForm((p) => ({ ...p, medicalCoverageId: text }))}
                autoCapitalize="characters"
              />

              {/* Actions */}
              <View className="mt-4 gap-2">
                <AppButton
                  title="Tạo bệnh nhân"
                  variant="primary"
                  isLoading={isCreating}
                  onPress={validateAndCreate}
                />
                <AppButton
                  title="Hủy"
                  variant="secondary"
                  onPress={() => setIsCreateVisible(false)}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="w-full bg-white rounded-[28px] overflow-hidden"
          >
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

              {/* Form Input fields */}
              <AppInput
                placeholder="Họ và tên bệnh nhân"
                value={editForm.fullName}
                onChangeText={(text) => setEditForm((p) => ({ ...p, fullName: text }))}
                autoCapitalize="words"
              />

              {/* Ngày sinh picker trigger */}
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

              {showEditDatePicker && (
                <View>
                  <DateTimePicker
                    value={editPickerDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={handleEditDateChange}
                    locale="vi"
                  />
                  {Platform.OS === "ios" && (
                    <Pressable
                      className="self-end px-5 py-2 mt-1 mb-2 active:opacity-70"
                      onPress={() => setShowEditDatePicker(false)}
                    >
                      <Text className="text-primary font-semibold text-base">Chọn</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Giới tính toggle buttons */}
              <View className="flex-row gap-3 mb-6">
                <Pressable
                  className={
                    editForm.gender === "MALE"
                      ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                      : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
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
                      ? "flex-1 h-[52px] rounded-xl border border-primary bg-primary/10 items-center justify-center active:opacity-90"
                      : "flex-1 h-[52px] rounded-xl border border-neutral-200 bg-white items-center justify-center active:opacity-90"
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
          </KeyboardAvoidingView>
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
                  {selectedPatient?.medical_coverage_id}
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
