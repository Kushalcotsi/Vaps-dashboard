import { create } from 'zustand'

interface DashboardState {
  unitType: string;
  selectedUnit: string;
  selectedSource: string;
  selectedGroup: string;
  activeTab: string;
  setUnitType: (type: string) => void;
  setSelectedUnit: (unit: string) => void;
  setSelectedSource: (source: string) => void;
  setSelectedGroup: (group: string) => void;
  setActiveTab: (tab: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  unitType: 'All',
  selectedUnit: 'all', 
  selectedSource: '',
  selectedGroup: '',
  activeTab: 'overview',
  setUnitType: (type) => set({ unitType: type, selectedUnit: 'all' }), // reset selected unit on type change
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
