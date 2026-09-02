import React from "react";
import { animated, SpringValue } from "@react-spring/three";

interface CorridorProps {
  position: [number, number, number];
  size: [number, number]; 
  opacity: SpringValue<number>;
  isActive: boolean;
  label?: string;
  rotation?: [number, number, number];
  color?: string;
}

export function Corridor({
  position,
  size,
  opacity,
  isActive,
  label,
  rotation = [0, 0, 0],
  color = "#f8fafc"
}: CorridorProps) {
  const [w, d] = size;

  return (
    <animated.group position={position as any} rotation={rotation as any}>
      
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <animated.meshStandardMaterial color={color} opacity={opacity} transparent />
      </mesh>

      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <animated.meshStandardMaterial
          color="#e2e8f0"
          opacity={opacity.to(o => o * 0.5)}
          transparent
          wireframe
        />
      </mesh>
    </animated.group>
  );
}
