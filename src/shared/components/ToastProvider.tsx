import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react-native";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToastRef: { show: (message: string, type?: ToastType, duration?: number) => void } | null = null;

export const showGlobalToast = (message: string, type: ToastType = "error", duration = 4000) => {
  if (globalToastRef) {
    globalToastRef.show(message, type, duration);
  } else {
    console.warn("[Toast] globalToastRef is not initialized yet. Message:", message);
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type, duration });
  }, []);

  useEffect(() => {
    globalToastRef = { show };
    return () => {
      globalToastRef = null;
    };
  }, [show]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 4000}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastItemProps {
  message: string;
  type: ToastType;
  duration: number;
  onHide: () => void;
}

function ToastItem({ message, type, duration, onHide }: ToastItemProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const triggerHide = useCallback(() => {
    translateY.value = withTiming(-150, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onHide)();
    });
  }, [onHide, translateY, opacity]);

  useEffect(() => {
    translateY.value = withSpring(insets.top + 12, {
      damping: 15,
      stiffness: 120,
    });
    opacity.value = withTiming(1, { duration: 200 });

    const timer = setTimeout(() => {
      triggerHide();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [insets.top, duration, triggerHide, translateY, opacity]);


  let bgColor = "bg-neutral-900";
  let iconColor = "#FFFFFF";
  let IconComponent = Info;

  if (type === "success") {
    bgColor = "bg-emerald-50 border border-emerald-100 shadow-emerald-100/30";
    iconColor = "#10b981";
    IconComponent = CheckCircle;
  } else if (type === "error") {
    bgColor = "bg-rose-50 border border-rose-100 shadow-rose-100/30";
    iconColor = "#f43f5e";
    IconComponent = AlertCircle;
  } else {
    bgColor = "bg-sky-50 border border-sky-100 shadow-sky-100/30";
    iconColor = "#0284c7";
    IconComponent = Info;
  }

  const textClass = type === "success"
    ? "text-emerald-950 font-medium"
    : type === "error"
      ? "text-rose-950 font-medium"
      : "text-sky-950 font-medium";

  return (
    <Animated.View
      style={[styles.toastContainer, animatedStyle]}
      className={`absolute left-4 right-4 p-4 rounded-2xl flex-row items-center justify-between shadow-lg ${bgColor}`}
    >
      <View className="flex-row items-center flex-1 mr-3">
        <IconComponent size={22} color={iconColor} className="mr-3 flex-shrink-0" />
        <Text className={`text-sm leading-5 flex-1 ${textClass}`} numberOfLines={3}>
          {message}
        </Text>
      </View>
      <Pressable onPress={triggerHide} className="p-1 active:opacity-60">
        <X size={16} color={type === "success" ? "#064e3b" : type === "error" ? "#4c0519" : "#0c4a6e"} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    zIndex: 9999,
    elevation: 9999,
  },
});
