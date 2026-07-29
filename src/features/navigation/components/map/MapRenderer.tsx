import React from "react";
import * as THREE from "three";
import {
  GeoJSONFeatureCollection,
  RoomData3D,
  WallSegment,
  ClinicPartitionSegment,
  StandaloneDoorData,
} from "../../types/map.types";
import { useNavigationStore } from "../../store/useNavigationStore";
import { RoomMarker } from "./architectural/RoomMarker";
import { Beacon } from "./Beacon";
import { RoutePath } from "./RoutePath";

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
  const startRoom = useNavigationStore((s) => s.startRoom);
  const targetRoom = useNavigationStore((s) => s.targetRoom);
  const selectedNodeId = useNavigationStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useNavigationStore((s) => s.setSelectedNodeId);

  const isStart = startRoom && room.id === startRoom.id;
  const isTarget = targetRoom && room.id === targetRoom.id;
  const isSelected = selectedNodeId && room.id === selectedNodeId;

  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);

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

  
  const displayColor = (isStart || isTarget || isSelected) ? "#dbeafe" : room.color;

  return (
    <group>
      {/* 1. Room Floor plane */}
      {floorGeo && (
        <mesh
          position={[0, 0.02, 0]}
          geometry={floorGeo}
          onPointerDown={(e) => {
            e.stopPropagation();
            const x = e.clientX ?? e.x ?? 0;
            const y = e.clientY ?? e.y ?? 0;
            pointerStartRef.current = { x, y };
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            if (!pointerStartRef.current) return;
            const x = e.clientX ?? e.x ?? 0;
            const y = e.clientY ?? e.y ?? 0;
            const dx = x - pointerStartRef.current.x;
            const dy = y - pointerStartRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            
            if (dist < 8) {
              setSelectedNodeId(room.id);
            }
            pointerStartRef.current = null;
          }}
        >
          <meshStandardMaterial
            color={displayColor}
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

      {/* 3. Floating 3D Room Marker for important highlights */}
      {(isStart || isTarget || isSelected) && (
        <group position={[room.centerX, 0, room.centerZ]}>
          <React.Suspense fallback={null}>
            <RoomMarker
              label={room.roomLabel}
              pinColor={isStart ? "#10b981" : isTarget ? "#ef4444" : "#3b82f6"} // Green for start, Red for target, Blue for selected
              pinIcon={room.pinIcon || "🏥"}
              isActive={!!isSelected}
            />
          </React.Suspense>
        </group>
      )}

      {/* 4. Glowing beacon for target/selected locations */}
      {(isTarget || isSelected) && (
        <Beacon position={[room.centerX, 0.05, room.centerZ]} />
      )}
    </group>
  );
}

export function MapRenderer({ featureCollection }: MapRendererProps) {
  const floorData3D = featureCollection.floorData3D;
  const routeData = useNavigationStore((s) => s.routeData);
  const activeFloor = useNavigationStore((s) => s.activeFloor);

  if (!floorData3D) return null;

  return (
    <group>
      {/* 1. Clinic Partitions */}
      {floorData3D.clinicPartitions.map((cp: ClinicPartitionSegment, idx: number) => (
        <mesh
          key={`clinic-part-${idx}`}
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

      {/* 4. Standalone Walls */}
      {floorData3D.standaloneWalls && floorData3D.standaloneWalls.map((seg: WallSegment, idx: number) => (
        <WallSegmentMesh
          key={`standalone-wall-${idx}`}
          seg={seg}
          wallHeight={DEFAULT_WALL_HEIGHT}
        />
      ))}

      {/* 4. Route Path Line */}
      {routeData && (
        <RoutePath
          path={routeData.path}
          centerShiftX={floorData3D.centerShiftX ?? 0}
          centerShiftZ={floorData3D.centerShiftZ ?? 0}
          activeFloor={activeFloor}
        />
      )}
    </group>
  );
}
