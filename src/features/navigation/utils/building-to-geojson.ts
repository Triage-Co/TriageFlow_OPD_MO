import { ApiFloor, ApiRoom, GeoJSONFeature, GeoJSONFeatureCollection } from "../types/map.types";

const DEG_TO_METER_X = 111000; // Longitude to meters at target latitude
const DEG_TO_METER_Z = 111111; // Latitude to meters

/**
 * Maps specialty names or keywords to specific emojis
 */
function getRoomIcon(label: string): string {
  const lowercaseLabel = label.toLowerCase();
  if (lowercaseLabel.includes("tim mạch")) return "❤️";
  if (lowercaseLabel.includes("tiêu hóa")) return "🤢";
  if (lowercaseLabel.includes("thần kinh")) return "🧠";
  if (lowercaseLabel.includes("nhi")) return "👶";
  if (lowercaseLabel.includes("mắt")) return "👁️";
  if (lowercaseLabel.includes("tai mũi họng") || lowercaseLabel.includes("họng")) return "👂";
  if (lowercaseLabel.includes("chấn thương") || lowercaseLabel.includes("ngoại")) return "🩹";
  if (lowercaseLabel.includes("phế quản") || lowercaseLabel.includes("hô hấp")) return "🫁";
  return "🏥";
}

/**
 * Maps room properties to specific colors
 */
function getRoomColor(type: string): string {
  switch (type) {
    case "CONSULTATION":
      return "#ffffff";
    case "WAITING":
      return "#f0fdf4"; // soft green
    case "RESTROOM":
      return "#fef2f2"; // soft red
    default:
      return "#ffffff";
  }
}

/**
 * Maps room properties to specific pin colors
 */
function getRoomPinColor(label: string): string {
  const lowercaseLabel = label.toLowerCase();
  if (lowercaseLabel.includes("tim mạch")) return "#ef4444"; // red
  if (lowercaseLabel.includes("nhi")) return "#eab308"; // yellow
  if (lowercaseLabel.includes("thần kinh")) return "#a855f7"; // purple
  return "#3b82f6"; // primary blue
}

/**
 * Transforms backend API floor data into the custom GeoJSON representation for the 3D renderer.
 */
export function buildingMapToGeoJSON(floor: ApiFloor): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  // Width and height in meters of the floor
  const floorWidth = floor.widthMeters || 120;
  const floorHeight = floor.heightMeters || 80;

  // The center offsets to align coordinate origin at [0, 0] in Three.js
  const offsetX = floorWidth / 2;
  const offsetZ = floorHeight / 2;

  floor.rooms.forEach((room: ApiRoom) => {
    // 1. Extract outline polygon coordinates
    if (
      !room.outlineGeom ||
      !room.outlineGeom.coordinates ||
      room.outlineGeom.coordinates.length === 0
    ) {
      return;
    }

    const polygon = room.outlineGeom.coordinates[0];
    const xValues = polygon.map(coord => coord[0] * DEG_TO_METER_X);
    const zValues = polygon.map(coord => coord[1] * DEG_TO_METER_Z);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);

    const width = maxX - minX;
    const depth = maxZ - minZ;

    // Center coordinates in degree-based meters
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Center relative to floor slab center
    const sceneX = centerX - offsetX;
    const sceneZ = centerZ - offsetZ;

    // 2. Determine door position & offset
    let doorPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    let doorOffset = 0;

    const doorBoundary = room.boundaries.find(b => b.boundaryType === "DOOR");
    if (
      doorBoundary &&
      doorBoundary.lineGeom &&
      doorBoundary.lineGeom.coordinates &&
      doorBoundary.lineGeom.coordinates.length >= 2
    ) {
      const doorCoords = doorBoundary.lineGeom.coordinates;
      const doorX = ((doorCoords[0][0] + doorCoords[1][0]) / 2) * DEG_TO_METER_X;
      const doorZ = ((doorCoords[0][1] + doorCoords[1][1]) / 2) * DEG_TO_METER_Z;

      const distTop = Math.abs(doorZ - minZ);
      const distBottom = Math.abs(doorZ - maxZ);
      const distLeft = Math.abs(doorX - minX);
      const distRight = Math.abs(doorX - maxX);

      const minDist = Math.min(distTop, distBottom, distLeft, distRight);
      if (minDist === distTop) {
        doorPosition = 'top';
        doorOffset = doorX - centerX;
      } else if (minDist === distBottom) {
        doorPosition = 'bottom';
        doorOffset = doorX - centerX;
      } else if (minDist === distLeft) {
        doorPosition = 'left';
        doorOffset = doorZ - centerZ;
      } else {
        doorPosition = 'right';
        doorOffset = doorZ - centerZ;
      }
    }

    // 3. Create the GeoJSON Feature
    features.push({
      type: 'Feature',
      id: room.id,
      properties: {
        id: room.id,
        label: room.roomLabel,
        type: 'room',
        position: [sceneX, 0, sceneZ],
        size: [width, depth],
        doorPosition,
        doorOffset,
        color: getRoomColor(room.type),
        pinColor: getRoomPinColor(room.roomLabel),
        pinIcon: getRoomIcon(room.roomLabel),
        floor: floor.floorNumber
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}
