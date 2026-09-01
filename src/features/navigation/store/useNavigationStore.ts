import { create } from "zustand";
import { RoomOption } from "../types/map.types";

interface NavigationState {
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedRoom: RoomOption | null;
  setSelectedRoom: (room: RoomOption | null) => void;
  activeBuildingId: string | null;
  setActiveBuildingId: (id: string | null) => void;
  startRoom: RoomOption | null;
  setStartRoom: (room: RoomOption | null) => void;
  targetRoom: RoomOption | null;
  setTargetRoom: (room: RoomOption | null) => void;
  routeData: any | null;
  setRouteData: (data: any | null) => void;
  marker3DPositions: {
    start?: { x: number; y: number; z: number };
    dest?: { x: number; y: number; z: number };
  } | null;
  setMarker3DPositions: (
    pos: {
      start?: { x: number; y: number; z: number };
      dest?: { x: number; y: number; z: number };
    } | null
  ) => void;
}

/**
 * Navigation state store using Zustand.
 * Manages active floor level, selected rooms, active building and routing details.
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  activeFloor: 2,
  setActiveFloor: (floor) => set({ activeFloor: floor }),
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  activeBuildingId: null,
  setActiveBuildingId: (id) => set({ activeBuildingId: id }),
  startRoom: null,
  setStartRoom: (room) => set({ startRoom: room }),
  targetRoom: null,
  setTargetRoom: (room) => set({ targetRoom: room }),
  routeData: null,
  setRouteData: (data) => set({ routeData: data }),
  marker3DPositions: null,
  setMarker3DPositions: (pos) => set({ marker3DPositions: pos }),
}));
