import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { ScreenWrapper } from "./ScreenWrapper";
import { Edge } from "react-native-safe-area-context";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";

type FormScrollContainerProps = {
  children: React.ReactNode;
  ref?: React.Ref<ScrollView>;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  maxWidth?: number;
  disableMaxConstraint?: boolean;
  keyboardVerticalOffset?: number;
};

export function FormScrollContainer({
  children,
  ref,
  edges = ["bottom", "left", "right"],
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  maxWidth,
  disableMaxConstraint = false,
}: FormScrollContainerProps) {
  const keyboard = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  const [fallbackKeyboardHeight, setFallbackKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setFallbackKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setFallbackKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const animatedBottomStyle = useAnimatedStyle(() => {
    const h =
      keyboard.height.value > 0
        ? keyboard.height.value
        : fallbackKeyboardHeight;
    return {
      paddingBottom: h,
    };
  });

  return (
    <ScreenWrapper
      edges={edges}
      style={style}
      maxWidth={maxWidth}
      disableMaxConstraint={disableMaxConstraint}
    >
      <Animated.View style={[{ flex: 1 }, animatedBottomStyle]}>
        <ScrollView
          ref={ref}
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: 24 },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </ScreenWrapper>
  );
}
