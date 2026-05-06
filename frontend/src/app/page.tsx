"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchDashboardData } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import DashboardHeader from "@/components/DashboardHeader"
import DistributionBars from "@/components/DistributionBars"
import ElbowChart from "@/components/ElbowChart"
import RecommendationTable from "@/components/RecommendationTable"
import HeatmapTable from "@/components/HeatmapTable"
import UnitSummaryCard from "@/components/UnitSummaryCard"
import IndustryAnalysisTable from "@/components/IndustryAnalysisTable"
import VapsDetailTable from "@/components/VapsDetailTable"

export default function DashboardPage() {
  const { selectedUnit, selectedSource, selectedGroup, searchQuery } = useDashboardStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", selectedUnit],
    queryFn: () => fetchDashboardData(selectedUnit),
    enabled: !!selectedUnit,
  })

  const matchesSearch = (r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.vaps.toLowerCase().includes(q) || r.vapsDesc.toLowerCase().includes(q);
  };

  const filteredUnitRows = useMemo(() => {
    if (!data?.unitRows) return [];
    return data.unitRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup) &&
      matchesSearch(r)
    );
  }, [data, selectedSource, selectedGroup, searchQuery]);

  const filteredSegments = useMemo(() => {
    if (!data?.segments) return {};
    const result: Record<string, any[]> = {};
    Object.entries(data.segments).forEach(([name, rows]) => {
      result[name] = (rows as any[]).filter(r => 
        (!selectedSource || r.source === selectedSource) &&
        (!selectedGroup || r.mainGroup === selectedGroup) &&
        matchesSearch(r)
      );
    });
    return result;
  }, [data, selectedSource, selectedGroup, searchQuery]);

  // Column Definitions for Detail Tables (EXACT PARITY)
  const detailColumns = {
    unit: [
      { key: "vaps", label: "VAPS" },
      { key: "vapsDesc", label: "VAPS description" },
      { key: "source", label: "Source" },
      { key: "mainGroup", label: "Main group" },
      { key: "tier", label: "Tier" },
      { key: "activations", label: "Unit activations", isNum: true },
      { key: "associated", label: "VAPS associated", isNum: true },
      { key: "attachRate", label: "Attach rate", isNum: true, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { key: "elbowCutoff", label: "Elbow cutoff", isNum: true, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { key: "cutoffStatus", label: "Cutoff status" },
    ],
    segment: (type: string) => [
      { key: type, label: type.charAt(0).toUpperCase() + type.slice(1) + " segment" },
      { key: "vaps", label: "VAPS" },
      { key: "vapsDesc", label: "VAPS description" },
      { key: "source", label: "Source" },
      { key: "mainGroup", label: "Main group" },
      { key: "tier", label: "Tier" },
      { key: "activations", label: "Unit activations", isNum: true },
      { key: "associated", label: "VAPS associated", isNum: true },
      { key: "attachRate", label: `${type.charAt(0).toUpperCase() + type.slice(1)} attach rate`, isNum: true, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { key: "unitAttachRate", label: "Unit attach rate", isNum: true, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { key: "unitCutoff", label: "Unit cutoff", isNum: true, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { key: "leverage", label: "Leverage", isNum: true, fmt: (v: number) => v ? v.toFixed(2) + "x" : "---" },
      { key: "opportunityScore", label: "Opportunity score", isNum: true, fmt: (v: number) => v.toFixed(1) },
      { key: "industrySignal", label: `${type.charAt(0).toUpperCase() + type.slice(1)} signal` },
    ]
  };

  if (isLoading) return <div className="p-10 text-slate-400 font-black uppercase tracking-widest text-xs">Loading Analytical Intelligence...</div>;
  if (error) return <div className="p-10 text-rose-500 font-black">Connection Error</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-teal-100">
      <div className="max-w-[1600px] mx-auto p-4 md:p-10 space-y-12">
        
        <DashboardHeader />
        {data?.summary && <UnitSummaryCard summary={data.summary} />}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <DistributionBars title="Top 5 Recommended VAPS Attach Rates" data={filteredUnitRows.filter(r => r.coveredByRecommendationLogic).sort((a,b)=>b.attachRate-a.attachRate).slice(0,5)} cutoff={data?.summary?.cutoff || 0} />
          <DistributionBars title="Top 5 Missed Opportunity Rate" data={filteredUnitRows.filter(r => !r.coveredByRecommendationLogic && r.attachRate >= (data?.summary?.cutoff || 0)).sort((a,b)=>b.attachRate-a.attachRate).slice(0,5)} cutoff={data?.summary?.cutoff || 0} />
        </div>

        <ElbowChart data={filteredUnitRows} cutoff={data?.summary?.cutoff || 0.05} />

        {/* THE 9 CORE TABLES (STRICT PARITY) */}
        
        {/* 01. Recommendation Sheet Comparison */}
        <RecommendationTable data={filteredUnitRows} />

        {/* 02-04. Heatmaps */}
        {Object.entries(filteredSegments).map(([name, rows]) => (
          <HeatmapTable 
            key={name}
            title={`${name} Segment Heatmap`} 
            data={rows} 
            segmentName={name.toLowerCase()}
            cutoff={data?.summary?.cutoff || 0.05}
          />
        ))}

        {/* 05. Recommendation Sheet Comparison by Industry */}
        {data?.segments["Market"] && (
          <IndustryAnalysisTable marketRows={filteredSegments["Market"]} />
        )}

        {/* 06. Unit-Level VAPS Detail */}
        <VapsDetailTable 
          title="Unit-Level VAPS Detail" 
          data={filteredUnitRows} 
          columns={detailColumns.unit} 
        />

        {/* 07. Market Segment VAPS Detail */}
        {filteredSegments["Market"] && (
          <VapsDetailTable 
            title="Market Segment VAPS Detail" 
            data={filteredSegments["Market"]} 
            columns={detailColumns.segment("market")} 
          />
        )}

        {/* 08. Division VAPS Detail */}
        {filteredSegments["Division"] && (
          <VapsDetailTable 
            title="Division VAPS Detail" 
            data={filteredSegments["Division"]} 
            columns={detailColumns.segment("division")} 
          />
        )}

        {/* 09. Region VAPS Detail */}
        {filteredSegments["Region"] && (
          <VapsDetailTable 
            title="Region VAPS Detail" 
            data={filteredSegments["Region"]} 
            columns={detailColumns.segment("region")} 
          />
        )}

      </div>
    </div>
  )
}
