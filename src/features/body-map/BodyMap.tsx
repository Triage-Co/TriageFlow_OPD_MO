import { Colors } from "@/config/colors";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { BODY_REGIONS } from "./bodyRegions";
import { FemaleBackOutline } from "./FemaleBackOutline";
import { FemaleFrontOutline } from "./FemaleFrontOutline";
import { MaleBackOutline } from "./MaleBackOutline";
import { MaleFrontOutline } from "./MaleFrontOutline";
import { BodyRegion, BodySide } from "./types";

type BodyGender = "male" | "female";

type BodyMapProps = {
  gender?: BodyGender;
  selectedRegionId?: string | null;
  onSelectRegion: (region: BodyRegion) => void;
};

type HitZonesProps = {
  getFillColor: (id: string) => string;
  onPressRegion: (id: string) => void;
};

type BodyOutlineProps = {
  gender: BodyGender;
  side: BodySide;
  strokeColor: string;
};

const ACTIVE_FILL = "rgba(132, 175, 235, 0.4)";
const INACTIVE_FILL = "rgba(0, 0, 0, 0.01)";
const FALLBACK_PRIMARY = "#006BFF";

function BodyOutline({ gender, side, strokeColor }: BodyOutlineProps) {
  if (gender === "female" && side === "front") {
    return <FemaleFrontOutline strokeColor={strokeColor} />;
  }

  if (gender === "female" && side === "back") {
    return <FemaleBackOutline strokeColor={strokeColor} />;
  }

  if (gender === "male" && side === "back") {
    return <MaleBackOutline strokeColor={strokeColor} />;
  }

  return <MaleFrontOutline strokeColor={strokeColor} />;
}

function FrontHitZones({ getFillColor, onPressRegion }: HitZonesProps) {
  return (
    <G>
      {/* Front view: patient's right is on screen-left, patient's left is on screen-right */}
      <Path
        d="M68 0 H99 V38 H68 Z"
        fill={getFillColor("head")}
        onPress={() => onPressRegion("head")}
      />

      <Rect
        x={67}
        y={36}
        width={33}
        height={20}
        rx={8}
        fill={getFillColor("neck")}
        onPress={() => onPressRegion("neck")}
      />

      <Ellipse
        cx={55}
        cy={58}
        rx={16}
        ry={13}
        fill={getFillColor("right_shoulder")}
        onPress={() => onPressRegion("right_shoulder")}
      />
      <Ellipse
        cx={113}
        cy={58}
        rx={16}
        ry={13}
        fill={getFillColor("left_shoulder")}
        onPress={() => onPressRegion("left_shoulder")}
      />

      <Path
        d="M56 53 C65 57 75 58 84 58 C93 58 103 57 112 53 L112 88 C104 95 64 95 56 88 Z"
        fill={getFillColor("chest")}
        onPress={() => onPressRegion("chest")}
      />

      <Path
        d="M56 88 C65 96 103 96 112 88 L111 145 C101 151 67 151 57 145 Z"
        fill={getFillColor("abdomen")}
        onPress={() => onPressRegion("abdomen")}
      />

      <Path
        d="M37 58 C28 80 24 104 17 127 C14 139 10 149 5 159 L25 166 C30 147 38 130 47 113 C54 99 59 77 60 58 Z"
        fill={getFillColor("right_arm")}
        onPress={() => onPressRegion("right_arm")}
      />
      <Path
        d="M131 58 C140 80 144 104 151 127 C154 139 158 149 163 159 L143 166 C138 147 130 130 121 113 C114 99 109 77 108 58 Z"
        fill={getFillColor("left_arm")}
        onPress={() => onPressRegion("left_arm")}
      />

      <Ellipse
        cx={13}
        cy={169}
        rx={16}
        ry={19}
        fill={getFillColor("right_hand")}
        onPress={() => onPressRegion("right_hand")}
      />
      <Ellipse
        cx={155}
        cy={169}
        rx={16}
        ry={19}
        fill={getFillColor("left_hand")}
        onPress={() => onPressRegion("left_hand")}
      />

      <Path
        d="M50 145 C64 142 76 149 77 166 C75 205 71 257 66 314 L44 314 C46 260 43 199 50 145 Z"
        fill={getFillColor("right_leg")}
        onPress={() => onPressRegion("right_leg")}
      />
      <Path
        d="M118 145 C104 142 92 149 91 166 C93 205 97 257 102 314 L124 314 C122 260 125 199 118 145 Z"
        fill={getFillColor("left_leg")}
        onPress={() => onPressRegion("left_leg")}
      />

      <Circle
        cx={62}
        cy={215}
        r={14}
        fill={getFillColor("right_knee")}
        onPress={() => onPressRegion("right_knee")}
      />
      <Circle
        cx={106}
        cy={215}
        r={14}
        fill={getFillColor("left_knee")}
        onPress={() => onPressRegion("left_knee")}
      />

      <Ellipse
        cx={55}
        cy={312}
        rx={15}
        ry={9}
        fill={getFillColor("right_foot")}
        onPress={() => onPressRegion("right_foot")}
      />
      <Ellipse
        cx={113}
        cy={312}
        rx={15}
        ry={9}
        fill={getFillColor("left_foot")}
        onPress={() => onPressRegion("left_foot")}
      />
    </G>
  );
}

function BackHitZones({ getFillColor, onPressRegion }: HitZonesProps) {
  return (
    <G>
      {/* Back view: patient's left is on screen-left, patient's right is on screen-right */}
      <Path
        d="M68 0 H99 V38 H68 Z"
        fill={getFillColor("head")}
        onPress={() => onPressRegion("head")}
      />

      <Rect
        x={67}
        y={36}
        width={33}
        height={20}
        rx={8}
        fill={getFillColor("neck")}
        onPress={() => onPressRegion("neck")}
      />

      <Ellipse
        cx={55}
        cy={58}
        rx={16}
        ry={13}
        fill={getFillColor("left_shoulder")}
        onPress={() => onPressRegion("left_shoulder")}
      />
      <Ellipse
        cx={113}
        cy={58}
        rx={16}
        ry={13}
        fill={getFillColor("right_shoulder")}
        onPress={() => onPressRegion("right_shoulder")}
      />

      <Path
        d="M56 53 C65 57 75 58 84 58 C93 58 103 57 112 53 L112 100 C104 108 64 108 56 100 Z"
        fill={getFillColor("upper_back")}
        onPress={() => onPressRegion("upper_back")}
      />

      <Path
        d="M56 100 C66 108 102 108 112 100 L111 148 C101 154 67 154 57 148 Z"
        fill={getFillColor("lower_back")}
        onPress={() => onPressRegion("lower_back")}
      />

      <Path
        d="M37 58 C28 80 24 104 17 127 C14 139 10 149 5 159 L25 166 C30 147 38 130 47 113 C54 99 59 77 60 58 Z"
        fill={getFillColor("left_arm")}
        onPress={() => onPressRegion("left_arm")}
      />
      <Path
        d="M131 58 C140 80 144 104 151 127 C154 139 158 149 163 159 L143 166 C138 147 130 130 121 113 C114 99 109 77 108 58 Z"
        fill={getFillColor("right_arm")}
        onPress={() => onPressRegion("right_arm")}
      />

      <Ellipse
        cx={13}
        cy={169}
        rx={16}
        ry={19}
        fill={getFillColor("left_hand")}
        onPress={() => onPressRegion("left_hand")}
      />
      <Ellipse
        cx={155}
        cy={169}
        rx={16}
        ry={19}
        fill={getFillColor("right_hand")}
        onPress={() => onPressRegion("right_hand")}
      />

      <Path
        d="M50 145 C64 142 76 149 77 166 C75 205 71 257 66 314 L44 314 C46 260 43 199 50 145 Z"
        fill={getFillColor("left_leg")}
        onPress={() => onPressRegion("left_leg")}
      />
      <Path
        d="M118 145 C104 142 92 149 91 166 C93 205 97 257 102 314 L124 314 C122 260 125 199 118 145 Z"
        fill={getFillColor("right_leg")}
        onPress={() => onPressRegion("right_leg")}
      />

      <Circle
        cx={62}
        cy={215}
        r={14}
        fill={getFillColor("left_knee")}
        onPress={() => onPressRegion("left_knee")}
      />
      <Circle
        cx={106}
        cy={215}
        r={14}
        fill={getFillColor("right_knee")}
        onPress={() => onPressRegion("right_knee")}
      />

      <Ellipse
        cx={55}
        cy={312}
        rx={15}
        ry={9}
        fill={getFillColor("left_foot")}
        onPress={() => onPressRegion("left_foot")}
      />
      <Ellipse
        cx={113}
        cy={312}
        rx={15}
        ry={9}
        fill={getFillColor("right_foot")}
        onPress={() => onPressRegion("right_foot")}
      />
    </G>
  );
}

export function BodyMap({
  gender = "male",
  selectedRegionId,
  onSelectRegion,
}: BodyMapProps) {
  const [side, setSide] = useState<BodySide>("front");
  const strokeColor = Colors.primary ?? FALLBACK_PRIMARY;

  const handlePressRegion = (id: string) => {
    const region = BODY_REGIONS.find((item) => item.id === id);

    if (!region) {
      console.warn(`Body region not found: ${id}`);
      return;
    }

    onSelectRegion({
      ...region,
      side,
    });
  };

  const toggleSide = () => {
    setSide((currentSide) => (currentSide === "front" ? "back" : "front"));
  };

  const getFillColor = (id: string) => {
    return selectedRegionId === id ? ACTIVE_FILL : INACTIVE_FILL;
  };

  return (
    <View className="w-full h-full items-center justify-between">
      <View className="flex-1 w-full items-center justify-center">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 168 320"
          preserveAspectRatio="xMidYMid meet"
        >
          <BodyOutline gender={gender} side={side} strokeColor={strokeColor} />

          {side === "front" ? (
            <FrontHitZones
              getFillColor={getFillColor}
              onPressRegion={handlePressRegion}
            />
          ) : (
            <BackHitZones
              getFillColor={getFillColor}
              onPressRegion={handlePressRegion}
            />
          )}
        </Svg>
      </View>

      <Pressable
        onPress={toggleSide}
        className="flex-row items-center justify-center gap-[7px] py-2 px-[14px] rounded-full mt-1"
        android_ripple={{ color: "rgba(132, 175, 235, 0.2)" }}
      >
        <SymbolView
          name={{ ios: "arrow.triangle.2.circlepath", android: "sync" }}
          size={16}
          tintColor={strokeColor}
        />

        <Text className="text-primary text-[16px] font-medium">
          Rotate model
        </Text>
      </Pressable>
    </View>
  );
}