"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchUnits, fetchMetadata } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import { Filter, Search } from "lucide-react"
import { Card, CardContent } from "./ui/Card"
import { Input, Select } from "./ui/Input"
import { typography } from "@/design-system/typography"

export default function DashboardHeader() {
  const { 
    selectedUnit, setSelectedUnit, 
    selectedSource, setSelectedSource, 
    selectedGroup, setSelectedGroup,
    selectedMarket, setSelectedMarket,
    selectedDivision, setSelectedDivision,
    selectedRegion, setSelectedRegion,
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
  const markets = metadata?.markets || [];
  const divisions = metadata?.divisions || [];
  const regions = metadata?.regions || [];

  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end p-5">
        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Unit</label>
          <Select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} variantSize="sm">
            <option value="all">All Units</option>
            {units?.map((unit) => <option key={unit.code} value={unit.code}>{unit.code}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Market</label>
          <Select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} variantSize="sm">
            <option value="">All Markets</option>
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Division</label>
          <Select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} variantSize="sm">
            <option value="">All Divisions</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Region</label>
          <Select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} variantSize="sm">
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Source</label>
          <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} variantSize="sm">
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Group</label>
          <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} variantSize="sm">
            <option value="">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Search</label>
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="VAPS ID..."
            icon={<Search size={12} />}
            variantSize="sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}
