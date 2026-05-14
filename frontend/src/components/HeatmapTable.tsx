"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from "@/types";
import { Info, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./ui/Card";
import { Input, Select } from "./ui/Input";
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
  const [divisionFilter, setDivisionFilter] = useState("");
  const [selectedVaps, setSelectedVaps] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  
  const pivotKey = segmentName.toLowerCase();
  const isRegionView = pivotKey === "region";

  const divisions = useMemo(() => {
    if (!isRegionView) return [];
    return Array.from(new Set(data.map(r => r.division).filter(Boolean))).sort();
  }, [data, isRegionView]);

  const pivoted = useMemo(() => {
    const segmentStats = new Map<string, number>();
    const filteredData = isRegionView && divisionFilter 
      ? data.filter(r => r.division === divisionFilter)
      : data;

    filteredData.forEach(r => {
      const segmentValue = (r as any)[pivotKey] || "Unmapped";
      segmentStats.set(segmentValue, (segmentStats.get(segmentValue) || 0) + r.activations);
    });

    const topSegments = Array.from(segmentStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([seg]) => seg);

    const columns = new Set(topSegments);
    const rows = new Map<string, { desc: string; cells: Map<string, VapsAttachRate> }>();

    filteredData.forEach(r => {
      const segmentValue = (r as any)[pivotKey] || "Unmapped";
      if (!columns.has(segmentValue)) return;
      
      if (!rows.has(r.vaps)) {
        rows.set(r.vaps, { desc: r.vapsDesc, cells: new Map() });
      }
      rows.get(r.vaps)!.cells.set(segmentValue, r);
    });

    return { 
      columns: Array.from(columns).sort(), 
      rows: Array.from(rows.entries()).sort((a, b) => {
        const aAvg = Array.from(a[1].cells.values()).reduce((sum, c) => sum + (c.attachRate || 0), 0) / (a[1].cells.size || 1);
        const bAvg = Array.from(b[1].cells.values()).reduce((sum, c) => sum + (c.attachRate || 0), 0) / (b[1].cells.size || 1);
        return bAvg - aAvg || a[1].desc.localeCompare(b[1].desc);
      })
    };
  }, [data, pivotKey, isRegionView, divisionFilter]);

  const filteredRows = useMemo(() => {
    if (!filter) return pivoted.rows;
    const q = filter.toLowerCase();
    return pivoted.rows.filter(([vaps, row]) => 
      vaps.toLowerCase().includes(q) || row.desc.toLowerCase().includes(q)
    );
  }, [pivoted, filter]);

  const fmtPct = (val?: number | null) => (val === null || val === undefined) ? "0.0%" : `${(val * 100).toFixed(1)}%`;
  const fmtLeverage = (val?: number | null) => (val === null || val === undefined) ? "---" : `${val.toFixed(2)}x`;
  const fmtScore = (val?: number | null) => (val === null || val === undefined) ? "0.0" : val.toFixed(1);
  const fmtNum = (val?: number | null) => (val === null || val === undefined) ? "0" : val.toLocaleString();

  const exportData = () => {
    const filename = `${pivotKey}_segment_heatmap.csv`;
    const exportColumns = [
      { label: "VAPS", key: "vaps" },
      { label: "Description", key: "desc" },
      ...pivoted.columns.map(col => ({
        label: col,
        key: col,
        fmt: (v: VapsAttachRate) => v ? fmtPct(v.attachRate) : "0.0%"
      }))
    ];
    
    const rows = pivoted.rows.map(([vaps, data]) => {
      const row: any = { vaps, desc: data.desc };
      pivoted.columns.forEach(col => {
        row[col] = data.cells.get(col);
      });
      return row;
    });

    import('@/lib/export').then(({ exportToCsv }) => {
      exportToCsv(filename, exportColumns, rows);
    });
  };

  const getHeatColor = (rate: number, maxRate: number) => {
    if (!rate) return "#f6f8fa";
    const intensity = Math.min(1, rate / Math.max(maxRate, 0.01));
    const light = 96 - intensity * 44;
    return `hsl(170, 45%, ${light}%)`;
  };

  const maxRate = useMemo(() => {
    let max = 0;
    data.forEach(r => { if (r.attachRate > max) max = r.attachRate; });
    return max;
  }, [data]);

  const cellTooltip = (vaps: string, segment: string, row: any, cell?: VapsAttachRate) => {
    if (!cell) return `${segment} | ${vaps}\nNo observed attachment in this segment.`;
    
    return [
      `${segment} | ${vaps}`,
      `${segment} attach rate: ${fmtPct(cell.attachRate)}`,
      `Unit cutoff benchmark: ${fmtPct(cutoff)}`,
      `Unit attach rate baseline: ${fmtPct(cell.unitAttachRate)}`,
      `Leverage = segment attach rate / unit attach rate = ${fmtLeverage(cell.leverage)}`,
      `Opportunity score = max(0, segment attach rate - unit cutoff) x segment activations = ${fmtScore(cell.opportunityScore)}`,
      `Volume: ${fmtNum(cell.associated)} associated / ${fmtNum(cell.activations)} activations`,
      `Industry signal: ${cell.industrySignal}`,
      `Reason: ${cell.industrySignalReason}`
    ].join('\n');
  };

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className={typography.cardTitle}>{title}</h2>
          <span 
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-300 text-[9px] font-bold text-slate-400 cursor-help hover:border-primary hover:text-primary transition-colors"
            title={`Segment heatmap logic\n\nColoring: intensity matches attach rate relative to the maximum observed (${fmtPct(maxRate)}).\nSignals: industry signal logic is applied at the segment level.\n\nClick a cell to highlight related data across the workspace.`}
          >
            i
          </span>
        </div>
        <div className="flex flex-nowrap items-center gap-3 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            {filteredRows.length} VAPS
          </span>
          
          {isRegionView && (
            <div className="w-40">
              <Select 
                value={divisionFilter} 
                onChange={e => setDivisionFilter(e.target.value)} 
                variantSize="sm"
              >
                <option value="">All Divisions</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
          )}

          <div className="w-44">
            <Input 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="SEARCH VAPS ID"
              icon={<Search size={14} />}
              variantSize="sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2 whitespace-nowrap">
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
                  
                  const bgColor = getHeatColor(cell?.attachRate || 0, maxRate);
                  const isDark = (cell?.attachRate || 0) / maxRate > 0.6;
                  
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
                        isCellHighlighted && "scale-[1.05] z-30 shadow-2xl ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: bgColor }}
                      title={cellTooltip(vaps, col, row, cell)}
                    >
                      <div className="w-full min-h-[50px] flex flex-col items-center justify-center gap-0.5 group/cell p-2 relative z-20">
                        <span className={cn("text-xs font-bold tabular-nums", isDark ? "text-white" : "text-slate-900")}>
                          {cell ? fmtPct(cell.attachRate) : "0.0%"}
                        </span>
                        <span className={cn("text-[8px] font-bold uppercase tracking-wider text-center leading-tight px-0.5", isDark ? "text-teal-50" : "text-slate-500")}>
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
