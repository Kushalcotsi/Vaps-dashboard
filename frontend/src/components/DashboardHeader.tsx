"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchUnits, fetchMetadata } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import { Filter, Search } from "lucide-react"

export default function DashboardHeader() {
  const { 
    selectedUnit, setSelectedUnit, 
    selectedSource, setSelectedSource, 
    selectedGroup, setSelectedGroup,
    searchQuery, setSearchQuery
  } = useDashboardStore()
  
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <Filter size={12} className="text-slate-300" /> Unit
          </label>
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
          >
            {units?.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.code} - {unit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            VAPS Source
          </label>
          <select 
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Main Group
          </label>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search VAPS</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description or code..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
