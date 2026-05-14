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
    selectedGroup, setSelectedGroup
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
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-5">
        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Unit</label>
          <Select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} variantSize="sm">
            <option value="all">All Units</option>
            {units?.map((unit) => <option key={unit.code} value={unit.code}>{unit.code}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>VAPS Source</label>
          <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} variantSize="sm">
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={typography.label}>Main Group</label>
          <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} variantSize="sm">
            <option value="">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
