import {
  ApiFloor,
  ApiRoom,
  ApiBoundary,
  FloorData3D,
  RoomData3D,
  WallSegment,
  ClinicPartitionSegment,
  StandaloneDoorData,
  GeoJSONFeatureCollection,
} from "../types/map.types";

const DEG_TO_METER_X = 111320;
const DEG_TO_METER_Z = 110540;

export const CLINIC_COLORS: Record<string, string> = {
  OPH: "#ef476f",
  SUR: "#1c6ef3",
  ORTH: "#e85d04",
  Default: "#64748b",
};

function getRoomIcon(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("tim mạch")) return "❤️";
  if (l.includes("tiêu hóa")) return "🤢";
  if (l.includes("thần kinh")) return "🧠";
  if (l.includes("nhi")) return "👶";
  if (l.includes("mắt")) return "👁️";
  if (l.includes("tai mũi họng") || l.includes("họng")) return "👂";
  if (l.includes("chấn thương") || l.includes("ngoại")) return "🩹";
  if (l.includes("phế quản") || l.includes("hô hấp")) return "🫁";
  if (l.includes("da liễu")) return "🩺";
  if (l.includes("răng") || l.includes("hàm")) return "🦷";
  if (l.includes("phụ khoa") || l.includes("thai")) return "🤰";
  if (l.includes("tiêm chủng")) return "💉";
  if (l.includes("tiếp nhận")) return "🏥";
  return "🏥";
}

function getRoomColor(type: string): string {
  switch (type) {
    case "CONSULTATION":
      return "#e0f2fe";
    case "WAITING":
      return "#f0fdf4";
    case "RESTROOM":
      return "#fef2f2";
    default:
      return "#f1f5f9";
  }
}

function boundaryToWallSegment(
  boundary: ApiBoundary,
  centerShiftX: number,
  centerShiftZ: number
): WallSegment | null {
  if (
    !boundary.lineGeom ||
    !boundary.lineGeom.coordinates ||
    boundary.lineGeom.coordinates.length < 2
  ) {
    return null;
  }

  const coords = boundary.lineGeom.coordinates;
  const startX = coords[0][0] * DEG_TO_METER_X - centerShiftX;
  const startZ = -(coords[0][1] * DEG_TO_METER_Z) - centerShiftZ;
  const endX = coords[1][0] * DEG_TO_METER_X - centerShiftX;
  const endZ = -(coords[1][1] * DEG_TO_METER_Z) - centerShiftZ;

  const dx = endX - startX;
  const dz = endZ - startZ;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  return {
    startX,
    startZ,
    endX,
    endZ,
    boundaryType: boundary.boundaryType,
    length,
    angle,
    centerX: (startX + endX) / 2,
    centerZ: (startZ + endZ) / 2,
  };
}

function distToSegment(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  return Math.sqrt((px - projX) ** 2 + (pz - projZ) ** 2);
}

export function floorToRoomData(floor: ApiFloor): FloorData3D {
  const rawRooms: {
    room: ApiRoom;
    points: { x: number; z: number }[];
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }[] = [];

  let globalMinX = Infinity;
  let globalMaxX = -Infinity;
  let globalMinZ = Infinity;
  let globalMaxZ = -Infinity;

  floor.rooms.forEach((room) => {
    if (
      !room.outlineGeom ||
      !room.outlineGeom.coordinates ||
      room.outlineGeom.coordinates.length === 0
    ) {
      return;
    }

    const polygon = room.outlineGeom.coordinates[0];
    const points = polygon.map(([lng, lat]) => ({
      x: lng * DEG_TO_METER_X,
      z: -(lat * DEG_TO_METER_Z),
    }));

    const xValues = points.map((p) => p.x);
    const zValues = points.map((p) => p.z);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);

    if (minX < globalMinX) globalMinX = minX;
    if (maxX > globalMaxX) globalMaxX = maxX;
    if (minZ < globalMinZ) globalMinZ = minZ;
    if (maxZ > globalMaxZ) globalMaxZ = maxZ;

    rawRooms.push({ room, points, minX, maxX, minZ, maxZ });
  });

  if (globalMinX === Infinity) {
    globalMinX = 0;
    globalMaxX = floor.widthMeters || 120;
    globalMinZ = 0;
    globalMaxZ = floor.heightMeters || 80;
  }

  const centerShiftX = (globalMinX + globalMaxX) / 2;
  const centerShiftZ = (globalMinZ + globalMaxZ) / 2;

  const floorOutlinePoints: { x: number; z: number }[] = [];
  if (floor.outlineGeom && floor.outlineGeom.coordinates && floor.outlineGeom.coordinates.length > 0) {
    floor.outlineGeom.coordinates[0].forEach(([lng, lat]) => {
      floorOutlinePoints.push({
        x: lng * DEG_TO_METER_X - centerShiftX,
        z: -(lat * DEG_TO_METER_Z) - centerShiftZ,
      });
    });
  }

  const rooms: RoomData3D[] = rawRooms.map(({ room, points, minX, maxX, minZ, maxZ }) => {
    const centeredPoints = points.map((p) => ({
      x: p.x - centerShiftX,
      z: p.z - centerShiftZ,
    }));

    const width = maxX - minX;
    const depth = maxZ - minZ;
    const centerX = (minX + maxX) / 2 - centerShiftX;
    const centerZ = (minZ + maxZ) / 2 - centerShiftZ;

    const walls: WallSegment[] = [];
    if (room.boundaries && room.boundaries.length > 0) {
      room.boundaries.forEach((b) => {
        const seg = boundaryToWallSegment(b, centerShiftX, centerShiftZ);
        if (seg) walls.push(seg);
      });
    }

    return {
      id: room.id,
      roomCode: room.roomCode,
      roomLabel: room.roomLabel,
      type: room.type,
      clinicId: room.clinicId ?? null,
      points: centeredPoints,
      walls,
      centerX,
      centerZ,
      width,
      depth,
      height: 2.5,
      color: getRoomColor(room.type),
      pinColor: "#155DFC",
      pinIcon: getRoomIcon(room.roomLabel),
    };
  });

  const clinicPartitions: ClinicPartitionSegment[] = [];
  const areasToParse = floor.areas || (floor as any).clinics;
  if (areasToParse) {
    areasToParse.forEach((area: any) => {
      const color = CLINIC_COLORS[area.areaCode || area.clinicCode] || CLINIC_COLORS.Default;
      if (area.boundaries) {
        area.boundaries.forEach((b: any) => {
          if (b.lineGeom && b.lineGeom.coordinates && b.lineGeom.coordinates.length >= 2) {
            const coords = b.lineGeom.coordinates;
            const startX = coords[0][0] * DEG_TO_METER_X - centerShiftX;
            const startZ = -(coords[0][1] * DEG_TO_METER_Z) - centerShiftZ;
            const endX = coords[1][0] * DEG_TO_METER_X - centerShiftX;
            const endZ = -(coords[1][1] * DEG_TO_METER_Z) - centerShiftZ;

            const dx = endX - startX;
            const dz = endZ - startZ;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);

            clinicPartitions.push({
              clinicId: area.id,
              clinicCode: area.areaCode || area.clinicCode,
              clinicLabel: area.areaLabel || area.clinicLabel,
              color,
              startX,
              startZ,
              endX,
              endZ,
              length,
              angle,
              centerX: (startX + endX) / 2,
              centerZ: (startZ + endZ) / 2,
            });
          }
        });
      }
    });
  }

  const standaloneDoors: StandaloneDoorData[] = [];
  if (floor.doors) {
    floor.doors.forEach((door) => {
      if (door.roomAId === null && door.positionGeom && door.positionGeom.coordinates) {
        const ptX = door.positionGeom.coordinates[0] * DEG_TO_METER_X - centerShiftX;
        const ptZ = -(door.positionGeom.coordinates[1] * DEG_TO_METER_Z) - centerShiftZ;

        let angle = Math.PI / 2;
        let minDist = Infinity;

        rooms.forEach((r) => {
          r.walls.forEach((w) => {
            const d = distToSegment(ptX, ptZ, w.startX, w.startZ, w.endX, w.endZ);
            if (d < minDist) {
              minDist = d;
              angle = w.angle;
            }
          });
        });

        clinicPartitions.forEach((cp) => {
          const d = distToSegment(ptX, ptZ, cp.startX, cp.startZ, cp.endX, cp.endZ);
          if (d < minDist) {
            minDist = d;
            angle = cp.angle;
          }
        });

        standaloneDoors.push({
          id: door.id,
          centerX: ptX,
          centerZ: ptZ,
          width: 1.5,
          angle,
        });
      }
    });
  }

  const standaloneWalls: WallSegment[] = [];
  if (floor.standaloneBoundaries) {
    floor.standaloneBoundaries.forEach((b) => {
      if (b.boundaryType === "DOOR") {
        if (b.lineGeom && b.lineGeom.coordinates && b.lineGeom.coordinates.length >= 2) {
          const coords = b.lineGeom.coordinates;
          const startX = coords[0][0] * DEG_TO_METER_X - centerShiftX;
          const startZ = -(coords[0][1] * DEG_TO_METER_Z) - centerShiftZ;
          const endX = coords[1][0] * DEG_TO_METER_X - centerShiftX;
          const endZ = -(coords[1][1] * DEG_TO_METER_Z) - centerShiftZ;

          const dx = endX - startX;
          const dz = endZ - startZ;
          const length = Math.sqrt(dx * dx + dz * dz);
          const angle = Math.atan2(dz, dx);

          standaloneDoors.push({
            id: b.id,
            centerX: (startX + endX) / 2,
            centerZ: (startZ + endZ) / 2,
            width: length,
            angle,
          });
        }
      } else {
        const seg = boundaryToWallSegment(b, centerShiftX, centerShiftZ);
        if (seg) standaloneWalls.push(seg);
      }
    });
  }

  return {
    rooms,
    clinicPartitions,
    standaloneDoors,
    standaloneWalls,
    floorOutlinePoints,
    floorWidth: globalMaxX - globalMinX,
    floorHeight: globalMaxZ - globalMinZ,
    centerShiftX,
    centerShiftZ,
    bounds: {
      minX: globalMinX - centerShiftX,
      maxX: globalMaxX - centerShiftX,
      minZ: globalMinZ - centerShiftZ,
      maxZ: globalMaxZ - centerShiftZ,
    },
  };
}

export function buildingMapToGeoJSON(floor: ApiFloor): GeoJSONFeatureCollection {
  const floorData3D = floorToRoomData(floor);
  return {
    type: "FeatureCollection",
    features: [],
    floorData3D,
  };
}
