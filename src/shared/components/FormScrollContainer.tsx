import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, ViewStyle } from "react-native";
import { ScreenWrapper } from "./ScreenWrapper";
import { Edge } from "react-native-safe-area-context";

type FormScrollContainerProps = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

export function FormScrollContainer({
  children,
  edges = ["bottom", "left", "right"],
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: FormScrollContainerProps) {
  return (
    <ScreenWrapper edges={edges} style={style}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
