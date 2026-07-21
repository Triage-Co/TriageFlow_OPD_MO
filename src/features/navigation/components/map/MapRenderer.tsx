import React from "react";
import * as THREE from "three";
import {
  GeoJSONFeatureCollection,
  RoomData3D,
  WallSegment,
  ClinicPartitionSegment,
  StandaloneDoorData,
} from "../../types/map.types";

interface MapRendererProps {
  featureCollection: GeoJSONFeatureCollection;
  isActive: boolean;
}

const WALL_THICKNESS = 0.18;
const DEFAULT_WALL_HEIGHT = 2.5;

function DoorFrame({
  centerX,
  centerZ,
  width,
  angle,
  wallHeight = DEFAULT_WALL_HEIGHT,
}: {
  centerX: number;
  centerZ: number;
  width: number;
  angle: number;
  wallHeight?: number;
}) {
  const doorFrameHeight = 0.35;
  const halfW = width / 2;
  const leftX = centerX - Math.cos(angle) * halfW;
  const leftZ = centerZ - Math.sin(angle) * halfW;
  const rightX = centerX + Math.cos(angle) * halfW;
  const rightZ = centerZ + Math.sin(angle) * halfW;

  return (
    <group>
      {/* Lintel bar */}
      <mesh
        castShadow
        receiveShadow
        position={[centerX, wallHeight - doorFrameHeight / 2, centerZ]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[width + 0.1, doorFrameHeight, WALL_THICKNESS + 0.06]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.5}
          metalness={0.1}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Left post */}
      <mesh
        castShadow
        receiveShadow
        position={[leftX, wallHeight / 2, leftZ]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[0.12, wallHeight, WALL_THICKNESS + 0.06]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.5}
          metalness={0.1}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Right post */}
      <mesh
        castShadow
        receiveShadow
        position={[rightX, wallHeight / 2, rightZ]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[0.12, wallHeight, WALL_THICKNESS + 0.06]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.5}
          metalness={0.1}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

function WallSegmentMesh({
  seg,
  wallHeight,
}: {
  seg: WallSegment;
  wallHeight: number;
}) {
  if (seg.boundaryType === "DOOR") {
    return (
      <DoorFrame
        centerX={seg.centerX}
        centerZ={seg.centerZ}
        width={seg.length}
        angle={seg.angle}
        wallHeight={wallHeight}
      />
    );
  }

  return (
    <mesh
      castShadow
      receiveShadow
      position={[seg.centerX, wallHeight / 2, seg.centerZ]}
      rotation={[0, -seg.angle, 0]}
    >
      <boxGeometry args={[seg.length, wallHeight, WALL_THICKNESS]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.35}
        metalness={0.05}
      />
    </mesh>
  );
}

function RoomMesh({ room }: { room: RoomData3D }) {
  const floorGeo = React.useMemo(() => {
    if (!room.points || room.points.length < 3) return null;
    const shape = new THREE.Shape();
    room.points.forEach((p, idx) => {
      if (idx === 0) shape.moveTo(p.x, -p.z);
      else shape.lineTo(p.x, -p.z);
    });
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [room.points]);

  const isReception =
    room.roomCode.toLowerCase().includes("reception") ||
    room.roomLabel.toLowerCase().includes("tiếp nhận");
  const wallH = isReception ? 1.5 : DEFAULT_WALL_HEIGHT;

  return (
    <group>
      {/* 1. Room Floor plane */}
      {floorGeo && (
        <mesh receiveShadow position={[0, 0.02, 0]} geometry={floorGeo}>
          <meshStandardMaterial
            color={room.color}
            roughness={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 2. Room Walls & Doors */}
      {room.walls.map((seg, idx) => (
        <WallSegmentMesh
          key={`${room.id}-wall-${idx}`}
          seg={seg}
          wallHeight={wallH}
        />
      ))}
    </group>
  );
}

export function MapRenderer({ featureCollection }: MapRendererProps) {
  const floorData3D = featureCollection.floorData3D;

  if (!floorData3D) return null;

  return (
    <group>
      {/* 1. Clinic Partitions */}
      {floorData3D.clinicPartitions.map((cp: ClinicPartitionSegment, idx: number) => (
        <mesh
          key={`clinic-part-${idx}`}
          castShadow
          receiveShadow
          position={[cp.centerX, DEFAULT_WALL_HEIGHT / 2, cp.centerZ]}
          rotation={[0, -cp.angle, 0]}
        >
          <boxGeometry args={[cp.length, DEFAULT_WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* 2. Standalone Doors */}
      {floorData3D.standaloneDoors.map((door: StandaloneDoorData) => (
        <DoorFrame
          key={`standalone-door-${door.id}`}
          centerX={door.centerX}
          centerZ={door.centerZ}
          width={door.width}
          angle={door.angle}
          wallHeight={DEFAULT_WALL_HEIGHT}
        />
      ))}

      {/* 3. Rooms */}
      {floorData3D.rooms.map((room: RoomData3D) => (
        <RoomMesh key={`room-${room.id}`} room={room} />
      ))}
    </group>
  );
}
