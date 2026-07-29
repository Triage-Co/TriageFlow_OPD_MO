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
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  
  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.getElapsedTime();
      
      const intensity = 0.75 + Math.sin(t * 5.0) * 0.45;
      materialRef.current.emissiveIntensity = intensity;
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
      <meshStandardMaterial
        ref={materialRef}
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.8}
        roughness={0.1}
        metalness={0.9}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </mesh>
  );
}
