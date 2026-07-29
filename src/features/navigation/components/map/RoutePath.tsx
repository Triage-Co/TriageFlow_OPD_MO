import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber/native";

interface RoutePathProps {
  path: any[] | undefined | null;
  centerShiftX: number;
  centerShiftZ: number;
  activeFloor: number;
}

/**
 * Renders the 3D route paths as a glowing neon tube on the floor.
 */
export function RoutePath({ path, centerShiftX, centerShiftZ, activeFloor }: RoutePathProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.getElapsedTime();
      const opacity = 0.7 + Math.sin(t * 5.0) * 0.3;
      materialRef.current.opacity = opacity;
      state.invalidate();
    }
  });

  const tubeGeometry = useMemo(() => {
    if (!path || path.length < 2) return null;

    let floorNodes = path.filter((node: any) => {
      if (node.floorNumber !== undefined) {
        return Number(node.floorNumber) === Number(activeFloor);
      }
      return true;
    });

    if (floorNodes.length < 2) {
      floorNodes = path;
    }

    if (floorNodes.length < 2) return null;

    const points = floorNodes.map((node: any) => {
      const [lng, lat] = node.coords;
      const x = lng * 111320 - centerShiftX;
      const z = -(lat * 110540) - centerShiftZ;
      return new THREE.Vector3(x, 0.4, z);
    });

    const uniquePoints: THREE.Vector3[] = [];
    points.forEach((p) => {
      if (uniquePoints.length === 0) {
        uniquePoints.push(p);
      } else {
        const prev = uniquePoints[uniquePoints.length - 1];
        if (p.distanceTo(prev) > 0.01) {
          uniquePoints.push(p);
        }
      }
    });

    if (uniquePoints.length < 2) return null;

    try {
      const curve = new THREE.CatmullRomCurve3(uniquePoints);
      return new THREE.TubeGeometry(curve, 64, 0.25, 8, false);
    } catch (e) {
      console.warn("Lỗi dựng RoutePath TubeGeometry:", e);
      return null;
    }
  }, [path, centerShiftX, centerShiftZ, activeFloor]);

  if (!tubeGeometry) return null;

  return (
    <mesh geometry={tubeGeometry}>
      <meshBasicMaterial
        ref={materialRef}
        color="#3b82f6"
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </mesh>
  );
}
