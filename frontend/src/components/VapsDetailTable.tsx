"use client"

import React, { useMemo, useState } from 'react';
import { VapsAttachRate } from "@/types";
import { Search, Download, ArrowUpDown } from "lucide-react";
import { Card, CardHeader } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims";
import { typography } from "@/design-system/typography";
import { Badge } from "./ui/Badge";

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
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className={typography.cardTitle}>{title}</h2>
          <Badge variant="outline">
            {filteredAndSortedData.length} VAPS
          </Badge>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="FILTER VAPS ID"
            icon={<Search size={14} />}
            className="md:w-64"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download size={12} />
            CSV
          </Button>
        </div>
      </CardHeader>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead 
                key={col.key} 
                onClick={() => handleSort(col.key as string)}
                isNum={col.isNum}
                className="cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className={`flex items-center gap-2 ${col.isNum ? 'justify-end' : ''}`}>
                  {col.label}
                  <ArrowUpDown size={10} className="text-slate-300" />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-slate-100">
          {filteredAndSortedData.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map(col => {
                const val = (row as any)[col.key];
                return (
                  <TableCell 
                    key={col.key} 
                    isNum={col.isNum}
                    isBold={col.isNum && col.key === 'attachRate'}
                    className={col.key === 'vaps' ? typography.mono : ''}
                  >
                    {col.fmt ? col.fmt(val) : (val ?? "")}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
