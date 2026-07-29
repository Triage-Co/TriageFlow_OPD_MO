import React from "react";
import * as THREE from "three";
import { useBuildingMap } from "../../hooks/useBuildingMap";
import { MapRenderer } from "./MapRenderer";

interface FloorRendererProps {
  floorLevel: number;
  activeFloor: number;
}

export function FloorRenderer({ floorLevel, activeFloor }: FloorRendererProps) {
  const isActive = floorLevel === activeFloor;

  const { data, loading, error } = useBuildingMap(floorLevel);

  const floorData3D = data?.floorData3D;

  
  const slabMesh = React.useMemo(() => {
    if (!floorData3D || !floorData3D.floorOutlinePoints || floorData3D.floorOutlinePoints.length < 3) {
      return null;
    }
    const slabShape = new THREE.Shape();
    floorData3D.floorOutlinePoints.forEach((p, idx) => {
      if (idx === 0) slabShape.moveTo(p.x, -p.z);
      else slabShape.lineTo(p.x, -p.z);
    });

    const extrudeSettings = { depth: 0.5, bevelEnabled: false };
    const slabGeo = new THREE.ExtrudeGeometry(slabShape, extrudeSettings);
    slabGeo.rotateX(Math.PI / 2);
    slabGeo.scale(1, 1, -1);
    return slabGeo;
  }, [floorData3D]);

  return (
    <group visible={true}>
      {/* 1. Base floor slab */}
      {slabMesh ? (
        <mesh position={[0, -0.5, 0]} geometry={slabMesh}>
          <meshLambertMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
          />
        </mesh>
      ) : (
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[120, 0.3, 80]} />
          <meshLambertMaterial color="#f1f5f9" />
        </mesh>
      )}

      {/* 2. Room & Architectural models */}
      {!loading && !error && data && (
        <MapRenderer
          featureCollection={data}
          isActive={isActive}
        />
      )}
    </group>
  );
}
