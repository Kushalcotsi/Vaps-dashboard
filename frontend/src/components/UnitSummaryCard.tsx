import React from 'react';
import { Target, Activity, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from './ui/TablePrims';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';
import { useQuery } from "@tanstack/react-query";
import { fetchUnits, fetchMetadata } from "@/lib/api";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/SelectShadcn";

interface UnitSummaryProps {
  summary: {
    activations: number;
    associated: number;
    cutoff: number;
    uniqueVapsCount?: number;
    unitName: string;
    unitDescription: string;
    unitL2: string;
    unitL3: string;
  } | null;
  isLoading?: boolean;
}

export default function UnitSummaryCard({ summary, isLoading }: UnitSummaryProps) {
  const { 
    selectedUnit, setSelectedUnit, 
    selectedSource, setSelectedSource, 
    selectedGroup, setSelectedGroup
  } = useDashboardStore();
  
  const { data: units } = useQuery({ queryKey: ["units"], queryFn: fetchUnits });
  const { data: metadata } = useQuery({ queryKey: ["metadata"], queryFn: fetchMetadata });

  const sources = metadata?.sources || [];
  const groups = metadata?.groups || [];

  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  const unitAttachRate = summary && summary.activations > 0 ? summary.associated / summary.activations : 0;

  const kpis = [
    { 
      label: "VAPS ID Count", 
      value: summary ? fmtInt(summary.uniqueVapsCount || 0) : "---",
      icon: Target,
      color: "bg-slate-50 text-slate-600",
      description: "Count of unique VAPS included in current filter"
    },
    { 
      label: "Max Unit Activations", 
      value: summary ? fmtInt(summary.activations) : "---",
      icon: Activity,
      color: "bg-blue-50 text-blue-600",
      description: "Highest activation count observed for this unit"
    },
    { 
      label: "Total VAPS Associated", 
      value: summary ? fmtInt(summary.associated) : "---",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      description: "Sum of all VAPS associated with this unit"
    },
    { 
      label: "Unit Attach Rate", 
      value: summary ? fmtPct(unitAttachRate) : "---",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      description: "Aggregated baseline performance (Associated / Activations)"
    },
    { 
      label: "Unit Cutoff Benchmark", 
      value: summary ? fmtPct(summary.cutoff) : "---",
      icon: Target,
      color: "bg-orange-50 text-orange-600",
      description: "Geometric elbow point for this specific unit"
    }
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white flex flex-col gap-6">
        {/* Global Filters Section */}
        <div className="flex flex-col md:flex-row items-end gap-4 pb-6 border-b border-white/10">
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Target Unit</label>
            <Select value={selectedUnit || "all"} onValueChange={(val) => setSelectedUnit(val === "all" ? "" : val)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units?.map((unit) => <SelectItem key={unit.code} value={unit.code}>{unit.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">VAPS Source</label>
            <Select value={selectedSource || "all"} onValueChange={(val) => setSelectedSource(val === "all" ? "" : val)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Main Group</label>
            <Select value={selectedGroup || "all"} onValueChange={(val) => setSelectedGroup(val === "all" ? "" : val)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Unit Details Section */}
        {isLoading ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 w-full max-w-xl">
              <Skeleton className="h-8 w-2/3 bg-slate-700/50" />
              <Skeleton className="h-4 w-full bg-slate-700/50" />
            </div>
            <Skeleton className="h-20 w-32 rounded-xl bg-slate-700/50" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded border border-blue-500/30">Target Unit</span>
                <h1 className="text-2xl font-bold tracking-tight">{summary?.unitName || "---"}</h1>
              </div>
              <p className="text-slate-400 text-sm font-medium max-w-2xl">{summary?.unitDescription || "Unit description not available"}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Solution L2</span>
                  <span className="text-xs font-semibold text-slate-300">{summary?.unitL2 || "---"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product L3</span>
                  <span className="text-xs font-semibold text-slate-300">{summary?.unitL3 || "---"}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center min-w-[130px]">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Elbow Cutoff</span>
              <span className="text-3xl font-black tabular-nums">{summary ? fmtPct(summary.cutoff) : "---"}</span>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[120px] w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="group relative">
                <div className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-1.5 rounded-lg", kpi.color)}>
                      <kpi.icon size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                      {kpi.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 tabular-nums">{kpi.value}</span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 leading-normal font-medium italic">
                    {kpi.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
