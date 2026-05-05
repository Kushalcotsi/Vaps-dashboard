"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchUnits, fetchDashboardData, fetchMetadata } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import { Filter } from "lucide-react"

export default function DashboardHeader() {
  const { selectedUnit, setSelectedUnit, selectedSource, setSelectedSource, selectedGroup, setSelectedGroup } = useDashboardStore()
  
  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: fetchUnits
  })

  const { data: metadata } = useQuery({
    queryKey: ["metadata"],
    queryFn: fetchMetadata
  })

  const sources = metadata?.sources || [];
  const groups = metadata?.groups || [];

  return (
    <header className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Guided Selling: VAPS Recommendation for Basic GLO Units
        </h1>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl">
          Consolidated contract years 2024-2026. Select a unit to review VAPS attachment patterns by unit, market segment, division, and region.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <Filter size={12} className="text-slate-300" /> Unit
          </label>
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300"
          >
            {units?.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.code} - {unit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
            VAPS Source
          </label>
          <select 
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300"
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
            Main Group
          </label>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300"
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
