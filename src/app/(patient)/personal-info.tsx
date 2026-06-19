import { useAuthContext } from "@/features/auth/context/AuthContext";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Personal Info screen – Thông tin cá nhân chi tiết
 * Hiển thị toàn bộ thông tin hồ sơ bệnh nhân theo Figma
 */
export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user } = useAuthContext();

  /** Trích xuất 2 chữ cái đầu in hoa */
  const getInitials = (name?: string) => {
    if (!name) return "BN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  /** Format ngày sinh từ ISO string sang dd/MM/yyyy */
  const formatDob = (dob?: string) => {
    if (!dob) return "—";
    try {
      const date = new Date(dob);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dob;
    }
  };

  /** Map gender sang tiếng Việt */
  const formatGender = (gender?: string) => {
    if (!gender) return "—";
    if (gender === "MALE") return "Nam";
    if (gender === "FEMALE") return "Nữ";
    return gender;
  };

  /** Tạo mã BN từ user id (lấy 6 số cuối hoặc fallback) */
  const getPatientCode = (id?: string) => {
    if (!id) return "—";
    // Lấy phần số từ id, tối đa 7 ký tự
    const numericPart = id.replace(/\D/g, "").slice(-7);
    return numericPart ? `BN${numericPart.padStart(6, "0")}` : `BN${id.slice(0, 6)}`;
  };

  return (
    <ScreenWrapper edges={["left", "right"]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* ── Header xanh ── */}
        <View className="bg-primary px-5 pt-14 pb-6">
          {/* Top bar: Quay lại + Chỉnh sửa */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <SymbolView
                name={{ ios: "chevron.left", android: "arrow_back" }}
                size={16}
                tintColor="#FFFFFF"
              />
              <Text className="text-white text-[13px] font-medium">
                Quay lại
              </Text>
            </Pressable>

            <Pressable className="flex-row items-center gap-1.5 bg-white/20 rounded-full px-3.5 py-1.5 active:opacity-70">
              <SymbolView
                name={{ ios: "pencil", android: "edit" }}
                size={13}
                tintColor="#FFFFFF"
              />
              <Text className="text-white text-[12px] font-semibold">
                Chỉnh sửa
              </Text>
            </Pressable>
          </View>

          {/* Title */}
          <Text className="text-white text-[22px] font-extrabold tracking-tight mb-5">
            Thông tin cá nhân
          </Text>

          {/* ── Profile summary card ── */}
          <View className="bg-white/15 rounded-[20px] px-5 py-4">
            <View className="flex-row items-center gap-4">
              {/* Avatar */}
              <View className="bg-white w-[60px] h-[60px] rounded-2xl items-center justify-center">
                <Text className="text-primary text-[22px] font-bold">
                  {getInitials(user?.fullName)}
                </Text>
              </View>

              {/* Name + badge + ID */}
              <View className="flex-1">
                <Text className="text-white text-[18px] font-bold">
                  {user?.fullName ?? "Bệnh nhân"}
                </Text>
                <View className="flex-row items-center gap-2 mt-1.5">
                  <View className="bg-white/25 rounded-full px-2.5 py-0.5">
                    <Text className="text-white text-[10px] font-semibold">
                      Bệnh nhân
                    </Text>
                  </View>
                  <Text className="text-white/70 text-[11px] font-medium">
                    ID: {getPatientCode(user?.id)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Phone + Email row */}
            <View className="flex-row items-center mt-4 pt-3 border-t border-white/15">
              <View className="flex-1 flex-row items-center gap-1.5">
                <SymbolView
                  name={{ ios: "phone", android: "phone" }}
                  size={13}
                  tintColor="rgba(255,255,255,0.7)"
                />
                <Text className="text-white/80 text-[12px] font-medium">
                  {user?.phone ?? "0912 345 678"}
                </Text>
              </View>
              <View className="flex-1 flex-row items-center gap-1.5 justify-end">
                <SymbolView
                  name={{ ios: "envelope", android: "mail" }}
                  size={13}
                  tintColor="rgba(255,255,255,0.7)"
                />
                <Text
                  className="text-white/80 text-[12px] font-medium"
                  numberOfLines={1}
                >
                  {user?.email ?? "nguyenvanan@email.com"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Card thông tin chi tiết ── */}
        <View className="mx-5 -mt-0 mt-5 bg-white rounded-[20px] p-5 shadow shadow-black/5">
          <Text className="text-gray-800 text-[16px] font-bold mb-4">
            Thông tin chi tiết
          </Text>

          {/* Họ và tên */}
          <DetailField
            iconName={{ ios: "person", android: "person" }}
            label="Họ và tên"
            value={user?.fullName ?? "Nguyễn Văn An"}
          />

          {/* Ngày sinh + Giới tính (2 cột) */}
          <View className="flex-row gap-3 mt-3">
            <View className="flex-1">
              <DetailField
                iconName={{ ios: "calendar", android: "calendar_today" }}
                label="Ngày sinh"
                value={formatDob(user?.dob)}
              />
            </View>
            <View className="flex-1">
              <DetailField
                iconName={{ ios: "person.2", android: "group" }}
                label="Giới tính"
                value={formatGender(user?.gender)}
              />
            </View>
          </View>

          {/* CCCD/CMND */}
          <View className="mt-3">
            <DetailField
              iconName={{ ios: "creditcard", android: "badge" }}
              label="CCCD/CMND"
              value={user?.citizen_id ?? "—"}
            />
          </View>

          {/* Số điện thoại */}
          <View className="mt-3">
            <DetailField
              iconName={{ ios: "phone", android: "phone" }}
              label="Số điện thoại"
              value={user?.phone ?? "0912 345 678"}
            />
          </View>

          {/* Email */}
          <View className="mt-3">
            <DetailField
              iconName={{ ios: "envelope", android: "mail" }}
              label="Email"
              value={user?.email ?? "nguyenvanan@email.com"}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-10" />
      </ScrollView>
    </ScreenWrapper>
  );
}

/** ── Detail field component ── */
function DetailField({
  iconName,
  label,
  value,
}: {
  iconName: { ios: any; android: any };
  label: string;
  value: string;
}) {
  return (
    <View className="bg-[#F5F7FB] rounded-[14px] px-4 py-3.5">
      <View className="flex-row items-center gap-2 mb-1">
        <SymbolView name={iconName} size={13} tintColor="#9CA3AF" />
        <Text className="text-gray-400 text-[11px] font-medium">{label}</Text>
      </View>
      <Text className="text-gray-800 text-[15px] font-semibold ml-0.5">
        {value}
      </Text>
    </View>
  );
}
