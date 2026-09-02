import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export interface BannerItem {
  id: string;
  tag: string;
  tagIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  highlightText: string;
  subText: string;
  colors: readonly [string, string, ...string[]];
}

export function HomeBannerCarousel() {
  const { width } = useWindowDimensions();
  const bannerWidth = width - 40; // 20px padding each side
  const bannerHeight = 132;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const isInteracting = useRef(false);

  const banners: BannerItem[] = [
    {
      id: "ai-triage",
      tag: "AI",
      tagIcon: "sparkles",
      title: "AI Hỗ Trợ ",
      highlightText: "ĐỀ XUẤT CHUYÊN KHOA",
      subText: "Phân tích triệu chứng và đề xuất chuyên khoa phù hợp",
      colors: ["#2563EB", "#1D4ED8", "#1E3A8A"],
    },
    {
      id: "health-package",
      tag: "GÓI KHÁM SỨC KHỎE",
      tagIcon: "shield-checkmark",
      title: "TẦM SOÁT SỨC KHỎE TOÀN DIỆN",
      highlightText: "BẢO VỆ SỨC KHỎE CẢ GIA ĐÌNH",
      subText: "Đa dạng gói khám định kỳ chuyên sâu • Chi phí tối ưu nhất",
      colors: ["#059669", "#047857", "#064E3B"],
    },
    {
      id: "navigation-utility",
      tag: "TIỆN ÍCH TRỰC TUYẾN",
      tagIcon: "navigate-circle",
      title: "LẤY SỐ ONLINE & BẢN ĐỒ 3D",
      highlightText: "THEO DÕI TIẾN TRÌNH KHÔNG CHỜ ĐỢI",
      subText: "Lấy số thứ tự từ xa • Dẫn đường trực quan",
      colors: ["#6366F1", "#4F46E5", "#3730A3"],
    },
  ];

  // Auto-scroll loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteracting.current || banners.length <= 1) return;
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex, banners.length]);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / bannerWidth);
    if (index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const renderBannerItem = ({ item }: { item: BannerItem }) => {
    return (
      <View style={{ width: bannerWidth, height: bannerHeight }}>
        <LinearGradient
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bannerCard, { width: bannerWidth, height: bannerHeight }]}
        >
          {/* Background Decorative Circles */}
          <View style={styles.bgCircleLarge} />
          <View style={styles.bgCircleSmall} />

          {/* Tag Badge */}
          <View style={styles.tagBadge}>
            <Ionicons name={item.tagIcon} size={11} color="#FFFFFF" />
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>

          {/* Main Headline & Highlight */}
          <View style={styles.headlineContainer}>
            <Text style={styles.titleText} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.highlightText} numberOfLines={1}>
              {item.highlightText}
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.subText} numberOfLines={1}>
            {item.subText}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Banner Container */}
      <View style={[styles.carouselContainer, { width: bannerWidth, height: bannerHeight }]}>
        <FlatList
          ref={flatListRef}
          data={banners}
          keyExtractor={(item) => item.id}
          renderItem={renderBannerItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          onTouchStart={() => {
            isInteracting.current = true;
          }}
          onTouchEnd={() => {
            isInteracting.current = false;
          }}
          getItemLayout={(_, index) => ({
            length: bannerWidth,
            offset: bannerWidth * index,
            index,
          })}
        />

        {/* Shopee-style Bottom Pagination Bar (▬ • •) */}
        <View style={styles.paginationRow} pointerEvents="none">
          {banners.map((_, index) => {
            const isActive = activeIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  carouselContainer: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  bgCircleLarge: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  bgCircleSmall: {
    position: "absolute",
    right: 80,
    bottom: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  headlineContainer: {
    marginVertical: 1,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  highlightText: {
    color: "#FDE047", // Yellow highlight
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  subText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10.5,
    fontWeight: "500",
  },
  paginationRow: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    zIndex: 30,
  },
  dot: {
    height: 3,
    borderRadius: 1.5,
  },
  dotActive: {
    width: 14,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 4.5,
    backgroundColor: "rgba(255, 255, 255, 0.42)",
  },
});
