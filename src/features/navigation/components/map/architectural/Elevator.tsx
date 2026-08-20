import React from "react";
import { animated, SpringValue } from "@react-spring/three";

interface ElevatorProps {
  position: [number, number, number];
  opacity: SpringValue<number>;
  isActive: boolean;
  rotation?: [number, number, number];
}

export function Elevator({ position, opacity, isActive, rotation = [0, 0, 0] }: ElevatorProps) {
  const size = 3;
  const height = 3;

  return (
    <animated.group position={position as any} rotation={rotation as any}>
      {/* Elevator Shaft (Outer Box) */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[size, height, size]} />
        <animated.meshStandardMaterial
          color="#94a3b8"
          opacity={opacity}
          transparent
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Elevator Doors */}
      <group position={[0, height / 2, size / 2 + 0.05]}>
        <mesh castShadow position={[-0.7, 0, 0]}>
          <boxGeometry args={[1.2, height - 0.2, 0.1]} />
          <animated.meshStandardMaterial color="#cbd5e1" opacity={opacity} transparent metalness={0.8} />
        </mesh>
        <mesh castShadow position={[0.7, 0, 0]}>
          <boxGeometry args={[1.2, height - 0.2, 0.1]} />
          <animated.meshStandardMaterial color="#cbd5e1" opacity={opacity} transparent metalness={0.8} />
        </mesh>
      </group>

      {/* Floor Indicator Light */}
      <mesh position={[0, height - 0.3, size / 2 + 0.06]}>
        <boxGeometry args={[0.5, 0.2, 0.05]} />
        <animated.meshStandardMaterial
          color={isActive ? "#4ade80" : "#ef4444"}
          emissive={isActive ? "#4ade80" : "#ef4444"}
          emissiveIntensity={0.5}
          opacity={opacity}
          transparent
        />
      </mesh>
    </animated.group>
  );
}
