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
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label className={typography.label}>
            <Filter size={12} className="inline mr-1.5 opacity-70" /> Unit
          </label>
          <Select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {units?.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.code} - {unit.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={typography.label}>
            VAPS Source
          </label>
          <Select 
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={typography.label}>
            Main Group
          </label>
          <Select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={typography.label}>Search VAPS</label>
          <Input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description..."
            icon={<Search size={14} />}
          />
        </div>
      </CardContent>
    </Card>
  )
}
