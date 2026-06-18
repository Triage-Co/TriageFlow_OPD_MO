import React from "react";
import { StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { Colors } from "@/config/colors";

/**
 * ScreenWrapper – wrapper dùng chung cho tất cả màn hình
 *
 * Áp dụng gradient nền "Gradientsss" từ Figma:
 *   0%  → #DFE1FF (lavender nhạt)
 *   87% → #F0D2C1 (đào hồng nhạt)
 *   100%→ #FFE1C4 (cam đào nhạt)
 *
 * Dùng thay thế <SafeAreaView> trên mọi màn hình:
 *   <ScreenWrapper>...</ScreenWrapper>
 */

// Màu gradient từ Figma "Gradientsss" – tham chiếu từ Colors config
const GRADIENT_COLORS: [string, string, string] = [
  Colors.gradientStart,
  Colors.gradientMid,
  Colors.gradientEnd,
];
const GRADIENT_LOCATIONS: [number, number, number] = [0, 0.87, 1];

type ScreenWrapperProps = {
  children: React.ReactNode;
  /** Style thêm cho SafeAreaView bên trong */
  style?: StyleProp<ViewStyle>;
  /** Safe area edges – mặc định tất cả */
  edges?: Edge[];
};

export function ScreenWrapper({
  children,
  style,
  edges,
}: ScreenWrapperProps) {
  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      locations={GRADIENT_LOCATIONS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView
        style={[styles.safeArea, style]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
