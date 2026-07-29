import { useOtpLogin } from "@/features/auth/hooks/useOtpLogin";
import { AppButton } from "@/shared/components/AppButton";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RESEND_COUNTDOWN = 60;

/**
 * OTP screen
 * Hỗ trợ xác thực OTP SĐT cũ (6 số) hoặc OTP Email mới (8 số)
 */
export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const canResend = countdown <= 0;

  const inputRefs = useRef<(TextInput | null)[]>([]);

  
  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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

  const handleOtpChange = useCallback(
    (value: string, index: number) => {
      if (error) clearError();

      const digit = value.replace(/[^0-9]/g, "").slice(-1);
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      
      if (digit && index < otpLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      
      if (digit && index === otpLength - 1) {
        const fullOtp = [...newOtp.slice(0, otpLength - 1), digit].join("");
        if (fullOtp.length === otpLength) {
          Keyboard.dismiss();
          handleVerify(fullOtp);
        }
      }
    },
    [otp, error, clearError, otpLength, handleVerify]
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

  const handleResend = useCallback(async () => {
    if (!canResend) return;

    let success = false;
    if (isEmailOtp && email) {
      success = await sendOtp(email);
    }

    if (success) {
      setCountdown(RESEND_COUNTDOWN);
      setOtp(Array(otpLength).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [canResend, email, isEmailOtp, sendOtp, otpLength]);

  const targetLabel = isEmailOtp
    ? `email ${email}`
    : `số điện thoại +${phone?.replace(/(\d{3})\d{4}(\d+)/, "$1****$2")}`;

  return (
    <ScreenWrapper edges={["bottom", "left", "right"]}>
      {/* Back button */}
      <View className="px-5 pb-2" style={{ paddingTop: insets.top + 16 }}>
        <Pressable
          onPress={() => router.back()}
          className="w-[56px] h-[56px] rounded-xl border border-gray-200 items-center justify-center active:opacity-70"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text className="text-gray-600 text-[28px] font-light">‹</Text>
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
              className={`flex-1 h-14 text-center text-lg font-bold text-gray-800 rounded-xl ${otp[index] ? "border-2 bg-blue-50/50" : "border bg-gray-50/50"
                } ${error
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
              className={`text-sm font-medium ${canResend ? "text-blue-500" : "text-gray-400"
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

