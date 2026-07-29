import { Ionicons } from "@expo/vector-icons";
import React from "react";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface SpecialtyStyle {
  bg: string;
  iconColor: string;
}

/** Trả về tên icon Ionicons phù hợp với chuyên khoa */
export function getSpecialtyIcon(specialtyCode: string): IoniconsName {
  const map: Record<string, IoniconsName> = {
    SP_1:  "medical-outline",          
    SP_2:  "body-outline",             
    SP_3:  "happy-outline",            
    SP_4:  "cut-outline",              
    SP_5:  "nutrition-outline",        
    SP_6:  "fitness-outline",          
    SP_7:  "eye-outline",              
    SP_8:  "warning-outline",          
    SP_9:  "color-palette-outline",    
    SP_10: "flask-outline",            
    SP_11: "water-outline",            
    SP_12: "heart-outline",            
    SP_13: "ribbon-outline",           
    SP_14: "ear-outline",              
    SP_15: "flower-outline",           
    SP_16: "bulb-outline",             
    SP_17: "flash-outline",            
    SP_18: "happy-outline",            
    SP_19: "bug-outline",              
    SP_20: "walk-outline",             
    SP_21: "pulse-outline",            
    SP_22: "cafe-outline",             
    SP_23: "cloudy-outline",           
    SP_24: "ellipse-outline",          
    SP_25: "eyedrop-outline",          
    SP_26: "leaf-outline",             
    SP_27: "cloud-outline",            
    SP_29: "construct-outline",        
  };
  return map[specialtyCode] ?? "medical-outline";
}

/** Trả về màu sắc (bg class và iconColor hex) phù hợp với chuyên khoa */
export function getSpecialtyColor(specialtyCode: string): SpecialtyStyle {
  const map: Record<string, SpecialtyStyle> = {
    SP_1:  { bg: "bg-blue-50", iconColor: "#3B82F6" },
    SP_2:  { bg: "bg-red-50", iconColor: "#EF4444" },
    SP_3:  { bg: "bg-green-50", iconColor: "#10B981" },
    SP_4:  { bg: "bg-purple-50", iconColor: "#8B5CF6" },
    SP_5:  { bg: "bg-amber-50", iconColor: "#F59E0B" },
    SP_6:  { bg: "bg-orange-50", iconColor: "#F97316" },
    SP_7:  { bg: "bg-sky-50", iconColor: "#0EA5E9" },
    SP_8:  { bg: "bg-rose-50", iconColor: "#F43F5E" },
    SP_9:  { bg: "bg-pink-50", iconColor: "#EC4899" },
    SP_10: { bg: "bg-teal-50", iconColor: "#14B8A6" },
    SP_11: { bg: "bg-indigo-50", iconColor: "#6366F1" },
    SP_12: { bg: "bg-red-100", iconColor: "#DC2626" },
    SP_13: { bg: "bg-yellow-50", iconColor: "#CA8A04" },
    SP_14: { bg: "bg-emerald-50", iconColor: "#059669" },
    SP_15: { bg: "bg-fuchsia-50", iconColor: "#D946EF" },
    SP_16: { bg: "bg-cyan-50", iconColor: "#06B6D4" },
    SP_17: { bg: "bg-violet-50", iconColor: "#7C3AED" },
    SP_18: { bg: "bg-rose-100", iconColor: "#E11D48" },
    SP_19: { bg: "bg-lime-50", iconColor: "#84CC16" },
    SP_20: { bg: "bg-amber-100", iconColor: "#D97706" },
    SP_21: { bg: "bg-red-50", iconColor: "#EF4444" },
    SP_22: { bg: "bg-orange-100", iconColor: "#EA580C" },
    SP_23: { bg: "bg-indigo-100", iconColor: "#4F46E5" },
    SP_24: { bg: "bg-blue-100", iconColor: "#2563EB" },
    SP_25: { bg: "bg-rose-50", iconColor: "#EF4444" },
    SP_26: { bg: "bg-emerald-100", iconColor: "#047857" },
    SP_27: { bg: "bg-sky-100", iconColor: "#0284C7" },
    SP_29: { bg: "bg-zinc-100", iconColor: "#4B5563" },
  };
  return map[specialtyCode] ?? { bg: "bg-blue-50", iconColor: "#84AFEB" };
}
