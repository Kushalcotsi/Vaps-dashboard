import { create } from 'zustand'

interface UnitMarketState {
  unitType: string;
  selectedUnit: string;
  selectedMarket: string;
  setUnitType: (unitType: string) => void;
  setSelectedUnit: (unit: string) => void;
  setSelectedMarket: (market: string) => void;
}

export const useUnitMarketStore = create<UnitMarketState>((set) => ({
  unitType: 'All',
  selectedUnit: 'all', 
  selectedMarket: 'all',
  setUnitType: (unitType) => set({ unitType }),
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
}))
