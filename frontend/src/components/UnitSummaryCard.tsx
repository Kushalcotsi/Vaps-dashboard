import React from 'react';
import { Target, Activity, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';

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
  onCutoffClick?: () => void;
}

export default function UnitSummaryCard({ summary, isLoading, onCutoffClick }: UnitSummaryProps) {

  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  const unitAttachRate = summary && summary.activations > 0 ? summary.associated / summary.activations : 0;

  const kpis = [
    { 
      label: "VAPS ID Count", 
      value: summary ? fmtInt(summary.uniqueVapsCount || 0) : "---",
      icon: Target,
      color: "bg-slate-50 text-slate-600 border-slate-200/50",
      description: "Count of unique VAPS included in current filter"
    },
    { 
      label: "Max Unit Activations", 
      value: summary ? fmtInt(summary.activations) : "---",
      icon: Activity,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      description: "Highest activation count observed for this unit"
    },
    { 
      label: "Total VAPS Associated", 
      value: summary ? fmtInt(summary.associated) : "---",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Sum of all VAPS associated with this unit"
    },
    { 
      label: "Unit Attach Rate", 
      value: summary ? fmtPct(unitAttachRate) : "---",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Aggregated baseline performance (Associated / Activations)"
    },
    { 
      label: "Unit Cutoff Benchmark", 
      value: summary ? fmtPct(summary.cutoff) : "---",
      icon: Target,
      color: "bg-orange-50 text-orange-600 border-orange-100",
      description: "Geometric elbow point for this specific unit"
    }
  ];

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-[#00205b] to-[#00205b] px-6 py-4 text-white flex flex-col gap-4">
        {/* Unit Details Section */}
        {isLoading ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2 w-full max-w-xl">
              <Skeleton className="h-6 w-2/3 bg-slate-700/50" />
              <Skeleton className="h-4 w-full bg-slate-700/50" />
            </div>
            <Skeleton className="h-16 w-28 rounded-lg bg-slate-700/50" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded border border-blue-500/30">Target Unit</span>
                <h1 className="text-xl font-bold tracking-tight">{summary?.unitName || "---"}</h1>
              </div>
              <p className="text-slate-400 text-xs font-medium max-w-2xl">{summary?.unitDescription || "Unit description not available"}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Solution L2</span>
                  <span className="text-xs font-semibold text-slate-300">{summary?.unitL2 || "---"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Product L3</span>
                  <span className="text-xs font-semibold text-slate-300">{summary?.unitL3 || "---"}</span>
                </div>
              </div>
            </div>
            
            <div 
              onClick={onCutoffClick}
              title="Click to view Elbow Curve graph"
              className={cn(
                "rounded-lg py-2 px-3 border flex flex-col items-center justify-center min-w-[120px] transition-all duration-200",
                onCutoffClick 
                  ? "bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20 active:scale-95 cursor-pointer"
                  : "bg-white/5 border-white/10"
              )}
            >
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Elbow Cutoff</span>
              <span className="text-2xl font-black tabular-nums">{summary ? fmtPct(summary.cutoff) : "---"}</span>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="px-6 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[100px] w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="group relative">
                <div className="p-3 rounded-lg border border-slate-100 bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300 h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("p-1.5 rounded-lg", kpi.color)}>
                      <kpi.icon size={14} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                      {kpi.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-900 tabular-nums">{kpi.value}</span>
                  </div>
                  <p className="mt-1 text-[9px] text-slate-400 leading-normal font-medium italic">
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
