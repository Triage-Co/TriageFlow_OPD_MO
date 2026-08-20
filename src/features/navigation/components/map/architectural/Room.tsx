import React from "react";
import { animated, SpringValue } from "@react-spring/three";
import { RoomMarker } from "./RoomMarker";

interface RoomProps {
  id?: string;
  position: [number, number, number];
  size: [number, number]; 
  label?: string;
  doorPosition?: "top" | "bottom" | "left" | "right";
  doorOffset?: number;
  opacity: SpringValue<number>;
  isActive: boolean;
  color?: string;
  pinColor?: string;
  pinIcon?: string;
}

export function Room({
  id,
  position,
  size,
  label,
  doorPosition = "bottom",
  doorOffset = 0,
  opacity,
  isActive,
  color = "#ffffff",
  pinColor = "#3b82f6",
  pinIcon = "🏥"
}: RoomProps) {
  const [w, d] = size;
  const wallThickness = 0.2;
  const wallHeight = 2.5;
  const doorWidth = 1.5;

  return (
    <animated.group position={position as any}>
      {/* 1. Room Floor plane */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <animated.meshStandardMaterial
          color={isActive ? "#e0f2fe" : color}
          opacity={opacity}
          transparent
        />
      </mesh>

      {/* 2. Room Walls with Door opening calculations */}
      {/* Top Wall (-z) */}
      {doorPosition === "top" ? (
        <group position={[0, wallHeight / 2, -d / 2]}>
          <mesh castShadow receiveShadow position={[-(w / 2 + doorWidth / 2) / 2 + doorOffset, 0, 0]}>
            <boxGeometry args={[w / 2 - doorWidth / 2 + doorOffset, wallHeight, wallThickness]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
          <mesh castShadow receiveShadow position={[(w / 2 + doorWidth / 2) / 2 + doorOffset, 0, 0]}>
            <boxGeometry args={[w / 2 - doorWidth / 2 - doorOffset, wallHeight, wallThickness]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
        </group>
      ) : (
        <mesh castShadow receiveShadow position={[0, wallHeight / 2, -d / 2]}>
          <boxGeometry args={[w, wallHeight, wallThickness]} />
          <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
        </mesh>
      )}

      {/* Bottom Wall (+z) */}
      {doorPosition === "bottom" ? (
        <group position={[0, wallHeight / 2, d / 2]}>
          <mesh castShadow receiveShadow position={[-(w / 2 + doorWidth / 2) / 2 + doorOffset, 0, 0]}>
            <boxGeometry args={[w / 2 - doorWidth / 2 + doorOffset, wallHeight, wallThickness]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
          <mesh castShadow receiveShadow position={[(w / 2 + doorWidth / 2) / 2 + doorOffset, 0, 0]}>
            <boxGeometry args={[w / 2 - doorWidth / 2 - doorOffset, wallHeight, wallThickness]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
        </group>
      ) : (
        <mesh castShadow receiveShadow position={[0, wallHeight / 2, d / 2]}>
          <boxGeometry args={[w, wallHeight, wallThickness]} />
          <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
        </mesh>
      )}

      {/* Left Wall (-x) */}
      {doorPosition === "left" ? (
        <group position={[-w / 2, wallHeight / 2, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, -(d / 2 + doorWidth / 2) / 2 + doorOffset]}>
            <boxGeometry args={[wallThickness, wallHeight, d / 2 - doorWidth / 2 + doorOffset]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0, (d / 2 + doorWidth / 2) / 2 + doorOffset]}>
            <boxGeometry args={[wallThickness, wallHeight, d / 2 - doorWidth / 2 - doorOffset]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
        </group>
      ) : (
        <mesh castShadow receiveShadow position={[-w / 2 + 0.001, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, d]} />
          <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
        </mesh>
      )}

      {/* Right Wall (+x) */}
      {doorPosition === "right" ? (
        <group position={[w / 2, wallHeight / 2, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, -(d / 2 + doorWidth / 2) / 2 + doorOffset]}>
            <boxGeometry args={[wallThickness, wallHeight, d / 2 - doorWidth / 2 + doorOffset]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0, (d / 2 + doorWidth / 2) / 2 + doorOffset]}>
            <boxGeometry args={[wallThickness, wallHeight, d / 2 - doorWidth / 2 - doorOffset]} />
            <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
          </mesh>
        </group>
      ) : (
        <mesh castShadow receiveShadow position={[w / 2 - 0.001, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, d]} />
          <animated.meshStandardMaterial color="#ffffff" opacity={opacity} transparent />
        </mesh>
      )}

      {/* 3. Floating 3D Room Marker */}
      {label && (
        <RoomMarker
          label={label}
          pinColor={pinColor}
          pinIcon={pinIcon}
          isActive={isActive}
        />
      )}
    </animated.group>
  );
}
