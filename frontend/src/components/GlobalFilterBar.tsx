"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUnits, fetchMetadata } from "@/lib/api";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/SelectShadcn";
import { Filter, RotateCcw } from "lucide-react";
import { UNIT_TYPES, MOCK_PRODUCT_CODES, getDynamicProductCodes } from "@/lib/mockProductCodes";
import { fetchUnitMarketMetadata } from "@/lib/api";
import { useUnitMarketStore } from "@/store/useUnitMarketStore";

export function GlobalFilterBar() {
  const { 
    unitType, setUnitType,
    selectedUnit, setSelectedUnit, 
    selectedSource, setSelectedSource, 
    selectedGroup, setSelectedGroup,
    activeTab
  } = useDashboardStore();

  const {
    unitType: umUnitType, setUnitType: setUmUnitType,
    selectedUnit: umSelectedUnit, setSelectedUnit: setUmSelectedUnit,
    selectedMarket: umSelectedMarket, setSelectedMarket: setUmSelectedMarket
  } = useUnitMarketStore();

  const { data: units } = useQuery({ queryKey: ["units"], queryFn: fetchUnits, staleTime: 600000, gcTime: 1800000 });
  const { data: metadata } = useQuery({ queryKey: ["metadata"], queryFn: fetchMetadata, staleTime: 600000, gcTime: 1800000 });
  const { data: umMetadata } = useQuery({ queryKey: ["um_metadata"], queryFn: fetchUnitMarketMetadata, staleTime: 600000, gcTime: 1800000 });

  const sources = metadata?.sources || [];
  const groups = metadata?.groups || [];

  const umUnits = umMetadata?.units || [];
  const umMarkets = umMetadata?.markets || [];

  const isUM = activeTab.startsWith("um_");

  const availableUnitCodes = React.useMemo(() => {
    return new Set((units || []).map(u => u.code));
  }, [units]);

  const sortedProductCodes = React.useMemo(() => {
    return getDynamicProductCodes(unitType, availableUnitCodes);
  }, [unitType, availableUnitCodes]);

  const availableUmUnitCodes = React.useMemo(() => {
    return new Set((umUnits || []).map((u: any) => u.code));
  }, [umUnits]);

  const sortedUmProductCodes = React.useMemo(() => {
    return getDynamicProductCodes(umUnitType, availableUmUnitCodes);
  }, [umUnitType, availableUmUnitCodes]);

  const handleReset = () => {
    if (isUM) {
      setUmSelectedUnit("all");
      setUmSelectedMarket("all");
    } else {
      setSelectedUnit("all");
      setSelectedSource("");
      setSelectedGroup("");
    }
  };

  const isFiltered = isUM 
    ? (umSelectedUnit !== "all" || umSelectedMarket !== "all")
    : ((selectedUnit && selectedUnit !== "all") || selectedSource || selectedGroup);

  return (
    <div className="w-full border-b border-slate-200 bg-white py-2 px-4 flex items-center justify-between shrink-0 shadow-sm z-40">
      {/* Left: Global Filters Label */}
      <div className="flex items-center gap-2 text-slate-500 shrink-0 select-none">
        {/* <Filter className="h-4 w-4" /> */}
        <span className="text-sm font-semibold text-slate-700">Viewing</span>
      </div>

      {/* Middle: Premium Select Dropdowns */}
      <div className="flex flex-1 items-center justify-start gap-4 ml-6 max-w-5xl">
        {!isUM ? (
          <>
            {/* UNIT TYPE */}
            <div className="flex flex-col gap-1 w-32 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5">Unit Type</span>
              <Select 
                value={unitType || "All"} 
                onValueChange={(val) => {
                  setUnitType(val);
                  setSelectedUnit("all");
                }}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(type => (
                    <SelectItem variantSize="sm" key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PRODUCT CODE (SF) */}
            <div className="flex flex-col gap-1 w-56 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5 whitespace-nowrap">
                {unitType} - Product Code (SF)
              </span>
              <Select 
                value={selectedUnit || "all"} 
                onValueChange={(val) => setSelectedUnit(val === "all" ? "all" : val)}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Product Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Product Codes</SelectItem>
                  {sortedProductCodes.withData.map((code) => (
                    <SelectItem variantSize="sm" key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                  {sortedProductCodes.withoutData.map((code) => (
                    <SelectItem 
                      variantSize="sm" 
                      key={code} 
                      value={code} 
                      disabled={true}
                      className="opacity-40 text-slate-400 italic"
                    >
                      {code} (No Data)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* VAPS SOURCE */}
            <div className="flex flex-col gap-1 w-48 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5">Vaps Source</span>
              <Select 
                value={selectedSource || "all"} 
                onValueChange={(val) => setSelectedSource(val === "all" ? "" : val)}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Sources</SelectItem>
                  {sources
                    .filter((s) => s && String(s).trim().toLowerCase() !== "all" && String(s).trim().toLowerCase() !== "all sources")
                    .map((s) => (
                      <SelectItem variantSize="sm" key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* MAIN GROUP */}
            <div className="flex flex-col gap-1 w-48 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5">Main Group</span>
              <Select 
                value={selectedGroup || "all"} 
                onValueChange={(val) => setSelectedGroup(val === "all" ? "" : val)}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Groups</SelectItem>
                  {groups
                    .filter((g) => g && String(g).trim().toLowerCase() !== "all" && String(g).trim().toLowerCase() !== "all groups")
                    .map((g) => (
                      <SelectItem variantSize="sm" key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            {/* UNIT MARKET - UNIT TYPE */}
            <div className="flex flex-col gap-1 w-32 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5">Unit Type</span>
              <Select 
                value={umUnitType || "All"} 
                onValueChange={(val) => {
                  setUmUnitType(val);
                  setUmSelectedUnit("all");
                }}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(type => (
                    <SelectItem variantSize="sm" key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* UNIT MARKET - PRODUCT CODE (SF) */}
            <div className="flex flex-col gap-1 w-56 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5 whitespace-nowrap">
                {umUnitType} - Product Code (SF)
              </span>
              <Select 
                value={umSelectedUnit || "all"} 
                onValueChange={(val) => setUmSelectedUnit(val === "all" ? "all" : val)}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Product Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Product Codes</SelectItem>
                  {sortedUmProductCodes.withData.map((code) => (
                    <SelectItem variantSize="sm" key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                  {sortedUmProductCodes.withoutData.map((code) => (
                    <SelectItem 
                      variantSize="sm" 
                      key={code} 
                      value={code} 
                      disabled={true}
                      className="opacity-40 text-slate-400 italic"
                    >
                      {code} (No Data)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* UNIT MARKET - MARKET SEGMENT */}
            <div className="flex flex-col gap-1 w-48 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 leading-none mb-0.5">Market Segment</span>
              <Select 
                value={umSelectedMarket || "all"} 
                onValueChange={(val) => setUmSelectedMarket(val === "all" ? "all" : val)}
              >
                <SelectTrigger className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Markets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem variantSize="sm" value="all">All Markets</SelectItem>
                  {umMarkets
                    .filter((m: any) => m && String(m).trim().toLowerCase() !== "all" && String(m).trim().toLowerCase() !== "all markets")
                    .map((m: any) => (
                      <SelectItem variantSize="sm" key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
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

