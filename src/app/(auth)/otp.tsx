import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/shared/components/AppButton";
import { useAuth } from "@/features/auth/hooks/useAuth";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

/**
 * OTP screen
 * UI theo Figma: back button, title, description, 6 ô OTP box, "Gửi lại mã" + countdown
 */
export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = useCallback(
    (value: string, index: number) => {
      if (error) clearError();

      const digit = value.replace(/[^0-9]/g, "").slice(-1);
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto focus next
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Tự động submit khi điền đủ
      if (digit && index === OTP_LENGTH - 1) {
        const fullOtp = [...newOtp.slice(0, OTP_LENGTH - 1), digit].join("");
        if (fullOtp.length === OTP_LENGTH) {
          Keyboard.dismiss();
          handleVerify(fullOtp);
        }
      }
    },
    [otp, error, clearError]
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }, index: number) => {
      if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    },
    [otp]
  );

  const handleVerify = useCallback(
    async (otpValue?: string) => {
      const code = otpValue ?? otp.join("");
      if (code.length < OTP_LENGTH) {
        Alert.alert("Thông báo", "Vui lòng nhập đủ mã OTP.");
        return;
      }

      const success = await verifyOtp({ phone: phone ?? "", otp: code });
      if (success) {
        router.replace("/(auth)/success");
      }
    },
    [otp, phone, verifyOtp, router]
  );

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    const success = await resendOtp({ phone: phone ?? "" });
    if (success) {
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [canResend, phone, resendOtp]);

  const maskedPhone = phone
    ? phone.replace(/(\d{3})\d{4}(\d+)/, "$1****$2")
    : "";

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Back button */}
      <View className="px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-lg border border-gray-200 items-center justify-center"
        >
          <Text className="text-gray-600" style={{ fontSize: 16 }}>‹</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-4">
        {/* Title */}
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Nhập mã OTP
        </Text>
        <Text className="text-sm text-gray-400 mb-8 leading-5">
          Chúng tôi đã gửi tin nhắn SMS chứa mã kích hoạt đến số điện thoại của bạn{" "}
          {maskedPhone ? `+${maskedPhone}` : ""}
        </Text>

        {/* OTP Inputs – style theo Figma: box vuông, border nhẹ */}
        <View className="flex-row justify-between mb-4">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={otp[index]}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              style={{
                width: 48,
                height: 56,
                borderWidth: otp[index] ? 2 : 1,
                borderColor: error
                  ? "#FCA5A5"
                  : otp[index]
                  ? "#5B9BD5"
                  : "#E5E7EB",
                borderRadius: 12,
                backgroundColor: otp[index] ? "#EFF6FF" : "#F9FAFB",
                textAlign: "center",
                fontSize: 20,
                fontWeight: "700",
                color: "#1F2937",
              }}
            />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <Text className="text-red-500 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        {/* Resend row – "Gửi lại mã" trái, countdown phải */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend || isLoading}
          >
            <Text
              className={`text-sm font-medium ${
                canResend ? "text-blue-500" : "text-gray-400"
              }`}
            >
              Gửi lại mã
            </Text>
          </TouchableOpacity>

          {!canResend ? (
            <Text className="text-gray-400 text-sm">
              0:{countdown.toString().padStart(2, "0")}
            </Text>
          ) : null}
        </View>

        {/* Verify Button */}
        <AppButton
          title="Xác nhận"
          variant="primary"
          isLoading={isLoading}
          onPress={() => handleVerify()}
          disabled={otp.join("").length < OTP_LENGTH}
        />
      </View>
    </SafeAreaView>
  );
}
