"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from "@/types";
import { Search, Download, ArrowUpDown } from "lucide-react";

interface ColumnDef {
  key: keyof VapsAttachRate | string;
  label: string;
  isNum?: boolean;
  fmt?: (val: any) => string;
}

interface VapsDetailTableProps {
  title: string;
  data: VapsAttachRate[];
  columns: ColumnDef[];
  downloadId?: string;
}

export default function VapsDetailTable({ title, data, columns, downloadId }: VapsDetailTableProps) {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];
    
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter(r => 
        r.vaps.toLowerCase().includes(q) || 
        r.vapsDesc.toLowerCase().includes(q) ||
        (r.market && r.market.toLowerCase().includes(q)) ||
        (r.division && r.division.toLowerCase().includes(q)) ||
        (r.region && r.region.toLowerCase().includes(q))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortConfig.key] || "";
        const bVal = (b as any)[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filter, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDownload = () => {
    const csvHeaders = columns.map(c => c.label).join(",");
    const csvRows = filteredAndSortedData.map(r => 
      columns.map(c => {
        const val = (r as any)[c.key];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(",")
    );
    const blob = new Blob([[csvHeaders, ...csvRows].join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h2>
          <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">
            {filteredAndSortedData.length} VAPS
          </span>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="FILTER VAPS ID"
              className="bg-white border border-slate-200 rounded-md pl-9 pr-4 py-1.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
            />
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest"
          >
            <Download size={12} />
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              {columns.map(col => (
                <th 
                  key={col.key} 
                  onClick={() => handleSort(col.key as string)}
                  className={`px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap ${col.isNum ? 'text-right' : ''}`}
                >
                  <div className={`flex items-center gap-2 ${col.isNum ? 'justify-end' : ''}`}>
                    {col.label}
                    <ArrowUpDown size={10} className="text-slate-300" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                {columns.map(col => {
                  const val = (row as any)[col.key];
                  return (
                    <td key={col.key} className={`px-4 py-2.5 text-[11px] font-bold text-slate-600 ${col.isNum ? 'text-right font-black tabular-nums' : ''}`}>
                      {col.fmt ? col.fmt(val) : (val ?? "")}
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
