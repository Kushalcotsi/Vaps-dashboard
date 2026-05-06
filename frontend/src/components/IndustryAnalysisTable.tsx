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

  const fmtPct = (val?: number) => val !== undefined ? `${(val * 100).toFixed(1)}%` : "0.0%";
  const fmtNum = (val?: number) => val !== undefined ? val.toLocaleString() : "0";

  const columns = [
    { label: "Market segment", minW: "150px" },
    { label: "VAPS", minW: "100px" },
    { label: "VAPS description", minW: "250px" },
    { label: "Recommendation logic", minW: "150px" },
    { label: "Recommendation value", minW: "120px" },
    { label: "Covered", minW: "80px" },
    { label: "Activations", isNum: true, minW: "100px" },
    { label: "Associated", isNum: true, minW: "100px" },
    { label: "Industry attach rate", isNum: true, minW: "120px" },
    { label: "Unit attach rate", isNum: true, minW: "120px" },
    { label: "Leverage", isNum: true, minW: "100px" },
    { label: "Opportunity score", isNum: true, minW: "120px" },
    { label: "Industry signal", minW: "180px" },
    { label: "Interpretation", minW: "300px" }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className={typography.cardTitle}>Recommendation Sheet Comparison by Industry</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Select 
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="w-auto min-w-[180px]"
          >
            <option value="">All Markets</option>
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="FILTER VAPS ID"
            icon={<Search size={14} />}
            className="w-48"
          />
          <Button variant="outline" size="sm" className="flex items-center gap-2">
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
                {col.label}
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
              <TableCell isHighlighted={selectedColIdx === 10} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(10); }} isNum isBold className="text-emerald-600">{row.leverage ? row.leverage.toFixed(2) + "x" : "---"}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 11} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(11); }} isNum isBold>{row.opportunityScore?.toFixed(1)}</TableCell>
              <TableCell isHighlighted={selectedColIdx === 12} onClick={() => { setSelectedVaps(row.vaps === selectedVaps ? null : row.vaps); setSelectedColIdx(12); }}>
                <Badge variant={row.industrySignal?.includes('Strong') ? 'success' : row.industrySignal?.includes('Good') ? 'info' : 'default'}>
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
