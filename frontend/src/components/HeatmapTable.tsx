"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from "@/types";
import { Info, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims";
import { typography } from "@/design-system/typography";
import { Skeleton } from "./ui/Skeleton";

interface HeatmapTableProps {
  title: string;
  data: VapsAttachRate[];
  segmentName: string;
  cutoff: number;
  isLoading?: boolean;
}

export default function HeatmapTable({ title, data, segmentName, cutoff, isLoading }: HeatmapTableProps) {
  const [filter, setFilter] = useState("");
  const [selectedVaps, setSelectedVaps] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  
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

  const getHeatStyle = (signal: string | undefined, isHighlighted: boolean) => {
    if (isHighlighted) {
       switch (signal) {
         case "Strong Industry Opportunity": return { bg: "bg-[#00205B] text-white scale-[1.05] z-30 shadow-2xl ring-2 ring-[#00205B] ring-offset-2", text: "text-white" };
         case "Good General Fit": return { bg: "bg-blue-700 text-white scale-[1.05] z-30 shadow-2xl ring-2 ring-blue-700 ring-offset-2", text: "text-white" };
         case "Niche Industry Signal": return { bg: "bg-blue-500 text-white scale-[1.05] z-30 shadow-2xl ring-2 ring-blue-500 ring-offset-2", text: "text-white" };
         case "Monitor": return { bg: "bg-amber-500 text-white scale-[1.05] z-30 shadow-2xl ring-2 ring-amber-500 ring-offset-2", text: "text-white" };
         default: return { bg: "bg-slate-300 text-slate-700 scale-[1.05] z-30 shadow-2xl ring-2 ring-slate-300 ring-offset-2", text: "text-slate-700" };
       }
    }

    switch (signal) {
      case "Strong Industry Opportunity": return { bg: "bg-[#00205B]", text: "text-white" };
      case "Good General Fit": return { bg: "bg-blue-700", text: "text-white" };
      case "Niche Industry Signal": return { bg: "bg-blue-500", text: "text-white" };
      case "Monitor": return { bg: "bg-amber-500", text: "text-white" };
      default: return { bg: "bg-slate-50", text: "text-slate-400" };
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

      <Table className="table-auto min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-50 min-w-[260px] border-r bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              VAPS ID & Description
            </TableHead>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableHead key={i} className="text-center min-w-[130px] border-r last:border-r-0">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableHead>
              ))
            ) : (
              pivoted.columns.map(col => (
                <TableHead 
                  key={col} 
                  isHighlighted={selectedSegment === col}
                  className="text-center min-w-[130px] border-r last:border-r-0 text-[11px] px-2"
                >
                  {col}
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="sticky left-0 z-20 bg-white border-r">
                   <div className="flex flex-col gap-2">
                     <Skeleton className="h-4 w-24" />
                     <Skeleton className="h-3 w-48" />
                   </div>
                </TableCell>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j} className="p-4 border-r">
                    <Skeleton className="h-10 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            filteredRows.map(([vaps, row]) => (
              <TableRow key={vaps} isHighlighted={selectedVaps === vaps}>
                <TableCell 
                  onClick={() => setSelectedVaps(vaps === selectedVaps ? null : vaps)}
                  className={cn(
                    "sticky left-0 z-20 border-r border-slate-200 transition-all cursor-pointer shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] h-auto py-5",
                    selectedVaps === vaps 
                      ? "bg-[#f1f5f9] z-30" 
                      : "bg-white group-hover:bg-[#f8fafc]"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className={cn(typography.mono, "text-slate-800 leading-none uppercase tabular-nums font-bold")}>{vaps}</span>
                    <span className="text-[11px] font-medium text-slate-500 leading-normal">{row.desc}</span>
                  </div>
                </TableCell>
                {pivoted.columns.map(col => {
                  const cell = row.cells.get(col);
                  const isCellHighlighted = selectedVaps === vaps && selectedSegment === col;
                  const isColHighlighted = selectedSegment === col;
                  const style = getHeatStyle(cell?.industrySignal, isCellHighlighted);
                  
                  return (
                    <TableCell 
                      key={col} 
                      onClick={() => {
                        setSelectedVaps(vaps === selectedVaps && selectedSegment === col ? null : vaps);
                        setSelectedSegment(vaps === selectedVaps && selectedSegment === col ? null : col);
                      }}
                      isHighlighted={isColHighlighted && !isCellHighlighted}
                      className={cn(
                        "p-0 border-r border-slate-100 last:border-r-0 transition-all duration-200 cursor-pointer relative overflow-visible",
                        style.bg
                      )}
                    >
                      <div className="w-full min-h-[50px] flex flex-col items-center justify-center gap-0.5 group/cell p-2 relative z-20">
                        <span className={cn("text-xs font-bold tabular-nums", style.text)}>
                          {cell ? fmtPct(cell.attachRate) : "0.0%"}
                        </span>
                        <span className={cn("text-[8px] font-bold uppercase tracking-wider text-center leading-tight px-0.5", style.text)}>
                          {cell?.industrySignal || "No Signal"}
                        </span>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </tbody>
      </Table>
    </Card>
  );
}
