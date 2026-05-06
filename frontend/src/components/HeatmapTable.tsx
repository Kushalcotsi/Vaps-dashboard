"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from "@/types";
import { Info, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableRow, TableHead } from "./ui/TablePrims";
import { typography } from "@/design-system/typography";

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
      case "Strong Industry Opportunity": return { bg: "bg-primary text-white" };
      case "Good General Fit": return { bg: "bg-blue-100 text-slate-900" };
      case "Niche Industry Signal": return { bg: "bg-blue-50 text-slate-700" };
      case "Monitor": return { bg: "bg-amber-100 text-slate-900" };
      default: return { bg: "bg-white", text: "text-slate-300" };
    }
  };

  const fmtPct = (val?: number) => val !== undefined ? `${(val * 100).toFixed(1)}%` : "";

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className={typography.cardTitle}>{title}</h2>
          <Info size={14} className="text-slate-400 cursor-help" />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="FILTER VAPS ID"
            icon={<Search size={14} />}
            className="md:w-48"
          />
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download size={12} />
            CSV
          </Button>
        </div>
      </CardHeader>

      <Table className="table-fixed min-w-[1200px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-30 w-[280px] border-r">
              VAPS ID & Description
            </TableHead>
            {pivoted.columns.map(col => (
              <TableHead key={col} className="text-center min-w-[140px] border-r last:border-r-0">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-slate-100">
          {filteredRows.map(([vaps, row]) => (
            <TableRow key={vaps}>
              <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 border-r border-slate-200 px-4 py-3 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                  <span className={cn(typography.mono, "text-slate-800 leading-tight uppercase tabular-nums")}>{vaps}</span>
                  <span className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-1">{row.desc}</span>
                </div>
              </td>
              {pivoted.columns.map(col => {
                const cell = row.cells.get(col);
                const style = getHeatStyle(cell?.industrySignal);
                return (
                  <td 
                    key={col} 
                    className={cn(
                      "p-0 border-r border-slate-100 last:border-r-0 transition-all duration-200",
                      style.bg
                    )}
                  >
                    {cell && (
                      <div className="w-full h-[54px] flex flex-col items-center justify-center gap-0.5 group/cell">
                        <span className={cn("text-[11px] font-bold tabular-nums", style.text)}>
                          {fmtPct(cell.attachRate)}
                        </span>
                        <span className={cn("text-[8px] font-bold uppercase tracking-wider text-center px-2", style.text)}>
                          {cell.industrySignal === "No Signal" ? "" : cell.industrySignal}
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
