import { useWindowDimensions } from "react-native";

/** Breakpoint chuẩn (px) */
export const BREAKPOINTS = {
  smallPhone: 375,
  tablet: 768,
  largeTablet: 1024,
  maxContentWidth: 540,
} as const;

export type ResponsiveInfo = {
  width: number;
  height: number;
  isTablet: boolean;
  isLargeTablet: boolean;
  isSmallDevice: boolean;
  contentMaxWidth: number | undefined;
};

/**
 * Hook quản lý kích thước màn hình và responsive breakpoints
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= BREAKPOINTS.tablet;
  const isLargeTablet = width >= BREAKPOINTS.largeTablet;
  const isSmallDevice = width < BREAKPOINTS.smallPhone || height < 700;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    isSmallDevice,
    contentMaxWidth: isTablet ? BREAKPOINTS.maxContentWidth : undefined,
  };
}
