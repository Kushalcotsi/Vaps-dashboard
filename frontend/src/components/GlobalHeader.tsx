import React from "react";
import { BrandLogo } from "./BrandLogo";
import { useQuery } from "@tanstack/react-query";
import { fetchUnits, fetchMetadata } from "@/lib/api";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/SelectShadcn";

export function GlobalHeader() {
  const { 
    selectedUnit, setSelectedUnit, 
    selectedSource, setSelectedSource, 
    selectedGroup, setSelectedGroup
  } = useDashboardStore();

  const { data: units } = useQuery({ queryKey: ["units"], queryFn: fetchUnits });
  const { data: metadata } = useQuery({ queryKey: ["metadata"], queryFn: fetchMetadata });

  const sources = metadata?.sources || [];
  const groups = metadata?.groups || [];

  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm shrink-0">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 shrink-0">
          <BrandLogo className="h-11 w-auto" />
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-sm font-semibold text-slate-800 tracking-tight">
            Guided Selling: VAPS Recommendation for Office Space | Single Wide
          </h1>
        </div>
        
        {/* Global Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"></span>
            <div className="w-48">
              <Select value={selectedUnit || "all"} onValueChange={(val) => setSelectedUnit(val === "all" ? "all" : val)}>
                <SelectTrigger variantSize="sm" className="bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Units</SelectItem>
                  {units?.map((unit) => <SelectItem variantSize="sm" key={unit.code} value={unit.code}>{unit.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"></span>
            <div className="w-40">
              <Select value={selectedSource || "all"} onValueChange={(val) => setSelectedSource(val === "all" ? "" : val)}>
                <SelectTrigger variantSize="sm" className="bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Sources</SelectItem>
                  {sources.map(s => <SelectItem variantSize="sm" key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"></span>
            <div className="w-40">
              <Select value={selectedGroup || "all"} onValueChange={(val) => setSelectedGroup(val === "all" ? "" : val)}>
                <SelectTrigger variantSize="sm" className="bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Groups</SelectItem>
                  {groups.map(g => <SelectItem variantSize="sm" key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
