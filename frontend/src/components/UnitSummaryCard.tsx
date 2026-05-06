import React from 'react';
import { Target, Activity, CheckCircle2, TrendingUp } from 'lucide-react';

interface UnitSummaryProps {
  summary: {
    totalActivations: number;
    totalAssociated: number;
    unitAttachRate: number;
    cutoff: number;
  };
}

export default function UnitSummaryCard({ summary }: UnitSummaryProps) {
  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  const kpis = [
    { 
      label: "Total Activations", 
      value: fmtInt(summary.totalActivations),
      icon: Activity,
      color: "bg-blue-50 text-blue-600",
      description: "Total unit activations observed in data"
    },
    { 
      label: "Total Associated", 
      value: fmtInt(summary.totalAssociated),
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      description: "Total number of VAPS sold with this unit"
    },
    { 
      label: "Unit Attach Rate", 
      value: fmtPct(summary.unitAttachRate),
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      description: "Aggregated baseline attachment performance"
    },
    { 
      label: "Unit Cutoff", 
      value: fmtPct(summary.cutoff),
      icon: Target,
      color: "bg-orange-50 text-orange-600",
      description: "Geometric elbow point for recommendations"
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-base font-bold text-slate-900">Unit Summary Analysis</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="group relative">
            <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-1.5 rounded-md ${kpi.color}`}>
                  <kpi.icon size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {kpi.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900 tabular-nums">{kpi.value}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 leading-normal font-medium">
                {kpi.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detail Table */}
      <div className="mt-8 overflow-hidden rounded-lg border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metric</th>
              <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr>
              <td className="px-4 py-3 text-xs font-medium text-slate-600">Total Unique VAPS Observed</td>
              <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right tabular-nums">Reference Parity Data</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-xs font-medium text-slate-600">Decision Multiplier Applied</td>
              <td className="px-4 py-3 text-xs font-bold text-blue-600 text-right tabular-nums">1.00x</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
