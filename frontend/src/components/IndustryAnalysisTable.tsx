"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from '@/types';
import { Search, Download } from 'lucide-react';
import { Card, CardHeader } from "./ui/Card";
import { Input, Select } from "./ui/Input";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims";
import { typography } from "@/design-system/typography";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import { Skeleton } from './ui/Skeleton';

interface IndustryAnalysisProps {
  marketRows: VapsAttachRate[];
  isLoading?: boolean;
}

export default function IndustryAnalysisTable({ marketRows, isLoading }: IndustryAnalysisProps) {
  const [selectedMarket, setSelectedMarket] = useState<string>(''); // Default to empty (All)
  const [search, setSearch] = useState('');
  const [selectedVaps, setSelectedVaps] = useState<string | null>(null);
  const [selectedColIdx, setSelectedColIdx] = useState<number | null>(null);

  const markets = useMemo(() => {
    return Array.from(new Set(marketRows.map(r => r.market).filter(Boolean))).sort();
  }, [marketRows]);

  const filteredRows = useMemo(() => {
    return marketRows.filter(r => 
      (selectedMarket === '' || r.market === selectedMarket) &&
      (search === '' || 
       r.vaps.toLowerCase().includes(search.toLowerCase()) || 
       r.vapsDesc.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
  }, [marketRows, selectedMarket, search]);

  const fmtPct = (val?: number | null) => (val === null || val === undefined) ? "0.0%" : `${(val * 100).toFixed(1)}%`;
  const fmtNum = (val?: number | null) => (val === null || val === undefined) ? "0" : val.toLocaleString();
  const fmtLeverage = (val?: number | null) => (val === null || val === undefined) ? "---" : `${val.toFixed(2)}x`;
  const fmtScore = (val?: number | null) => (val === null || val === undefined) ? "0.0" : val.toFixed(1);

  const exportData = () => {
    const filename = `recommendation_sheet_comparison_by_industry_${selectedMarket || 'all'}.csv`;
    const exportColumns = [
      { label: "Market Segment", key: "market" },
      { label: "VAPS", key: "vaps" },
      { label: "VAPS Description", key: "vapsDesc" },
      { label: "Recommendation Logic", key: "recommendationKind" },
      { label: "Recommendation Value", key: "recommendationValue" },
      { label: "Covered", key: "coveredText" },
      { label: "Activations", key: "activations" },
      { label: "Associated", key: "associated" },
      { label: "Industry Attach Rate", key: "attachRate", fmt: (v: number) => fmtPct(v) },
      { label: "Unit Attach Rate", key: "unitAttachRate", fmt: (v: number) => fmtPct(v) },
      { label: "Leverage", key: "leverage", fmt: (v: number) => fmtLeverage(v) },
      { label: "Opportunity Score", key: "opportunityScore", fmt: (v: number) => fmtScore(v) },
      { label: "Industry Signal", key: "industrySignal" },
      { label: "Interpretation", key: "industrySignalReason" }
    ];
    import('@/lib/export').then(({ exportToCsv }) => {
      exportToCsv(filename, exportColumns, filteredRows);
    });
  };

  const industrySignalTooltip = (row: VapsAttachRate) => {
    return [
      `Industry signal: ${row.industrySignal}`,
      `Reason: ${row.industrySignalReason}`,
      `Industry attach rate: ${fmtPct(row.attachRate)}`,
      `Unit attach rate: ${fmtPct(row.unitAttachRate)}`,
      `Unit cutoff: ${fmtPct(row.unitCutoff)}`,
      `Leverage: ${fmtLeverage(row.leverage)}`,
      `Opportunity score: ${fmtScore(row.opportunityScore)}`,
      `Volume: ${fmtNum(row.associated)} associated / ${fmtNum(row.activations)} activations`
    ].join('\n');
  };

  const columns = [
    { label: "Market segment", minW: "120px" },
    { label: "VAPS", minW: "80px" },
    { label: "VAPS description", minW: "200px" },
    { label: "Recommendation logic", minW: "130px" },
    { label: "Recommendation value", minW: "100px" },
    { label: "Covered", minW: "70px" },
    { label: "Activations", isNum: true, minW: "90px" },
    { label: "Associated", isNum: true, minW: "90px" },
    { label: "Industry attach rate", isNum: true, minW: "110px" },
    { label: "Unit attach rate", isNum: true, minW: "110px" },
    { label: "Leverage", isNum: true, minW: "80px" },
    { label: "Opportunity score", isNum: true, minW: "100px" },
    { 
      label: "Industry signal", 
      minW: "140px",
      info: "Industry signal logic\n\nBenchmark: selected unit elbow cutoff.\nLeverage: industry attach rate / unit attach rate.\nOpportunity score: max(0, industry attach rate - unit cutoff) x industry activations.\n\nStrong Industry Opportunity: above benchmark and over-indexes versus the unit average.\nGood General Fit: above benchmark and broadly consistent with the unit average.\nNiche Industry Signal: strong over-indexing, but smaller opportunity volume.\nMonitor: observed attachment, but below benchmark.\nNo Signal: no observed attachment in that industry."
    },
    { label: "Interpretation", minW: "240px" }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className={typography.cardTitle}>Recommendation Sheet Comparison by Industry</h2>
        <div className="flex flex-nowrap items-center gap-3 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            {filteredRows.length} Rows
          </span>
          <Select 
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            variantSize="sm"
            className="w-auto min-w-[160px]"
          >
            <option value="">All market segments</option>
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <div className="w-44">
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead 
                key={col.label} 
                isHighlighted={selectedColIdx === idx}
                isNum={col.isNum}
                style={{ minWidth: col.minW }}
                className="whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {col.info && (
                    <span 
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-300 text-[9px] font-bold text-slate-400 cursor-help hover:border-primary hover:text-primary transition-colors"
                      title={col.info}
                    >
                      i
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
             Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : filteredRows.map((row, idx) => (
            <TableRow key={row.vaps + idx} isHighlighted={selectedVaps === row.vaps}>
              <TableCell isHighlighted={selectedColIdx === 0} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(0); }} className="text-slate-500">{row.market}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 1} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(1); }} isBold className={typography.mono}>{row.vaps}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 2} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(2); }} className="text-slate-700 font-semibold leading-normal">{row.vapsDesc}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 3} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(3); }} className={typography.label}>{row.recommendationKind || "Fixed quantity"}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 4} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(4); }} className="text-xs font-medium text-slate-500 italic">{row.recommendationValue || "0"}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 5} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(5); }}>{row.coveredText || "No"}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 6} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(6); }} isNum>{fmtNum(row.activations)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 7} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(7); }} isNum>{fmtNum(row.associated)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 8} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(8); }} isNum isBold className="text-blue-600">{fmtPct(row.attachRate)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 9} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(9); }} isNum isBold>{fmtPct(row.unitAttachRate)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 10} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(10); }} isNum isBold className="text-emerald-600">{fmtLeverage(row.leverage)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 11} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(11); }} isNum isBold>{fmtScore(row.opportunityScore)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 12} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(12); }}>
                <Badge 
                  variant={row.industrySignal?.includes('Strong') ? 'success' : row.industrySignal?.includes('Good') ? 'info' : row.industrySignal?.includes('Niche') ? 'info' : row.industrySignal?.includes('Monitor') ? 'warning' : 'default'}
                  title={industrySignalTooltip(row)}
                >
                  {row.industrySignal}
                </Badge>
              </TableCell>
              <TableCell isHighlighted={selectedColIdx === 13} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(13); }} className="text-slate-500 leading-normal">{row.industrySignalReason}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
