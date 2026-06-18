import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppButton } from "@/shared/components/AppButton";
import { useOtpLogin } from "@/features/auth/hooks/useOtpLogin";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";

const RESEND_COUNTDOWN = 60;

/**
 * OTP screen
 * Hỗ trợ xác thực OTP SĐT cũ (6 số) hoặc OTP Email mới (8 số)
 */
export default function OtpScreen() {
  const router = useRouter();
  const { phone, email, mode } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    mode?: string;
  }>();

  const isEmailOtp = mode === "otp-login";
  const otpLength = isEmailOtp ? 8 : 6;

  const { verifyOtpLogin, sendOtp, isLoading, error, clearError } = useOtpLogin();

  const [otp, setOtp] = useState<string[]>(() =>
    Array(isEmailOtp ? 8 : 6).fill("")
  );
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
      if (digit && index < otpLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Tự động submit khi điền đủ
      if (digit && index === otpLength - 1) {
        const fullOtp = [...newOtp.slice(0, otpLength - 1), digit].join("");
        if (fullOtp.length === otpLength) {
          Keyboard.dismiss();
          handleVerify(fullOtp);
        }
      }
    },
    [otp, error, clearError, otpLength]
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
      if (code.length < otpLength) {
        Alert.alert("Thông báo", "Vui lòng nhập đủ mã OTP.");
        return;
      }

      if (isEmailOtp) {
        const success = await verifyOtpLogin(email ?? "", code);
        if (success) {
          router.replace("/(patient)/(tabs)/home");
        }
      }
    },
    [otp, email, isEmailOtp, otpLength, verifyOtpLogin, router]
  );

  const handleResend = useCallback(async () => {
    if (!canResend) return;

    let success = false;
    if (isEmailOtp && email) {
      success = await sendOtp(email);
    }

    if (success) {
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      setOtp(Array(otpLength).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [canResend, email, isEmailOtp, sendOtp, otpLength]);

  const targetLabel = isEmailOtp
    ? `email ${email}`
    : `số điện thoại +${phone?.replace(/(\d{3})\d{4}(\d+)/, "$1****$2")}`;

  return (
    <ScreenWrapper>
      {/* Back button */}
      <View className="px-5 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-lg border border-gray-200 items-center justify-center active:opacity-70"
        >
          <Text className="text-gray-600 text-[16px]">‹</Text>
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-4">
        {/* Title */}
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Nhập mã OTP
        </Text>
        <Text className="text-sm text-gray-400 mb-8 leading-5">
          Chúng tôi đã gửi mã xác minh OTP gồm {otpLength} chữ số đến {targetLabel}.
        </Text>

        {/* OTP Inputs */}
        <View className="flex-row justify-between mb-4 gap-1">
          {Array.from({ length: otpLength }).map((_, index) => (
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
              className={`flex-1 h-14 text-center text-lg font-bold text-gray-800 rounded-xl ${
                otp[index] ? "border-2 bg-blue-50/50" : "border bg-gray-50/50"
              } ${
                error
                  ? "border-red-300"
                  : otp[index]
                  ? "border-primary"
                  : "border-neutral-200"
              }`}
            />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <Text className="text-red-500 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        {/* Resend row */}
        <View className="flex-row justify-between items-center mb-8">
          <Pressable
            onPress={handleResend}
            disabled={!canResend || isLoading}
            className={canResend ? "active:opacity-70" : ""}
          >
            <Text
              className={`text-sm font-medium ${
                canResend ? "text-blue-500" : "text-gray-400"
              }`}
            >
              Gửi lại mã
            </Text>
          </Pressable>

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
          disabled={otp.join("").length < otpLength}
        />
      </View>
    </ScreenWrapper>
  );
}

