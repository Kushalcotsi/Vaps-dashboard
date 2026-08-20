"use client"

import React, { useMemo, useState } from 'react';
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { UnitMarketSegmentRate } from "@/types";
import { Info, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./ui/Card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims";
import { typography } from "@/design-system/typography";
import { Skeleton } from "./ui/Skeleton";

interface UnitMarketHeatmapTableProps {
  title: string;
  data: UnitMarketSegmentRate[];
  isLoading?: boolean;
}

export default function UnitMarketHeatmapTable({ title, data, isLoading }: UnitMarketHeatmapTableProps) {
  const [filter, setFilter] = useLocalStorageState<string>("vaps-dashboard:um-heatmap:search", "");
  const [selectedCol, setSelectedCol] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  
  const getUnitLabel = (r: UnitMarketSegmentRate) => {
    return r.unit || "Unknown";
  };

  const getHeatClass = (label?: string, confidence?: string) => {
    if (label === "Core Recommendation") return "bg-[#b8e0d7] hover:bg-[#a6d4ca]";
    if (label === "Emerging Opportunity" || label === "White Space Opportunity") return "bg-[#d8e8ff] hover:bg-[#c4daff]";
    if (label === "High Dependency Risk") return "bg-[#eadcff] hover:bg-[#d8c4ff]";
    if (label === "Declining Product") return "bg-[#f8d7d4] hover:bg-[#f3c2be]";
    if (confidence === "Low") return "bg-[#f7f3eb] hover:bg-[#ebe5d8]";
    return "bg-[#eef4f8] hover:bg-[#e0ecf4]";
  };

  const pivoted = useMemo(() => {
    // Columns are Units (concise code like MO6012, 20W, etc.)
    // Rows are Markets
    
    const unitSet = new Set<string>();
    const unitNames = new Map<string, string>();
    const unitMaxScore = new Map<string, number>();
    const marketMaxScore = new Map<string, number>();

    data.forEach(r => {
      const u = getUnitLabel(r);
      unitSet.add(u);
      if (r.productName && !unitNames.has(u)) {
        unitNames.set(u, r.productName);
      }
      const score = r.recommendationScore || 0;
      unitMaxScore.set(u, Math.max(unitMaxScore.get(u) || 0, score));

      const m = r.market || "Global";
      marketMaxScore.set(m, Math.max(marketMaxScore.get(m) || 0, score));
    });
    
    const rows = new Map<string, { cells: Map<string, UnitMarketSegmentRate> }>();
    
    data.forEach(r => {
      const marketValue = r.market || "Global";
      const unitValue = getUnitLabel(r);
      
      if (!rows.has(marketValue)) {
        rows.set(marketValue, { cells: new Map() });
      }
      rows.get(marketValue)!.cells.set(unitValue, r);
    });

    const sortedColumns = Array.from(unitSet).sort((a, b) => {
      const scoreDiff = (unitMaxScore.get(b) || 0) - (unitMaxScore.get(a) || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.localeCompare(b);
    });

    const sortedRows = Array.from(rows.entries()).sort((a, b) => {
      const scoreDiff = (marketMaxScore.get(b[0]) || 0) - (marketMaxScore.get(a[0]) || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a[0].localeCompare(b[0]);
    });

    return { 
      columns: sortedColumns,
      unitNames,
      rows: sortedRows
    };
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!filter) return pivoted.rows;
    const q = filter.toLowerCase();
    return pivoted.rows.filter(([market]) => 
      market.toLowerCase().includes(q)
    );
  }, [pivoted, filter]);

  const fmtPct = (val?: number | null) => (val === null || val === undefined) ? "0.0%" : `${(val * 100).toFixed(1)}%`;
  const fmtScore = (val?: number | null) => (val === null || val === undefined) ? "0.0" : val.toFixed(2);
  const fmtNum = (val?: number | null) => (val === null || val === undefined) ? "0" : val.toLocaleString();

  const exportData = () => {
    const filename = `unit_market_heatmap.csv`;
    const exportColumns = [
      { label: "Market", key: "market" },
      ...pivoted.columns.map(col => ({
        label: col,
        key: col,
        fmt: (v: UnitMarketSegmentRate) => v ? fmtPct(v.recommendationScore) : "0.0%"
      }))
    ];
    
    const rows = pivoted.rows.map(([market, rowData]) => {
      const row: any = { market };
      pivoted.columns.forEach(col => {
        row[col] = rowData.cells.get(col);
      });
      return row;
    });

    import('@/lib/export').then(({ exportToCsv }) => {
      exportToCsv(filename, exportColumns, rows);
    });
  };

  const cellTooltip = (market: string, unit: string, cell?: UnitMarketSegmentRate) => {
    if (!cell) return `${market} | ${unit}\nNo primary recommendation.`;
    
    return [
      `Market Segment: ${market}`,
      `Unit: ${unit}`,
      `Confidence: ${cell.confidenceLevel || ""}`,
      `Latest Activations: ${fmtNum(cell.latestActivations)}`,
      `Historical Activations: ${fmtNum(cell.historicalActivations)}`,
      `Periods Observed: ${fmtNum(cell.periodsObserved)}`,
      `Latest Product Share: ${fmtPct(cell.productShareInMarket)}`,
      `Blended Product Share: ${fmtPct(cell.blendedProductShareInMarket)}`,
      `Latest Market Contribution: ${fmtPct(cell.marketContributionToProduct)}`,
      `Blended Market Contribution: ${fmtPct(cell.blendedMarketContributionToProduct)}`,
      `Momentum: ${fmtScore(cell.momentumScore)}`,
      `Trend: ${fmtScore(cell.trendScore)}`,
      `Support Score: ${fmtScore(cell.supportScore)}`,
      `Recommendation Score: ${fmtScore(cell.recommendationScore)}`,
      `Label: ${cell.recommendationLabel || ""}`
    ].join('\n');
  };

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 py-2 md:py-2.5 px-4 md:px-6">
        {title && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className={typography.cardTitle}>{title}</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 hover:text-primary transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs whitespace-pre-wrap text-xs">
                  {`Segment heatmap logic\n\nColoring: matches Recommendation Label (Core=Teal, Emerging=Blue, Risk=Purple, Decline=Red, Low=Gray).\nCells show Recommendation Score.\n\nClick a cell to highlight related data across the workspace.`}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
        <div className="flex flex-nowrap items-center gap-3 shrink-0 ml-auto">
          <div className="w-48">
            <Input 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="SEARCH MARKET"
              icon={<Search size={14} />}
              variantSize="sm"
            />
          </div>

          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mx-1">
            {filteredRows.length} Markets
          </span>
          
          {/* <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2 whitespace-nowrap">
            <Download size={12} />
            CSV
          </Button> */}
        </div>
      </CardHeader>

      <Table className="table-auto min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-50 min-w-[200px] border-r bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Market Segment
            </TableHead>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableHead key={i} className="text-center min-w-[140px] border-r last:border-r-0">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableHead>
              ))
            ) : (
              pivoted.columns.map(col => (
                <TableHead 
                  key={col} 
                  isHighlighted={selectedCol === col}
                  className="text-center min-w-[90px] border-r last:border-r-0 px-1 font-bold"
                  title={pivoted.unitNames.get(col) || col}
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
                <TableCell className="sticky left-0 z-30 bg-white border-r">
                   <div className="flex flex-col gap-2">
                     <Skeleton className="h-4 w-32" />
                   </div>
                </TableCell>
                {Array.from({ length: 5 }).map((_, j) => (
                   <TableCell key={j} className="p-1 border-r">
                    <Skeleton className="h-10 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : filteredRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={pivoted.columns.length + 1} className="h-32 text-center text-slate-400 italic bg-white/50">
                Data unavailable for the selected unit/market
              </TableCell>
            </TableRow>
          ) : (
            filteredRows.map(([market, row]) => (
              <TableRow key={market} isHighlighted={selectedRow === market}>
                <TableCell 
                  onClick={() => setSelectedRow(market === selectedRow ? null : market)}
                  className={cn(
                    "sticky left-0 z-30 border-r border-slate-200 transition-all cursor-pointer shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] h-auto py-2",
                    selectedRow === market 
                      ? "bg-[#f1f5f9] z-40" 
                      : "bg-white group-hover:bg-[#f8fafc]"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className={cn(typography.mono, "text-slate-800 leading-none font-bold")}>{market}</span>
                  </div>
                </TableCell>
                {pivoted.columns.map(col => {
                  const cell = row.cells.get(col);
                  const isCellHighlighted = selectedRow === market && selectedCol === col;
                  const isColHighlighted = selectedCol === col;
                  
                  const bgClass = cell ? getHeatClass(cell.recommendationLabel, cell.confidenceLevel) : "bg-[#f8fafb] text-slate-400 hover:bg-[#f1f5f9]";
                  
                  return (
                    <TableCell 
                      key={col} 
                      onClick={() => {
                        setSelectedRow(market === selectedRow && selectedCol === col ? null : market);
                        setSelectedCol(market === selectedRow && selectedCol === col ? null : col);
                      }}
                      isHighlighted={isColHighlighted && !isCellHighlighted}
                      className={cn(
                        "p-0 border-r border-slate-100 last:border-r-0 transition-all duration-200 cursor-pointer relative overflow-visible",
                        bgClass,
                        isCellHighlighted && "scale-[1.05] z-30 shadow-2xl ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full min-h-[32px] flex flex-col items-center justify-center gap-0.5 group/cell p-1 relative z-20">
                            {cell ? (
                              <>
                                <span className="text-xs font-bold tabular-nums text-slate-900">
                                  {fmtPct(cell.recommendationScore)}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight px-0.5 text-slate-600 line-clamp-1" title={cell.confidenceLevel + ' | ' + cell.recommendationLabel}>
                                  {cell.recommendationLabel}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 m-auto text-center leading-tight">No Rec</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs whitespace-pre-wrap text-xs">
                          {cellTooltip(market, col, cell)}
                        </TooltipContent>
                      </Tooltip>
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
