

export interface ApiBuilding {
  id: string;
  name: string;
  addressLabel: string;
  totalFloors: number;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
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
    coordinates: [number, number][]; 
  };
}

export interface ApiRoom {
  id: string;
  floorId: string;
  roomCode: string;
  roomLabel: string;
  type: string; 
  heightMeters: number;
  clinicId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  centerGeom: {
    type: 'Point';
    coordinates: [number, number]; 
  };
  outlineGeom: {
    type: 'Polygon';
    coordinates: [number, number][][]; 
  };
  boundaries: ApiBoundary[];
  pois: any[];
}

export interface ApiDoor {
  id: string;
  floorId: string;
  nodeId: string | null;
  roomAId: string | null;
  roomBId: string | null;
  isAccessible: boolean;
  isEmergency: boolean;
  active: boolean;
  createdAt?: string;
  positionGeom: {
    type: 'Point';
    coordinates: [number, number]; 
  };
}

export interface ApiClinicBoundary {
  id: string;
  clinicId: string;
  lineGeom: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface ApiClinic {
  id: string;
  clinicCode: string;
  clinicLabel: string;
  boundaries?: ApiClinicBoundary[];
}

export interface ApiArea {
  id: string;
  floorId: string;
  areaCode: string;
  areaLabel: string;
  description: string | null;
  centerGeom: {
    type: "Point";
    coordinates: [number, number];
  };
  outlineGeom: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  boundaries?: ApiBoundary[];
}

export interface ApiFloor {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorPlanImageUrl: string | null;
  widthMeters: number;
  heightMeters: number;
  scalePixelsPerMeter: number;
  createdAt?: string;
  updatedAt?: string;
  outlineGeom: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  rooms: ApiRoom[];
  doors: ApiDoor[];
  clinics?: ApiClinic[];
  areas?: ApiArea[];
  standaloneBoundaries?: ApiBoundary[];
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



export interface WallSegment {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  boundaryType: 'WALL' | 'DOOR' | 'WINDOW' | 'CORRIDOR' | 'OPENING';
  length: number;
  angle: number;
  centerX: number;
  centerZ: number;
}

export interface ClinicPartitionSegment {
  clinicId: string;
  clinicCode: string;
  clinicLabel: string;
  color: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  length: number;
  angle: number;
  centerX: number;
  centerZ: number;
}

export interface StandaloneDoorData {
  id: string;
  centerX: number;
  centerZ: number;
  width: number;
  angle: number;
}

export interface RoomData3D {
  id: string;
  roomCode: string;
  roomLabel: string;
  type: string;
  clinicId: string | null;
  points: { x: number; z: number }[];
  walls: WallSegment[];
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  pinColor: string;
  pinIcon: string;
}

export interface RoomOption {
  id: string;
  roomCode: string;
  roomLabel: string;
  floorNumber: number;
  type: string;
}

export interface FloorData3D {
  rooms: RoomData3D[];
  clinicPartitions: ClinicPartitionSegment[];
  standaloneDoors: StandaloneDoorData[];
  standaloneWalls: WallSegment[];
  floorOutlinePoints: { x: number; z: number }[];
  floorWidth: number;
  floorHeight: number;
  centerShiftX?: number;
  centerShiftZ?: number;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}



export type MapFeatureType = 'room' | 'corridor' | 'elevator' | 'stairs' | 'slab';

export interface GeoJSONFeatureProperties {
  id?: string;
  label?: string;
  type: MapFeatureType;
  position: [number, number, number];
  size?: [number, number] | [number, number, number];
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
  floorData3D?: FloorData3D;
  rawMap?: BuildingMapData;
}
