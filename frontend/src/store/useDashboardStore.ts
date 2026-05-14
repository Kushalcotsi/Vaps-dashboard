import { create } from 'zustand'

interface DashboardState {
  selectedUnit: string;
  selectedSource: string;
  selectedGroup: string;
  setSelectedUnit: (unit: string) => void;
  setSelectedSource: (source: string) => void;
  setSelectedGroup: (group: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedUnit: 'all', 
  selectedSource: '',
  selectedGroup: '',
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
}))
