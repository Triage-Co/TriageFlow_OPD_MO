import { create } from "zustand";

interface NavigationState {
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

/**
 * Navigation state store using Zustand.
 * Manages active floor level and selected rooms.
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  activeFloor: 2,
  setActiveFloor: (floor) => set({ activeFloor: floor }),
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));
