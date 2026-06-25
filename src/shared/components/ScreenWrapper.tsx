import { Colors } from "@/config/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

const GRADIENT_COLORS: [string, string] = [
  Colors.gradientStart,
  Colors.gradientMid,
];
const GRADIENT_LOCATIONS: [number, number] = [0.5, 1];

type ScreenWrapperProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
};

export function ScreenWrapper({
  children,
  style,
  edges,
}: ScreenWrapperProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />
      <SafeAreaView
        style={[styles.safeArea, style]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral100,
  },
  gradientBg: {
    ...StyleSheet.absoluteFill,
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
