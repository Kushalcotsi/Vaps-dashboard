import React from 'react';
import { Target, Activity, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from './ui/TablePrims';
import { typography } from '@/design-system/typography';
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
}

export default function UnitSummaryCard({ summary, isLoading }: UnitSummaryProps) {
  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <div className="grid grid-cols-4 gap-6 mt-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded border border-blue-500/30">Target Unit</span>
              <h1 className="text-3xl font-bold tracking-tight">{summary?.unitName || "---"}</h1>
            </div>
            <p className="text-slate-400 font-medium max-w-2xl">{summary?.unitDescription || "Unit description not available"}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
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
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex flex-col items-center justify-center min-w-[140px]">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Elbow Cutoff</span>
            <span className="text-4xl font-black tabular-nums">{summary ? fmtPct(summary.cutoff) : "---"}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="group relative">
              <div className="p-5 rounded-xl border border-slate-100 bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", kpi.color)}>
                    <kpi.icon size={18} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                    {kpi.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">{kpi.value}</span>
                </div>
                <p className="mt-3 text-[10px] text-slate-400 leading-normal font-medium italic">
                  {kpi.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
