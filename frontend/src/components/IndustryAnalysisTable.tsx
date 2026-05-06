"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from '@/types';
import { Search } from 'lucide-react';

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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Recommendation Sheet Comparison by Industry</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <select 
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none"
          >
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="FILTER VAPS ID"
              className="bg-white border border-slate-200 rounded-md pl-9 pr-4 py-1.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
            />
          </div>
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest">
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Market segment</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">VAPS</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">VAPS description</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Recommendation logic</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Recommendation value</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Covered</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Activations</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Associated</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Industry attach rate</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Unit attach rate</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Leverage</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Opportunity score</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Industry signal</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2.5 text-[11px] font-bold text-slate-500">{row.market}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-slate-800">{row.vaps}</td>
                <td className="px-4 py-2.5 text-[11px] font-bold text-slate-700">{row.vapsDesc}</td>
                <td className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.recommendationKind || "Fixed quantity"}</td>
                <td className="px-4 py-2.5 text-[11px] font-bold text-slate-500 italic">{row.recommendationValue || "0"}</td>
                <td className="px-4 py-2.5 text-[11px] font-bold text-slate-500">{row.coveredText || "No"}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-slate-600 text-right tabular-nums">{fmtNum(row.activations)}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-slate-600 text-right tabular-nums">{fmtNum(row.associated)}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-blue-600 text-right tabular-nums">{fmtPct(row.attachRate)}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-slate-800 text-right tabular-nums">{fmtPct(row.unitAttachRate)}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-emerald-600 text-right tabular-nums">{row.leverage ? row.leverage.toFixed(2) + "x" : "---"}</td>
                <td className="px-4 py-2.5 text-[11px] font-black text-slate-900 text-right tabular-nums">{row.opportunityScore?.toFixed(1)}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200">
                    {row.industrySignal}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[11px] font-medium text-slate-500 leading-tight min-w-[200px]">{row.industrySignalReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
