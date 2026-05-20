import React from 'react';
import { Target, Activity, CheckCircle2, TrendingUp, AlertCircle, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';

interface KpiSummaryRowProps {
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

export function KpiSummaryRow({ summary, isLoading }: KpiSummaryRowProps) {
  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  const unitAttachRate = summary && summary.activations > 0 ? summary.associated / summary.activations : 0;
  const coveragePct = 0.85; // Example mock metric for Coverage %
  const recAccuracy = 0.92; // Example mock metric for Recommendation Accuracy

  const kpis = [
    { 
      label: "Total VAPS", 
      value: summary ? fmtInt(summary.uniqueVapsCount || 0) : "---",
      icon: Target,
      color: "text-slate-700 bg-slate-100 ring-slate-200/50",
      description: "Unique VAPS in current filter"
    },
    { 
      label: "Attach Rate", 
      value: summary ? fmtPct(unitAttachRate) : "---",
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50 ring-indigo-100",
      description: "Aggregated performance"
    },
    { 
      label: "Opportunities", 
      value: summary ? fmtInt(summary.activations - summary.associated) : "---",
      icon: Activity,
      color: "text-emerald-600 bg-emerald-50 ring-emerald-100",
      description: "Missed activations"
    },
    { 
      label: "Coverage %", 
      value: summary ? fmtPct(coveragePct) : "---",
      icon: Percent,
      color: "text-blue-600 bg-blue-50 ring-blue-100",
      description: "Overall market coverage"
    },
    { 
      label: "Rec Accuracy", 
      value: summary ? fmtPct(recAccuracy) : "---",
      icon: CheckCircle2,
      color: "text-teal-600 bg-teal-50 ring-teal-100",
      description: "Algorithm precision"
    },
    { 
      label: "Cutoff Threshold", 
      value: summary ? fmtPct(summary.cutoff) : "---",
      icon: AlertCircle,
      color: "text-orange-600 bg-orange-50 ring-orange-100",
      description: "Geometric elbow point"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full rounded-xl bg-white/50 border border-slate-200/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("p-1.5 rounded-md ring-1", kpi.color)}>
              <kpi.icon size={14} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              {kpi.label}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight tabular-nums">
              {kpi.value}
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
              {kpi.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
