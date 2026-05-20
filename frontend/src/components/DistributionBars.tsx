"use client"

import { VapsAttachRate } from "@/types"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent, CardFooter } from "./ui/Card"
import { Badge } from "./ui/Badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"
import { Skeleton } from "./ui/Skeleton"
import { Package, TrendingUp, AlertTriangle, CheckCircle2, PlusCircle, AlertCircle, Info } from "lucide-react"

interface DistributionBarsProps {
  title: string;
  data: VapsAttachRate[];
  cutoff: number;
  subtitle?: string;
  isLoading?: boolean;
}

function ActionBadge({ decision }: { decision: string }) {
  const d = decision.toUpperCase();
  if (d.includes('KEEP')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm leading-none tracking-wide">
        <CheckCircle2 className="w-2.5 h-2.5" /> KEEP
      </span>
    );
  }
  if (d.includes('ADD')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 shadow-sm leading-none tracking-wide">
        <PlusCircle className="w-2.5 h-2.5" /> ADD
      </span>
    );
  }
  if (d.includes('REVIEW')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 shadow-sm leading-none tracking-wide">
        <AlertTriangle className="w-2.5 h-2.5" /> REVIEW
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 shadow-sm leading-none tracking-wide">
      {decision}
    </span>
  );
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

  const aboveBenchmarkCount = data.filter(d => d.attachRate >= cutoff).length;
  const isMissedOpportunity = title.toLowerCase().includes("missed");

  const defaultSubtitle = isMissedOpportunity 
    ? "High potential missed opportunities below cutoff" 
    : "High performing VAPS above cutoff benchmark";

  return (
    <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/60 bg-white/70 backdrop-blur-xl overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row justify-between items-start border-b border-slate-100/80 pb-2 px-4 pt-3">
        <div className="flex flex-col gap-0">
          <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="text-[10px] font-medium text-slate-500">{subtitle || defaultSubtitle}</span>
        </div>
        <Badge variant="outline" className="bg-slate-50/50 text-slate-600 font-semibold border-slate-200/60 px-2 py-0.5 text-[9px] whitespace-nowrap shadow-sm">
          {isLoading ? <Skeleton className="h-2 w-12" /> : `Benchmark: ${(cutoff * 100).toFixed(1)}%`}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-0.5 p-1.5 flex-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <Skeleton className="w-7 h-7 rounded-md" />
                  <div className="flex flex-col gap-1 mt-0.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
              <Skeleton className="h-1 w-full rounded-full mt-0.5" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-slate-500 text-xs font-medium">No insights available for the current selection.</p>
          </div>
        ) : (
          data.map((row, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div 
                  className="group flex flex-col gap-1.5 p-2 px-2.5 rounded-lg hover:bg-slate-50/80 transition-all duration-200 border border-transparent hover:border-slate-200/60 hover:shadow-sm cursor-help relative overflow-hidden text-left" 
                >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-2 items-center min-w-0">
                  <div className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 border transition-colors shadow-sm",
                    isMissedOpportunity 
                      ? "bg-amber-50/50 border-amber-100/60 group-hover:bg-amber-100/50 text-amber-500"
                      : "bg-indigo-50/50 border-indigo-100/60 group-hover:bg-indigo-100/50 text-indigo-500"
                  )}>
                    {isMissedOpportunity ? <TrendingUp className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col min-w-0 gap-0">
                    <strong className={cn(
                      "text-[12px] font-semibold truncate leading-tight transition-colors",
                      isMissedOpportunity ? "text-slate-800 group-hover:text-amber-700" : "text-slate-800 group-hover:text-indigo-700"
                    )}>
                      {row.vapsDesc || "Unmapped VAPS"}
                    </strong>
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-slate-400 text-[8px] px-1 py-0 bg-slate-100 rounded border border-slate-200/60 leading-none">{row.vaps}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="truncate">{row.mainGroup}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0 mt-0.5">
                  <ActionBadge decision={row.decision || "UNKNOWN"} />
                  <span className="text-[14px] font-extrabold text-slate-900 tabular-nums leading-none tracking-tight mt-0.5">
                    {(row.attachRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="relative pt-0.5 pb-0 mt-0">
                <div className="h-[5px] w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
                  <div 
                    className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                        isMissedOpportunity
                          ? (row.attachRate >= cutoff ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-500")
                          : (row.attachRate >= cutoff ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-indigo-400 to-indigo-500")
                    )}
                    style={{ width: `${Math.min(row.attachRate * 100, 100)}%` }}
                  />
                </div>
                {/* Cutoff Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-slate-800 z-10 rounded-full shadow-md transition-all group-hover:bg-slate-900 group-hover:w-[3px]"
                  style={{ left: `${cutoff * 100}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 whitespace-nowrap z-20 leading-none">
                    Target: {(cutoff * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs whitespace-pre-wrap text-xs">
            {getTooltip(row)}
          </TooltipContent>
        </Tooltip>
          ))
        )}
      </CardContent>

      {!isLoading && data.length > 0 && (
        <CardFooter className="bg-slate-50/80 border-t border-slate-100/80 px-4 py-2 mt-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 w-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            {isMissedOpportunity 
              ? <span><strong className="text-slate-900">{aboveBenchmarkCount}</strong> of <strong className="text-slate-900">{data.length}</strong> VAPS have strong attach improvement opportunities</span>
              : <span><strong className="text-slate-900">{aboveBenchmarkCount}</strong> of <strong className="text-slate-900">{data.length}</strong> VAPS are performing above benchmark</span>
            }
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

