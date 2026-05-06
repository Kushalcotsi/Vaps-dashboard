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

interface IndustryAnalysisProps {
  marketRows: VapsAttachRate[];
}

export default function IndustryAnalysisTable({ marketRows }: IndustryAnalysisProps) {
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [search, setSearch] = useState('');

  const markets = useMemo(() => {
    return Array.from(new Set(marketRows.map(r => r.market).filter(Boolean))).sort();
  }, [marketRows]);

  React.useEffect(() => {
    if (!selectedMarket && markets.length > 0) {
      setSelectedMarket(markets[0] || "");
    }
  }, [markets, selectedMarket]);

  const filteredRows = useMemo(() => {
    return marketRows.filter(r => 
      r.market === selectedMarket &&
      (search === '' || 
       r.vaps.toLowerCase().includes(search.toLowerCase()) || 
       r.vapsDesc.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
  }, [marketRows, selectedMarket, search]);

  const fmtPct = (val?: number) => val !== undefined ? `${(val * 100).toFixed(1)}%` : "0.0%";
  const fmtNum = (val?: number) => val !== undefined ? val.toLocaleString() : "0";

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
            <TableHead>Market segment</TableHead>
            <TableHead>VAPS</TableHead>
            <TableHead>VAPS description</TableHead>
            <TableHead>Recommendation logic</TableHead>
            <TableHead>Recommendation value</TableHead>
            <TableHead>Covered</TableHead>
            <TableHead isNum>Activations</TableHead>
            <TableHead isNum>Associated</TableHead>
            <TableHead isNum>Industry attach rate</TableHead>
            <TableHead isNum>Unit attach rate</TableHead>
            <TableHead isNum>Leverage</TableHead>
            <TableHead isNum>Opportunity score</TableHead>
            <TableHead>Industry signal</TableHead>
            <TableHead>Interpretation</TableHead>
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-slate-100">
          {filteredRows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell className="text-slate-500">{row.market}</TableCell>
              <TableCell isBold className={typography.mono}>{row.vaps}</TableCell>
              <TableCell className="text-slate-700 min-w-[200px]">{row.vapsDesc}</TableCell>
              <TableCell className={typography.label}>{row.recommendationKind || "Fixed quantity"}</TableCell>
              <TableCell className="text-xs font-medium text-slate-500 italic">{row.recommendationValue || "0"}</TableCell>
              <TableCell>{row.coveredText || "No"}</TableCell>
              <TableCell isNum>{fmtNum(row.activations)}</TableCell>
              <TableCell isNum>{fmtNum(row.associated)}</TableCell>
              <TableCell isNum isBold className="text-blue-600">{fmtPct(row.attachRate)}</TableCell>
              <TableCell isNum isBold>{fmtPct(row.unitAttachRate)}</TableCell>
              <TableCell isNum isBold className="text-emerald-600">{row.leverage ? row.leverage.toFixed(2) + "x" : "---"}</TableCell>
              <TableCell isNum isBold>{row.opportunityScore?.toFixed(1)}</TableCell>
              <TableCell>
                <Badge variant={row.industrySignal?.includes('Strong') ? 'success' : row.industrySignal?.includes('Good') ? 'info' : 'default'}>
                  {row.industrySignal}
                </Badge>
              </TableCell>
              <TableCell className="min-w-[250px]">{row.industrySignalReason}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
