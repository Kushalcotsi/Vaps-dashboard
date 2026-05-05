"use client"

import { VapsAttachRate } from "@/types"
import { cn } from "@/lib/utils"

interface DistributionBarsProps {
  title: string;
  data: VapsAttachRate[];
  cutoff: number;
  subtitle?: string;
}

export default function DistributionBars({ title, data, cutoff, subtitle }: DistributionBarsProps) {
  const getTooltip = (row: VapsAttachRate) => {
    return [
      `Decision: ${row.decision}`,
      `Reason: ${row.decisionReason}`,
      `Recommendation logic: ${row.recommendationKind || "Not covered"}`,
      `Covered in sheet: ${row.coveredText}`,
      `Attach rate: ${(row.attachRate * 100).toFixed(1)}%`,
      `Unit cutoff: ${(cutoff * 100).toFixed(1)}%`,
      `Volume: ${row.associated.toLocaleString()} associated / ${row.activations.toLocaleString()} activations`
    ].join("\n");
  };

  return (
    <section className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-3xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-baseline border-b border-slate-100 pb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>}
        </div>
        <div className="bg-teal-50 text-teal-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
          Cutoff: {(cutoff * 100).toFixed(1)}%
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        {data.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-slate-400 text-sm font-medium italic">No missed opportunities match the current filters.</p>
          </div>
        ) : (
          data.map((row, i) => (
            <div key={i} className="flex flex-col gap-2 group cursor-help" title={getTooltip(row)}>
              <div className="flex justify-between items-end gap-4">
                <div className="flex flex-col min-w-0">
                  <strong className="text-[13px] font-bold text-slate-700 truncate leading-tight group-hover:text-teal-600 transition-colors">
                    {row.vapsDesc}
                  </strong>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-slate-300">{row.vaps}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-slate-400">{row.mainGroup}</span>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {(row.attachRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {row.decision}
                    </span>
                </div>
              </div>
              
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                <div 
                  className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      row.attachRate >= cutoff ? "bg-gradient-to-r from-teal-400 to-emerald-500" : "bg-gradient-to-r from-slate-300 to-slate-400"
                  )}
                  style={{ width: `${Math.min(row.attachRate * 100, 100)}%` }}
                />
                {/* Cutoff Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{ left: `${cutoff * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
