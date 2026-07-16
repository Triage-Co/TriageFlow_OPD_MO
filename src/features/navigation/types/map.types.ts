// ─── API Response Types (Backend schema) ──────────────────────────────────────

export interface ApiBuilding {
  id: string;
  name: string;
  addressLabel: string;
  totalFloors: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBoundary {
  id: string;
  roomId: string;
  seqNo: number;
  boundaryType: 'WALL' | 'DOOR' | 'WINDOW' | 'CORRIDOR' | 'OPENING';
  adjacentRoomId: string | null;
  hasWall: boolean;
  doorId: string | null;
  lineGeom: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
}

export interface ApiRoom {
  id: string;
  floorId: string;
  roomCode: string;
  roomLabel: string;
  type: string; // e.g. "CONSULTATION"
  heightMeters: number;
  createdAt: string;
  updatedAt: string;
  centerGeom: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  outlineGeom: {
    type: 'Polygon';
    coordinates: [number, number][][]; // array of polygons of [lng, lat]
  };
  boundaries: ApiBoundary[];
  pois: any[];
}

export interface ApiDoor {
  id: string;
  floorId: string;
  nodeId: string | null;
  roomAId: string;
  roomBId: string | null;
  isAccessible: boolean;
  isEmergency: boolean;
  active: boolean;
  createdAt: string;
  positionGeom: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface ApiFloor {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorPlanImageUrl: string | null;
  widthMeters: number;
  heightMeters: number;
  scalePixelsPerMeter: number;
  createdAt: string;
  updatedAt: string;
  outlineGeom: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  rooms: ApiRoom[];
  doors: ApiDoor[];
}

export interface BuildingMapData {
  building: ApiBuilding;
  floors: ApiFloor[];
}

export interface BuildingMapResponse {
  code: number;
  message: string;
  status: string;
  data: BuildingMapData;
}

// ─── GeoJSON Types for the 3D Map Renderer ────────────────────────────────────

export type MapFeatureType = 'room' | 'corridor' | 'elevator' | 'stairs' | 'slab';

export interface GeoJSONFeatureProperties {
  id?: string;
  label?: string;
  type: MapFeatureType;
  position: [number, number, number]; // [x, y, z] in scene meters
  size?: [number, number] | [number, number, number]; // [width, depth] or [w, h, d]
  rotation?: [number, number, number];
  doorPosition?: 'top' | 'bottom' | 'left' | 'right';
  doorOffset?: number;
  color?: string;
  pinColor?: string;
  pinIcon?: string;
  floor?: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string;
  geometry?: any;
  properties: GeoJSONFeatureProperties;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
