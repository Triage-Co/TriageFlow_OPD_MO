import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import { useSpring, animated } from "@react-spring/three";
import { useTexture } from "@react-three/drei/native";
import * as THREE from "three";

interface RoomMarkerProps {
  label: string;
  pinColor: string;
  pinIcon: string;
  isActive: boolean;
}

const EMOJI_UNICODE_MAP: Record<string, string> = {
  "👃": "1f443",
  "👂": "1f442",
  "👁️": "1f441",
  "🦷": "1f9b7",
  "👶": "1f476",
  "🧴": "1f9f4",
  "💉": "1f489",
  "😷": "1f637",
  "🧠": "1f9e0",
  "📋": "1f4cb",
  "💊": "1f48a",
  "🌸": "1f338",
  "🤰": "1f930",
  "🩸": "1fa78",
  "🧸": "1f9f8",
  "🫀": "1fac0",
  "Bone": "1f9b4",
  "🩹": "1fa79",
  "🫁": "1fac1",
  "🧪": "1f9ea",
  "🏥": "1f3e5",
  "🚻": "1f6bb",
  "🩺": "1fa7a"
};

function getEmojiUnicode(emoji: string): string {
  const cleanEmoji = emoji.trim();
  if (EMOJI_UNICODE_MAP[cleanEmoji]) {
    return EMOJI_UNICODE_MAP[cleanEmoji];
  }
  return [...cleanEmoji]
    .map(char => char.codePointAt(0)!.toString(16))
    .filter(hex => hex !== "fe0f")
    .join("-");
}

export function RoomMarker({
  label,
  pinColor,
  pinIcon,
  isActive
}: RoomMarkerProps) {
  const meshRef = useRef<THREE.Group>(null);

  const unicode = getEmojiUnicode(pinIcon);
  const textureUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${unicode}.png`;
  const texture = useTexture(textureUrl) as THREE.Texture;

  if (texture) {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
  }

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y = 3.3 + Math.sin(t * 2.8) * 0.12;
      meshRef.current.rotation.y = t * 0.9;
      state.invalidate();
    }
  });

  const { scale } = useSpring({
    from: { scale: 0.01 },
    to: { scale: 0.65 },
    config: { mass: 1, tension: 210, friction: 20 }
  });

  return (
    <animated.group ref={meshRef as any} scale={scale as any} position={[0, 3.3, 0]}>
      
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.2, 0.6, 16]} />
        <meshBasicMaterial
          color={pinColor}
          depthWrite={true}
        />
      </mesh>

      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.15, 16]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {texture && (
        <sprite position={[0, 0.55, 0]} scale={[1.1, 1.1, 1]}>
          <spriteMaterial map={texture} depthWrite={true} transparent={true} />
        </sprite>
      )}
    </animated.group>
  );
}
