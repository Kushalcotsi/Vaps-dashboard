import { create } from 'zustand'

interface DashboardState {
  selectedUnit: string;
  selectedSource: string;
  selectedGroup: string;
  selectedMarket: string;
  selectedDivision: string;
  selectedRegion: string;
  setSelectedUnit: (unit: string) => void;
  setSelectedSource: (source: string) => void;
  setSelectedGroup: (group: string) => void;
  setSelectedMarket: (market: string) => void;
  setSelectedDivision: (division: string) => void;
  setSelectedRegion: (region: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedUnit: 'all', 
  selectedSource: '',
  selectedGroup: '',
  selectedMarket: '',
  selectedDivision: '',
  selectedRegion: '',
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setSelectedDivision: (division) => set({ selectedDivision: division }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
