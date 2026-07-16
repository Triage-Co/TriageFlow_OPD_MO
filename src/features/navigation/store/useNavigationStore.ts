import { create } from "zustand";

interface NavigationState {
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
  viewMode: '2D' | '3D';
  setViewMode: (mode: '2D' | '3D') => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

/**
 * Navigation state store using Zustand.
 * Manages active floor level, view modes (2D vs 3D), and selected rooms.
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  activeFloor: 1,
  setActiveFloor: (floor) => set({ activeFloor: floor }),
  viewMode: '3D',
  setViewMode: (mode) => set({ viewMode: mode }),
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));
