"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from "@/types";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapTableProps {
  title: string;
  data: VapsAttachRate[];
  segmentName: string;
  cutoff: number;
}

export default function HeatmapTable({ title, data, segmentName, cutoff }: HeatmapTableProps) {
  const [filter, setFilter] = useState("");
  const pivotKey = segmentName.toLowerCase();

  const pivoted = useMemo(() => {
    const columns = new Set<string>();
    const rows = new Map<string, { desc: string; cells: Map<string, VapsAttachRate> }>();

    data.forEach(r => {
      const segmentValue = (r as any)[pivotKey] || "Unmapped";
      columns.add(segmentValue);
      if (!rows.has(r.vaps)) {
        rows.set(r.vaps, { desc: r.vapsDesc, cells: new Map() });
      }
      rows.get(r.vaps)!.cells.set(segmentValue, r);
    });

    return { 
      columns: Array.from(columns).sort(), 
      rows: Array.from(rows.entries()).sort((a, b) => a[1].desc.localeCompare(b[1].desc)) 
    };
  }, [data, pivotKey]);

  const filteredRows = useMemo(() => {
    if (!filter) return pivoted.rows;
    const q = filter.toLowerCase();
    return pivoted.rows.filter(([vaps, row]) => 
      vaps.toLowerCase().includes(q) || row.desc.toLowerCase().includes(q)
    );
  }, [pivoted, filter]);

  const getHeatStyle = (signal: string | undefined) => {
    switch (signal) {
      case "Strong Industry Opportunity": return { bg: "bg-[#55b9a5]", text: "text-white" };
      case "Good General Fit": return { bg: "bg-[#a9d9cf]", text: "text-slate-900" };
      case "Niche Industry Signal": return { bg: "bg-[#d8edf7]", text: "text-slate-900" };
      case "Monitor": return { bg: "bg-[#f7e4b3]", text: "text-slate-900" };
      default: return { bg: "bg-white", text: "text-slate-300" };
    }
  };

  const fmtPct = (val?: number) => val !== undefined ? `${(val * 100).toFixed(1)}%` : "";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h2>
          <Info size={14} className="text-slate-400 cursor-help" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <input 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="FILTER VAPS ID"
              className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
            />
          </div>
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest">
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full border-collapse table-fixed min-w-[1200px]">
          <thead className="bg-slate-50 sticky top-0 z-20">
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-30 bg-slate-50 border-r border-slate-200 px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-[280px]">
                VAPS <span className="text-[9px] font-bold text-slate-300 ml-1">SORT</span>
              </th>
              {pivoted.columns.map(col => (
                <th key={col} className="px-2 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[140px] border-r border-slate-200 last:border-r-0 leading-tight">
                  {col} <span className="block text-[8px] font-bold text-slate-300 mt-0.5 tracking-tighter">SORT</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map(([vaps, row]) => (
              <tr key={vaps} className="hover:bg-slate-50 transition-colors group">
                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 px-4 py-3 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-800 leading-tight uppercase">{vaps}</span>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5 line-clamp-1">{row.desc}</span>
                  </div>
                </td>
                {pivoted.columns.map(col => {
                  const cell = row.cells.get(col);
                  const style = getHeatStyle(cell?.industrySignal);
                  return (
                    <td 
                      key={col} 
                      className={cn(
                        "p-0 border-r border-slate-200 last:border-r-0 transition-all duration-300",
                        style.bg
                      )}
                    >
                      {cell && (
                        <div className="w-full h-[64px] flex flex-col items-center justify-center gap-0.5 group/cell">
                          <span className={cn("text-[11px] font-black tabular-nums", style.text)}>
                            {fmtPct(cell.attachRate)}
                          </span>
                          <span className={cn("text-[9px] font-bold uppercase tracking-tighter", style.text)}>
                            {cell.industrySignal === "No Signal" ? "No Signal" : cell.industrySignal}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
