"use client"

import { useMemo, useState } from "react"
import { VapsAttachRate } from "@/types"
import { cn } from "@/lib/utils"

interface HeatmapTableProps {
  title: string;
  data: VapsAttachRate[];
  pivotKey: "market" | "division" | "region";
  cutoff: number;
}

export default function HeatmapTable({ title, data, pivotKey, cutoff }: HeatmapTableProps) {
  const [filter, setFilter] = useState("")

  // Pivot the data: { [vapsId]: { [pivotVal]: VapsAttachRate } }
  const pivoted = useMemo(() => {
    const matrix: Record<string, { vapsDesc: string, mainGroup: string, cells: Record<string, VapsAttachRate> }> = {};
    const columns = new Set<string>();

    data.forEach(row => {
      const colVal = row[pivotKey] || "Unmapped";
      columns.add(colVal);

      if (!matrix[row.vaps]) {
        matrix[row.vaps] = { 
          vapsDesc: row.vapsDesc, 
          mainGroup: row.mainGroup,
          cells: {} 
        };
      }
      matrix[row.vaps].cells[colVal] = row;
    });

    return {
      rows: Object.entries(matrix).sort((a, b) => a[1].vapsDesc.localeCompare(b[1].vapsDesc)),
      columns: Array.from(columns).sort()
    };
  }, [data, pivotKey]);

  const filteredRows = useMemo(() => {
    if (!filter) return pivoted.rows;
    const lower = filter.toLowerCase();
    return pivoted.rows.filter(([id, val]) => 
      id.toLowerCase().includes(lower) || val.vapsDesc.toLowerCase().includes(lower)
    );
  }, [pivoted.rows, filter]);

  const getHeatColor = (signal: string | undefined) => {
    if (!signal || signal === "No Signal") return "bg-slate-50 text-slate-300";
    if (signal === "Strong Industry Opportunity") return "bg-[#55b9a5] text-white";
    if (signal === "Good General Fit") return "bg-[#a9d9cf] text-slate-900";
    if (signal === "Niche Industry Signal") return "bg-[#d8edf7] text-slate-900";
    if (signal === "Monitor") return "bg-[#f7e4b3] text-slate-900";
    return "bg-slate-50 text-slate-400";
  };

  const getTooltip = (row: VapsAttachRate) => {
    return [
      `Industry signal: ${row.industrySignal}`,
      `Reason: ${row.industrySignalReason}`,
      `Industry attach rate: ${(row.attachRate * 100).toFixed(1)}%`,
      `Unit attach rate: ${((row.unitAttachRate || 0) * 100).toFixed(1)}%`,
      `Unit cutoff: ${(cutoff * 100).toFixed(1)}%`,
      `Leverage: ${row.leverage ? row.leverage.toFixed(2) + 'x' : 'n/a'}`,
      `Opportunity score: ${row.opportunityScore?.toFixed(1) || '0.0'}`,
      `Volume: ${row.associated.toLocaleString()} associated / ${row.activations.toLocaleString()} activations`
    ].join("\n");
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pivot Analysis</p>
        </div>
        <div className="w-full md:w-80">
          <input 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder={`Search VAPS or ${pivotKey}...`}
            className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full border-collapse table-fixed min-w-[1000px]">
            <thead className="bg-slate-50/80 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-200 px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest w-[280px]">
                  VAPS / {pivotKey}
                </th>
                {pivoted.columns.map(col => (
                  <th key={col} className="border-b border-slate-200 px-2 py-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[120px]">
                    <div className="rotate-180 [writing-mode:vertical-lr] mx-auto h-36 flex items-center justify-center text-center">
                      {col}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(([id, rowData]) => (
                <tr key={id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 border-r border-slate-100 px-6 py-3 text-sm w-[280px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 leading-tight" title={rowData.vapsDesc}>{rowData.vapsDesc}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">{id}</span>
                    </div>
                  </td>
                  {pivoted.columns.map(col => {
                    const row = rowData.cells[col];
                    if (!row) {
                      return <td key={col} className="bg-slate-50/30 border-r border-slate-100 h-16" />;
                    }
                    return (
                      <td 
                        key={col} 
                        title={getTooltip(row)}
                        className={cn(
                          "border-r border-slate-100 text-center p-2 h-16 transition-all duration-300 hover:scale-[1.02] hover:z-10 cursor-help",
                          getHeatColor(row.industrySignal)
                        )}
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-0.5">
                          <span className="text-xs font-black tabular-nums">{(row.attachRate * 100).toFixed(1)}%</span>
                          <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80 line-clamp-1">
                            {row.industrySignal?.replace(" Industry Opportunity", "")}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
