"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDashboardData } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import DashboardHeader from "@/components/DashboardHeader"
import KpiCard from "@/components/KpiCard"
import { useMemo } from "react"

import ElbowChart from "@/components/ElbowChart"
import DistributionBars from "@/components/DistributionBars"
import RecommendationTable from "@/components/RecommendationTable"
import HeatmapTable from "@/components/HeatmapTable"

export default function DashboardPage() {
  const { selectedUnit, selectedSource, selectedGroup } = useDashboardStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", selectedUnit],
    queryFn: () => fetchDashboardData(selectedUnit),
    enabled: !!selectedUnit,
  })

  // Filter rows based on Source and Group
  const filteredUnitRows = useMemo(() => {
    if (!data?.unitRows) return [];
    return data.unitRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  const filteredMarketRows = useMemo(() => {
    if (!data?.marketRows) return [];
    return data.marketRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  const filteredDivisionRows = useMemo(() => {
    if (!data?.divisionRows) return [];
    return data.divisionRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  const filteredRegionRows = useMemo(() => {
    if (!data?.regionRows) return [];
    return data.regionRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  // Calculate metrics and rankings
  const processedData = useMemo(() => {
    if (!data?.unitRows?.length) return null;
    
    const firstRow = data.unitRows[0];
    
    // Top Recommended (based on filtered rows)
    const topRecommended = filteredUnitRows
      .filter(r => r.coveredByRecommendationLogic)
      .sort((a, b) => b.attachRate - a.attachRate)
      .slice(0, 5);

    // Missed Opportunities (based on filtered rows)
    const missedOpportunities = filteredUnitRows
      .filter(r => !r.coveredByRecommendationLogic && r.attachRate >= data.cutoff)
      .sort((a, b) => b.attachRate - a.attachRate)
      .slice(0, 5);

    return {
      unitName: firstRow.unitName,
      unitDescription: firstRow.unitDescription,
      activations: filteredUnitRows.length > 0 ? Math.max(...filteredUnitRows.map(r => r.activations)) : 0,
      associated: filteredUnitRows.reduce((acc, row) => acc + row.associated, 0),
      cutoff: data.cutoff,
      topRecommended,
      missedOpportunities
    };
  }, [data, filteredUnitRows]);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
        <h2 className="text-red-800 font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-red-600 text-sm">{error instanceof Error ? error.message : "Connection error"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <main className="flex-1 overflow-auto bg-slate-50/50 p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-white -z-10" />
      <div className="max-w-[1760px] mx-auto flex flex-col gap-12 pb-20 relative z-10">
        <DashboardHeader />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl p-5 flex flex-col gap-2 min-w-0 lg:col-span-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-bl from-teal-500/10 to-blue-500/0 rounded-full blur-2xl" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none z-10">
              Selected Unit
            </span>
            <div className="flex flex-col gap-1 z-10">
              <strong className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                {processedData?.unitName || "---"}
              </strong>
              <span className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                {processedData?.unitDescription || "---"}
              </span>
            </div>
          </div>

          <KpiCard 
            label="Total Activations" 
            value={processedData?.activations.toLocaleString() || "0"} 
            subValue="Unique sales documents"
          />

          <KpiCard 
            label="VAPS Associations" 
            value={processedData?.associated.toLocaleString() || "0"} 
            subValue="Total VAPS attached to unit"
          />

          <KpiCard 
            label="Elbow Cutoff Rate" 
            value={processedData ? `${(processedData.cutoff * 100).toFixed(1)}%` : "0.0%"} 
            subValue="Optimized performance threshold"
            valueClassName="text-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DistributionBars 
            title="Top 5 Recommended VAPS by Attach Rate" 
            data={processedData?.topRecommended || []} 
            cutoff={processedData?.cutoff || 0}
            subtitle="Sorted by attach rate"
          />
          <DistributionBars 
            title="Top 5 Missed Opportunity Rate" 
            data={processedData?.missedOpportunities || []} 
            cutoff={processedData?.cutoff || 0}
            subtitle="High attach rate, but not recommended"
          />
        </div>

        <section className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Attach Rate Distribution</h2>
            <p className="text-sm text-slate-500 font-medium">Visualizing the &quot;Elbow&quot; inflection point for Unit {selectedUnit}</p>
          </div>
          <ElbowChart data={data?.unitRows || []} cutoff={data?.cutoff || 0} />
        </section>

        <RecommendationTable data={filteredUnitRows} />

        <div className="flex flex-col gap-8">
          <HeatmapTable 
            title="Market Segment Heatmap" 
            data={filteredMarketRows} 
            pivotKey="market" 
            cutoff={data?.cutoff || 0} 
          />
          
          <HeatmapTable 
            title="Division Heatmap" 
            data={filteredDivisionRows} 
            pivotKey="division" 
            cutoff={data?.cutoff || 0} 
          />

          <HeatmapTable 
            title="Region Heatmap" 
            data={filteredRegionRows} 
            pivotKey="region" 
            cutoff={data?.cutoff || 0} 
          />
        </div>
      </div>
    </main>
  )
}
