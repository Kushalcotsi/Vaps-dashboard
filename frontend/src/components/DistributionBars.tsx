"use client"

import { VapsAttachRate } from "@/types"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent } from "./ui/Card"
import { Badge } from "./ui/Badge"
import { typography } from "@/design-system/typography"
import { Skeleton } from "./ui/Skeleton"

interface DistributionBarsProps {
  title: string;
  data: VapsAttachRate[];
  cutoff: number;
  subtitle?: string;
  isLoading?: boolean;
}

export default function DistributionBars({ title, data, cutoff, subtitle, isLoading }: DistributionBarsProps) {
  const getTooltip = (row: VapsAttachRate) => {
    return [
      `Decision: ${row.decision}`,
      `Reason: ${row.decisionReason}`,
      `Recommendation logic: ${row.recommendationKind || "Not covered"}`,
      `Covered in sheet: ${row.coveredText}`,
      `Attach rate: ${(row.attachRate * 100).toFixed(1)}%`,
      `Unit cutoff: ${(cutoff * 100).toFixed(1)}%`,
      `Volume: ${row.associated.toLocaleString()} associated / ${row.activations.toLocaleString()} activations`
    ].join("\n");
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-baseline border-b border-slate-100 pb-4">
        <div className="flex flex-col">
          <h2 className={typography.sectionTitle}>{title}</h2>
          {subtitle && <span className={typography.label}>{subtitle}</span>}
        </div>
        <Badge variant="outline">
          {isLoading ? <Skeleton className="h-3 w-16" /> : `Cutoff: ${(cutoff * 100).toFixed(1)}%`}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-2">
            <p className="text-slate-400 text-sm font-medium italic">No missed opportunities match the current filters.</p>
          </div>
        ) : (
          data.map((row, i) => (
            <div key={i} className="flex flex-col gap-2 group cursor-help" title={getTooltip(row)}>
              <div className="flex justify-between items-end gap-4">
                <div className="flex flex-col min-w-0">
                  <strong className="text-sm font-semibold text-slate-700 truncate leading-tight group-hover:text-primary transition-colors">
                    {row.vapsDesc}
                  </strong>
                  <span className={cn(typography.label, "flex items-center gap-2 lowercase")}>
                    <span className={typography.mono}>{row.vaps}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span>{row.mainGroup}</span>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {(row.attachRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                        {row.decision}
                    </span>
                </div>
              </div>
              
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      row.attachRate >= cutoff ? "bg-primary" : "bg-slate-300"
                  )}
                  style={{ width: `${Math.min(row.attachRate * 100, 100)}%` }}
                />
                {/* Cutoff Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                  style={{ left: `${cutoff * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
