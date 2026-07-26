import React, { useMemo } from 'react';
import { Target, Activity, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';
import { UnitMarketDashboardData } from '@/types';

interface UnitMarketSummaryProps {
  data: UnitMarketDashboardData | null;
  selectedUnit: string | null;
  selectedMarket: string | null;
  isLoading?: boolean;
}

export default function UnitMarketSummaryCard({ data, selectedUnit, selectedMarket, isLoading }: UnitMarketSummaryProps) {

  const fmtInt = (val: number) => val.toLocaleString();
  const fmtPct = (val: number) => `${(val * 100).toFixed(1)}%`;
  const fmtScore = (val: number) => val.toFixed(2);

  const dynamicSummary = useMemo(() => {
    if (!data || !data.latestRecommendations) return null;
    
    const recs = data.latestRecommendations;
    
    let sumScore = 0;
    let maxMomentum = 0;
    let highConf = 0;
    let lowConf = 0;
    
    recs.forEach(r => {
      sumScore += r.recommendationScore;
      if (r.momentumScore > maxMomentum) maxMomentum = r.momentumScore;
      const cl = r.confidenceLevel?.toLowerCase() || '';
      if (cl === 'high') highConf++;
      if (cl === 'low' || r.reviewReason) lowConf++;
    });
    
    const avgScore = recs.length > 0 ? sumScore / recs.length : 0;
    
    return {
      total: recs.length,
      highConfidence: highConf,
      lowConfidence: lowConf,
      avgScore,
      maxMomentum
    };
  }, [data]);

  const kpis = [
    { 
      label: "Total Recommendations", 
      value: dynamicSummary ? fmtInt(dynamicSummary.total) : "---",
      icon: Target,
      color: "bg-slate-50 text-slate-600 border-slate-200/50",
      description: "Count of all market segment recommendations"
    },
    { 
      label: "High Confidence", 
      value: dynamicSummary ? fmtInt(dynamicSummary.highConfidence) : "---",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Recommendations with strong supporting signals"
    },
    { 
      label: "Review Items", 
      value: dynamicSummary ? fmtInt(dynamicSummary.lowConfidence) : "---",
      icon: AlertTriangle,
      color: "bg-orange-50 text-orange-600 border-orange-100",
      description: "Items flagged for manual review"
    },
    { 
      label: "Avg Rec Score", 
      value: dynamicSummary ? fmtScore(dynamicSummary.avgScore) : "---",
      icon: Activity,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      description: "Average recommendation score across dataset"
    },
    { 
      label: "Max Momentum", 
      value: dynamicSummary ? fmtScore(dynamicSummary.maxMomentum) : "---",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Highest momentum score observed"
    }
  ];

  const unitLabel = selectedUnit && selectedUnit !== "all" ? selectedUnit : "All Units";
  const marketLabel = selectedMarket && selectedMarket !== "all" ? selectedMarket : "All Markets";

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-[#00205b] to-[#00205b] px-4 py-3 text-white flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2 w-full max-w-xl">
              <Skeleton className="h-6 w-2/3 bg-slate-700/50" />
              <Skeleton className="h-4 w-full bg-slate-700/50" />
            </div>
            <Skeleton className="h-16 w-28 rounded-lg bg-slate-700/50" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded border border-blue-500/30">Target Filter</span>
                <h1 className="text-xl font-bold tracking-tight">{unitLabel} / {marketLabel}</h1>
              </div>
              <p className="text-slate-400 text-xs font-medium max-w-2xl">
                Unit Market Segment Recommendations and Analysis. Displays the matching pairs based on the current unit and market filters.
              </p>
            </div>
            
            <div 
              className={cn(
                "rounded-lg py-2 px-3 border flex flex-col items-center justify-center min-w-[120px] transition-all duration-200",
                "bg-white/5 border-white/10"
              )}
            >
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Coverage</span>
              <span className="text-2xl font-black tabular-nums">{dynamicSummary ? fmtInt(dynamicSummary.total) : "---"}</span>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="px-4 py-3">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[100px] w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="group relative">
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300 h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("p-1.5 rounded-lg", kpi.color)}>
                      <kpi.icon size={14} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                      {kpi.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-900 tabular-nums">{kpi.value}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-normal font-medium italic">
                    {kpi.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
