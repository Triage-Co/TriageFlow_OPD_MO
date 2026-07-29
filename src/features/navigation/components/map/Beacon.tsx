import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber/native";

interface BeaconProps {
  position: [number, number, number];
}

export function Beacon({ position }: BeaconProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      // Pulsate the ring scale over time
      const ring = groupRef.current.children[0];
      if (ring) {
        const scale = 1 + Math.sin(t * 3.5) * 0.15;
        ring.scale.set(scale, scale, 1);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Ring lying on the floor */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.5, 32]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Light cylinder beacon */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 6, 16]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}
