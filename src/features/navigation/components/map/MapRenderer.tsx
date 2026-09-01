import React, { useLayoutEffect, useRef, useMemo } from "react";
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

interface WallInstanceData {
  centerX: number;
  centerZ: number;
  length: number;
  angle: number;
  wallHeight: number;
}

interface DoorInstanceData {
  centerX: number;
  centerZ: number;
  width: number;
  angle: number;
  wallHeight: number;
}

function RoomMesh({ room }: { room: RoomData3D }) {
  const startRoom = useNavigationStore((s) => s.startRoom);
  const targetRoom = useNavigationStore((s) => s.targetRoom);
  const selectedNodeId = useNavigationStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useNavigationStore((s) => s.setSelectedNodeId);
  const setSelectedRoom = useNavigationStore((s) => s.setSelectedRoom);
  const activeFloor = useNavigationStore((s) => s.activeFloor);

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

  const displayColor = (isStart || isTarget || isSelected) ? "#dbeafe" : room.color;

  return (
    <group>
      
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
              setSelectedRoom({
                id: room.id,
                roomCode: room.roomCode,
                roomLabel: room.roomLabel,
                floorNumber: activeFloor,
                type: (room as any).type || "ROOM",
              });
            }
            pointerStartRef.current = null;
          }}
        >
          <meshLambertMaterial
            color={displayColor}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {(isStart || isTarget || isSelected) && (
        <group position={[room.centerX, 0, room.centerZ]}>
          <React.Suspense fallback={null}>
            <RoomMarker
              label={room.roomLabel}
              pinColor={isStart ? "#10b981" : isTarget ? "#ef4444" : "#3b82f6"}
              pinIcon={room.pinIcon || "🏥"}
              isActive={!!isSelected}
            />
          </React.Suspense>
        </group>
      )}

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

  const wallMeshRef = useRef<THREE.InstancedMesh>(null);
  const postMeshRef = useRef<THREE.InstancedMesh>(null);
  const lintelMeshRef = useRef<THREE.InstancedMesh>(null);

  const { walls, doors } = useMemo(() => {
    const wallsList: WallInstanceData[] = [];
    const doorsList: DoorInstanceData[] = [];

    if (!floorData3D) return { walls: wallsList, doors: doorsList };

    floorData3D.rooms.forEach((room: RoomData3D) => {
      const isReception =
        room.roomCode.toLowerCase().includes("reception") ||
        room.roomLabel.toLowerCase().includes("tiếp nhận");
      const wallH = isReception ? 1.5 : DEFAULT_WALL_HEIGHT;

      room.walls.forEach((seg: WallSegment) => {
        if (seg.boundaryType === "DOOR") {
          doorsList.push({
            centerX: seg.centerX,
            centerZ: seg.centerZ,
            width: seg.length,
            angle: seg.angle,
            wallHeight: wallH,
          });
        } else {
          wallsList.push({
            centerX: seg.centerX,
            centerZ: seg.centerZ,
            length: seg.length,
            angle: seg.angle,
            wallHeight: wallH,
          });
        }
      });
    });

    floorData3D.clinicPartitions.forEach((cp: ClinicPartitionSegment) => {
      wallsList.push({
        centerX: cp.centerX,
        centerZ: cp.centerZ,
        length: cp.length,
        angle: cp.angle,
        wallHeight: DEFAULT_WALL_HEIGHT,
      });
    });

    floorData3D.standaloneDoors.forEach((door: StandaloneDoorData) => {
      doorsList.push({
        centerX: door.centerX,
        centerZ: door.centerZ,
        width: door.width,
        angle: door.angle,
        wallHeight: DEFAULT_WALL_HEIGHT,
      });
    });

    if (floorData3D.standaloneWalls) {
      floorData3D.standaloneWalls.forEach((seg: WallSegment) => {
        if (seg.boundaryType === "DOOR") {
          doorsList.push({
            centerX: seg.centerX,
            centerZ: seg.centerZ,
            width: seg.length,
            angle: seg.angle,
            wallHeight: DEFAULT_WALL_HEIGHT,
          });
        } else {
          wallsList.push({
            centerX: seg.centerX,
            centerZ: seg.centerZ,
            length: seg.length,
            angle: seg.angle,
            wallHeight: DEFAULT_WALL_HEIGHT,
          });
        }
      });
    }

    return { walls: wallsList, doors: doorsList };
  }, [floorData3D]);

  useLayoutEffect(() => {
    const temp = new THREE.Object3D();

    if (wallMeshRef.current && walls.length > 0) {
      walls.forEach((wall, idx) => {
        temp.position.set(wall.centerX, wall.wallHeight / 2, wall.centerZ);
        temp.rotation.set(0, -wall.angle, 0);
        temp.scale.set(wall.length, wall.wallHeight, WALL_THICKNESS);
        temp.updateMatrix();
        wallMeshRef.current!.setMatrixAt(idx, temp.matrix);
      });
      wallMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (doors.length > 0) {
      const doorFrameHeight = 0.35;

      if (postMeshRef.current) {
        doors.forEach((door, idx) => {
          const halfW = door.width / 2;
          const cosA = Math.cos(door.angle);
          const sinA = Math.sin(door.angle);

          const leftX = door.centerX - cosA * halfW;
          const leftZ = door.centerZ - sinA * halfW;
          temp.position.set(leftX, door.wallHeight / 2, leftZ);
          temp.rotation.set(0, -door.angle, 0);
          temp.scale.set(0.12, door.wallHeight, WALL_THICKNESS + 0.06);
          temp.updateMatrix();
          postMeshRef.current!.setMatrixAt(idx * 2, temp.matrix);

          const rightX = door.centerX + cosA * halfW;
          const rightZ = door.centerZ + sinA * halfW;
          temp.position.set(rightX, door.wallHeight / 2, rightZ);
          temp.rotation.set(0, -door.angle, 0);
          temp.scale.set(0.12, door.wallHeight, WALL_THICKNESS + 0.06);
          temp.updateMatrix();
          postMeshRef.current!.setMatrixAt(idx * 2 + 1, temp.matrix);
        });
        postMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      if (lintelMeshRef.current) {
        doors.forEach((door, idx) => {
          temp.position.set(door.centerX, door.wallHeight - doorFrameHeight / 2, door.centerZ);
          temp.rotation.set(0, -door.angle, 0);
          temp.scale.set(door.width + 0.1, doorFrameHeight, WALL_THICKNESS + 0.06);
          temp.updateMatrix();
          lintelMeshRef.current!.setMatrixAt(idx, temp.matrix);
        });
        lintelMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  }, [walls, doors]);

  if (!floorData3D) return null;

  return (
    <group>
      
      {walls.length > 0 && (
        <instancedMesh
          key={`walls-${activeFloor}-${walls.length}`}
          ref={wallMeshRef}
          args={[null as any, null as any, walls.length]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial
            color="#ffffff"
          />
        </instancedMesh>
      )}

      {doors.length > 0 && (
        <instancedMesh
          key={`door-posts-${activeFloor}-${doors.length}`}
          ref={postMeshRef}
          args={[null as any, null as any, doors.length * 2]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial
            color="#000000"
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </instancedMesh>
      )}

      {doors.length > 0 && (
        <instancedMesh
          key={`door-lintels-${activeFloor}-${doors.length}`}
          ref={lintelMeshRef}
          args={[null as any, null as any, doors.length]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial
            color="#000000"
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </instancedMesh>
      )}

      {floorData3D.rooms.map((room: RoomData3D) => (
        <RoomMesh key={`room-${room.id}`} room={room} />
      ))}

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
