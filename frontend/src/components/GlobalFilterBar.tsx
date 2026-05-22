"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUnits, fetchMetadata } from "@/lib/api";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/SelectShadcn";
import { Filter, RotateCcw } from "lucide-react";

export function GlobalFilterBar() {
  const { 
    selectedUnit, setSelectedUnit, 
    selectedSource, setSelectedSource, 
    selectedGroup, setSelectedGroup
  } = useDashboardStore();

  const { data: units } = useQuery({ queryKey: ["units"], queryFn: fetchUnits });
  const { data: metadata } = useQuery({ queryKey: ["metadata"], queryFn: fetchMetadata });

  const sources = metadata?.sources || [];
  const groups = metadata?.groups || [];

  const handleReset = () => {
    setSelectedUnit("all");
    setSelectedSource("");
    setSelectedGroup("");
  };

  const isFiltered = (selectedUnit && selectedUnit !== "all") || selectedSource || selectedGroup;

  return (
    <div className="w-full border-b border-slate-200 bg-white py-2 px-4 flex items-center justify-between shrink-0 shadow-sm z-40">
      {/* Left: Global Filters Label */}
      <div className="flex items-center gap-2 text-slate-500 shrink-0 select-none">
        {/* <Filter className="h-4 w-4" /> */}
        <span className="text-sm font-semibold text-slate-700">Viewing</span>
      </div>

      {/* Middle: Premium Select Dropdowns */}
      <div className="flex flex-1 items-center justify-start gap-6 ml-8 max-w-5xl">
        {/* TARGET UNIT */}
        <div className="flex flex-col gap-1 w-72">
          <span className="text-xs font-medium text-slate-500 leading-none mb-0.5">Target Unit</span>
          <Select 
            value={selectedUnit || "all"} 
            onValueChange={(val) => setSelectedUnit(val === "all" ? "all" : val)}
          >
            <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Units</SelectItem>
              {units?.map((unit) => (
                <SelectItem variantSize="sm" key={unit.code} value={unit.code}>
                  {unit.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* VAPS SOURCE */}
        <div className="flex flex-col gap-1 w-56">
          <span className="text-xs font-medium text-slate-500 leading-none mb-0.5">Vaps Source</span>
          <Select 
            value={selectedSource || "all"} 
            onValueChange={(val) => setSelectedSource(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Sources</SelectItem>
              {sources.map((s) => (
                <SelectItem variantSize="sm" key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* MAIN GROUP */}
        <div className="flex flex-col gap-1 w-56">
          <span className="text-xs font-medium text-slate-500 leading-none mb-0.5">Main Group</span>
          <Select 
            value={selectedGroup || "all"} 
            onValueChange={(val) => setSelectedGroup(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Groups</SelectItem>
              {groups.map((g) => (
                <SelectItem variantSize="sm" key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: Reset Filters Button */}
      {isFiltered ? (
        <button 
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50/50 hover:bg-indigo-50 py-1.5 px-3 rounded-lg border border-indigo-100 cursor-pointer shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      ) : (
        <div className="w-[100px] shrink-0" /> // spacer to keep width aligned
      )}
    </div>
  );
}

