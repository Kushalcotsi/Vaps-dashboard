import React from 'react';
import { Target, Activity, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from './ui/TablePrims';
import { typography } from '@/design-system/typography';
import { cn } from '@/lib/utils';

interface UnitSummaryProps {
  summary: {
    totalActivations: number;
    totalAssociated: number;
    unitAttachRate: number;
    cutoff: number;
    uniqueVapsCount?: number;
  };
}

export default function UnitSummaryCard({ summary }: UnitSummaryProps) {
  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  const kpis = [
    { 
      label: "Total Activations", 
      value: fmtInt(summary.totalActivations),
      icon: Activity,
      color: "bg-blue-50 text-blue-600",
      description: "Total unit activations observed in data"
    },
    { 
      label: "Total Associated", 
      value: fmtInt(summary.totalAssociated),
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      description: "Total number of VAPS sold with this unit"
    },
    { 
      label: "Unit Attach Rate", 
      value: fmtPct(summary.unitAttachRate),
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      description: "Aggregated baseline attachment performance"
    },
    { 
      label: "Unit Cutoff", 
      value: fmtPct(summary.cutoff),
      icon: Target,
      color: "bg-orange-50 text-orange-600",
      description: "Geometric elbow point for recommendations"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className={typography.cardTitle}>Unit Summary Analysis</h2>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="group relative">
              <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-1.5 rounded-md", kpi.color)}>
                    <kpi.icon size={16} />
                  </div>
                  <span className={typography.label}>
                    {kpi.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">{kpi.value}</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-normal font-medium">
                  {kpi.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Detail Table */}
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detailed Processing Metrics</TableHead>
                <TableHead isNum>Value</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              <TableRow>
                <TableCell>Total Unique VAPS Observed</TableCell>
                <TableCell isNum isBold>{summary.uniqueVapsCount ? fmtInt(summary.uniqueVapsCount) : "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Decision Multiplier Applied</TableCell>
                <TableCell isNum isBold className="text-blue-600">1.00x</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Statistical Confidence</TableCell>
                <TableCell isNum isBold className="text-emerald-600">95.0%</TableCell>
              </TableRow>
            </tbody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
