"use client"

import { useMemo, useState } from "react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PageContainer } from "@/components/layout/PageContainer"
import { spacing } from "@/design-system/spacing"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { 
    selectedUnit, selectedSource, selectedGroup
  } = useDashboardStore()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["dashboard", selectedUnit],
    queryFn: () => fetchDashboardData(selectedUnit),
    enabled: !!selectedUnit,
    staleTime: 30000, // Keep data fresh for 30s
  })

  const filteredUnitRows = useMemo(() => {
    if (!data?.unitRows) return [];
    return data.unitRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  const filteredRecommendationRows = useMemo(() => {
    if (!data?.recommendationRows) return [];
    return data.recommendationRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  const filteredIndustryRecommendationRows = useMemo(() => {
    if (!data?.industryRecommendationRows) return [];
    return data.industryRecommendationRows.filter(r => 
      (!selectedSource || r.source === selectedSource) &&
      (!selectedGroup || r.mainGroup === selectedGroup)
    );
  }, [data, selectedSource, selectedGroup]);

  const filteredSegments = useMemo(() => {
    if (!data?.segments) return {};
    const result: Record<string, any[]> = {};
    Object.entries(data.segments).forEach(([name, rows]) => {
      result[name] = (rows as any[]).filter(r => 
        (!selectedSource || r.source === selectedSource) &&
        (!selectedGroup || r.mainGroup === selectedGroup)
      );
    });
    return result;
  }, [data, selectedSource, selectedGroup]);

  const dynamicSummary = useMemo(() => {
    if (!data?.summary) return null;
    
    // Dynamically calculate based on filtered dataset
    const activations = filteredUnitRows.length > 0 
      ? Math.max(...filteredUnitRows.map(r => r.activations)) 
      : 0;
    const associated = filteredUnitRows.reduce((sum, r) => sum + r.associated, 0);
    
    return {
      ...data.summary,
      activations,
      associated,
      uniqueVapsCount: filteredUnitRows.length
    };
  }, [data?.summary, filteredUnitRows]);

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

  const [activeTab, setActiveTab] = useState("overview");
  
  // Sub-view states for toggles
  const [unitSubView, setUnitSubView] = useState("recommendation"); // recommendation | industry
  const [marketSubView, setMarketSubView] = useState("heatmap"); // heatmap | table
  const [divisionSubView, setDivisionSubView] = useState("heatmap"); // heatmap | table
  const [regionSubView, setRegionSubView] = useState("heatmap"); // heatmap | table

  // Show a "Processing" indicator for background fetches
  const isSoftLoading = isFetching && !isLoading;

  const ToggleUI = ({ options, value, onChange }: { options: { id: string, label: string }[], value: string, onChange: (id: string) => void }) => (
    <div className="flex p-1 bg-slate-100 rounded-lg w-fit mb-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
            value === opt.id 
              ? "bg-white text-primary shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <PageContainer className="space-y-4">
        {/* Header Section */}
        <div className="relative">
           <DashboardHeader />
           {isSoftLoading && (
             <div className="absolute top-0 right-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse bg-white/80 px-3 py-1 rounded-full border border-blue-100 shadow-sm z-50">
               <Loader2 size={12} className="animate-spin" />
               Refreshing Intelligence...
             </div>
           )}
        </div>

        <UnitSummaryCard 
          isLoading={isLoading}
          summary={dynamicSummary} 
        />

        {/* Workspace Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4 relative overflow-hidden">
          {/* Content Loading Overlay (Soft) */}
          {isSoftLoading && (
            <div className="absolute inset-0 bg-slate-50/10 backdrop-blur-[1px] z-10 transition-all duration-300 pointer-events-none" />
          )}

          <Tabs>
            <TabsList className="bg-slate-100/80 p-1.5 rounded-xl border-none h-auto gap-2 mb-4 flex w-fit mx-auto">
              {[
                { id: "overview", label: "Overview" },
                { id: "unit", label: "VAPS Attach Rate by Unit" },
                { id: "market", label: "VAPS Attach Rate by Market and Unit" },
                { id: "division", label: "VAPS Attach Rate by Unit and Division" },
                { id: "region", label: "VAPS Attach Rate by Unit and Region" },
                { id: "raw", label: "VAPS Details" },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  active={activeTab === tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-2.5 px-5 rounded-lg border-none text-[10px] font-bold tracking-tight transition-all duration-200 whitespace-nowrap",
                    activeTab === tab.id 
                      ? "bg-white text-primary shadow-md scale-[1.02]" 
                      : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab 1: Overview */}
            <TabsContent active={activeTab === "overview"}>
              <div className="space-y-4 mt-1">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <DistributionBars 
                    isLoading={isLoading}
                    title="Top 5 Recommended VAPS Attach Rates" 
                    data={filteredUnitRows.filter(r => r.coveredByRecommendationLogic).sort((a,b)=>b.attachRate-a.attachRate).slice(0,5)} 
                    cutoff={data?.summary?.cutoff || 0} 
                  />
                  <DistributionBars 
                    isLoading={isLoading}
                    title="Top 5 Missed Opportunity Rate" 
                    data={filteredUnitRows.filter(r => !r.coveredByRecommendationLogic && r.attachRate >= (data?.summary?.cutoff || 0)).sort((a,b)=>b.attachRate-a.attachRate).slice(0,5)} 
                    cutoff={data?.summary?.cutoff || 0} 
                  />
                </div>
                <ElbowChart isLoading={isLoading} data={filteredUnitRows} cutoff={data?.summary?.cutoff || 0.05} />
              </div>
            </TabsContent>

            {/* Tab 2: VAPS Attach Rate by Unit */}
            <TabsContent active={activeTab === "unit"}>
              <div className="mt-1">
                <ToggleUI 
                  options={[
                    { id: "recommendation", label: "Recommendation Sheet Comparison" },
                    { id: "industry", label: "Industry Comparison" }
                  ]}
                  value={unitSubView}
                  onChange={setUnitSubView}
                />
                
                {unitSubView === "recommendation" ? (
                  <RecommendationTable isLoading={isLoading} data={filteredRecommendationRows} />
                ) : (
                  <IndustryAnalysisTable isLoading={isLoading} marketRows={filteredIndustryRecommendationRows} />
                )}
              </div>
            </TabsContent>

            {/* Tab 3: VAPS Attach Rate by Market and Unit */}
            <TabsContent active={activeTab === "market"}>
              <div className="mt-1">
                <ToggleUI 
                  options={[
                    { id: "heatmap", label: "Market Heatmap" },
                    { id: "table", label: "Market Segment Table" }
                  ]}
                  value={marketSubView}
                  onChange={setMarketSubView}
                />

                {marketSubView === "heatmap" ? (
                  <HeatmapTable 
                    isLoading={isLoading}
                    title="Market Segment Heatmap" 
                    data={filteredSegments["Market"] || []} 
                    segmentName="market"
                    cutoff={data?.summary?.cutoff || 0.05}
                  />
                ) : (
                  <VapsDetailTable 
                    isLoading={isLoading}
                    title="Market Segment VAPS Detail" 
                    data={filteredSegments["Market"] || []} 
                    columns={detailColumns.segment("market")} 
                  />
                )}
              </div>
            </TabsContent>

            {/* Tab 4: VAPS Attach Rate by Unit and Division */}
            <TabsContent active={activeTab === "division"}>
              <div className="mt-1">
                <ToggleUI 
                  options={[
                    { id: "heatmap", label: "Division Heatmap" },
                    { id: "table", label: "Division Segment Table" }
                  ]}
                  value={divisionSubView}
                  onChange={setDivisionSubView}
                />

                {divisionSubView === "heatmap" ? (
                  <HeatmapTable 
                    isLoading={isLoading}
                    title="Division Segment Heatmap" 
                    data={filteredSegments["Division"] || []} 
                    segmentName="division"
                    cutoff={data?.summary?.cutoff || 0.05}
                  />
                ) : (
                  <VapsDetailTable 
                    isLoading={isLoading}
                    title="Division Segment VAPS Detail" 
                    data={filteredSegments["Division"] || []} 
                    columns={detailColumns.segment("division")} 
                  />
                )}
              </div>
            </TabsContent>

            {/* Tab 5: VAPS Attach Rate by Unit and Region */}
            <TabsContent active={activeTab === "region"}>
              <div className="mt-1">
                <ToggleUI 
                  options={[
                    { id: "heatmap", label: "Region Heatmap" },
                    { id: "table", label: "Region Segment Table" }
                  ]}
                  value={regionSubView}
                  onChange={setRegionSubView}
                />

                {regionSubView === "heatmap" ? (
                  <HeatmapTable 
                    isLoading={isLoading}
                    title="Region Segment Heatmap" 
                    data={filteredSegments["Region"] || []} 
                    segmentName="region"
                    cutoff={data?.summary?.cutoff || 0.05}
                  />
                ) : (
                  <VapsDetailTable 
                    isLoading={isLoading}
                    title="Region Segment VAPS Detail" 
                    data={filteredSegments["Region"] || []} 
                    columns={detailColumns.segment("region")} 
                  />
                )}
              </div>
            </TabsContent>

            {/* Tab 6: Raw VAPS Details */}
            <TabsContent active={activeTab === "raw"}>
              <div className="mt-1">
                <VapsDetailTable 
                  isLoading={isLoading}
                  title="Unit-Level VAPS Detail" 
                  data={filteredUnitRows} 
                  columns={detailColumns.unit} 
                />
              </div>
            </TabsContent>
            
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
