import React from "react";
import { useSpring, animated } from "@react-spring/three";
import { useBuildingMap } from "../../hooks/useBuildingMap";
import { MapRenderer } from "./MapRenderer";

interface FloorRendererProps {
  floorLevel: number;
  activeFloor: number;
}

// Concrete floor dimensions matching 120m x 80m from the building API
const SLAB_POSITION: [number, number, number] = [0, -0.1, 0];
const SLAB_ARGS: [number, number, number] = [120, 0.2, 80];
const GRID_ARGS: [number, number, string, string] = [120, 80, "#cbd5e1", "#e2e8f0"];
const GRID_POSITION: [number, number, number] = [0, 0.001, 0];

export function FloorRenderer({ floorLevel, activeFloor }: FloorRendererProps) {
  const isActive = floorLevel === activeFloor;
  const isBelow = floorLevel < activeFloor;

  // Fetch building map dynamic GeoJSON (with in-memory cache)
  const { data, loading, error } = useBuildingMap(floorLevel);

  // Transition animations for sliding up/down floors
  const { position, opacity } = useSpring({
    position: [0, (floorLevel - 1) * 8, 0] as [number, number, number],
    opacity: isActive ? 1 : isBelow ? 0.15 : 0,
    config: { mass: 1, tension: 170, friction: 26 },
  });

  return (
    <animated.group position={position as any} visible={isActive || isBelow}>
      {/* 1. Main concrete floor slab */}
      <mesh receiveShadow position={SLAB_POSITION} castShadow>
        <boxGeometry args={SLAB_ARGS} />
        <animated.meshStandardMaterial
          color="#f1f5f9"
          opacity={opacity.to((o) => o * 0.5)}
          transparent
        />
      </mesh>

      {/* 2. Grid overlay — only visible on the active floor */}
      {isActive && (
        <gridHelper
          args={GRID_ARGS}
          position={GRID_POSITION}
        />
      )}

      {/* 3. Room models compiled dynamically from the adapter */}
      {loading && (
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.3} />
        </mesh>
      )}

      {error && (
        (() => {
          console.warn(`[FloorRenderer] Tầng ${floorLevel} Lỗi: ${error.message}`);
          return null;
        })()
      )}

      {!loading && !error && data && (
        <MapRenderer
          featureCollection={data}
          opacity={opacity}
          isActive={isActive}
        />
      )}
    </animated.group>
  );
}
