/**
 * Design tokens màu sắc từ Figma Variable Collection
 * Dùng file này thay vì hardcode hex trong components
 */
export const Colors = {
  // Primary – màu chủ đạo (button, tab active, accent)
  primary: "#84AFEB",

  // Neutral
  neutral100: "#FFFFFF",  // neutral-100: card bg, tab bar bg
  neutral50: "#F3F4F6",  // neutral-50: input bg, subtle bg
  neutral200: "#E5E7EB",  // border, divider
  neutral700: "#374151",  // text đậm, icon

  // Text phụ / placeholder
  textMuted: "#9CA3AF",

  // Gradient nền toàn app – "Gradientsss"
  gradientStart: "#DFE1FF",
  gradientMid: "#F0D2C1",
} as const;
