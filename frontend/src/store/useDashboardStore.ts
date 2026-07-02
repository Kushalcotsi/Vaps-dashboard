import { create } from 'zustand'

interface DashboardState {
  unitType: string;
  selectedUnit: string;
  selectedSource: string;
  selectedGroup: string;
  setUnitType: (type: string) => void;
  setSelectedUnit: (unit: string) => void;
  setSelectedSource: (source: string) => void;
  setSelectedGroup: (group: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  unitType: 'Glo',
  selectedUnit: 'all', 
  selectedSource: '',
  selectedGroup: '',
  setUnitType: (type) => set({ unitType: type, selectedUnit: 'all' }), // reset selected unit on type change
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
}))
