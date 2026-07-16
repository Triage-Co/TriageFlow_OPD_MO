import React from "react";
import { animated, SpringValue } from "@react-spring/three";

interface StaircaseProps {
  position: [number, number, number];
  opacity: SpringValue<number>;
  isActive: boolean;
  rotation?: [number, number, number];
}

export function Staircase({ position, opacity, isActive, rotation = [0, 0, 0] }: StaircaseProps) {
  const stepCount = 8;
  const stepWidth = 2;
  const stepDepth = 0.4;
  const stepHeight = 0.25;

  return (
    <animated.group position={position as any} rotation={rotation as any}>
      {/* Floor / Base of stairs */}
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[stepWidth + 1, stepDepth * stepCount + 1]} />
        <animated.meshStandardMaterial color="#cbd5e1" opacity={opacity} transparent />
      </mesh>

      {/* Steps */}
      {Array.from({ length: stepCount }).map((_, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={[0, (i * stepHeight) / 2 + stepHeight / 2, (i * stepDepth) - (stepDepth * stepCount) / 2 + stepDepth / 2]}
        >
          <boxGeometry args={[stepWidth, (i + 1) * stepHeight, stepDepth]} />
          <animated.meshStandardMaterial color="#f1f5f9" opacity={opacity} transparent />
        </mesh>
      ))}

      {/* Railings */}
      <mesh castShadow position={[-stepWidth / 2 - 0.1, stepHeight * stepCount / 2 + 0.5, 0]}>
        <boxGeometry args={[0.1, stepHeight * stepCount + 1, stepDepth * stepCount]} />
        <animated.meshStandardMaterial color="#94a3b8" opacity={opacity} transparent metalness={0.5} />
      </mesh>
      <mesh castShadow position={[stepWidth / 2 + 0.1, stepHeight * stepCount / 2 + 0.5, 0]}>
        <boxGeometry args={[0.1, stepHeight * stepCount + 1, stepDepth * stepCount]} />
        <animated.meshStandardMaterial color="#94a3b8" opacity={opacity} transparent metalness={0.5} />
      </mesh>
    </animated.group>
  );
}
