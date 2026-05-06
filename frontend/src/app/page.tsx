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
  const { selectedUnit, selectedSource, selectedGroup, searchQuery } = useDashboardStore()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["dashboard", selectedUnit],
    queryFn: () => fetchDashboardData(selectedUnit),
    enabled: !!selectedUnit,
    staleTime: 30000, // Keep data fresh for 30s
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
  const [segmentTab, setSegmentTab] = useState("Market");
  const [rawTab, setRawTab] = useState("Unit");

  // Show a "Processing" indicator for background fetches
  const isSoftLoading = isFetching && !isLoading;

  return (
    <DashboardLayout>
      <PageContainer className={spacing.section}>
        
        {/* Persistent Control Plane */}
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
          summary={data?.summary ? { ...data.summary, uniqueVapsCount: data.unitRows.length } : null} 
        />

        {/* Workspace Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8 relative overflow-hidden">
          {/* Content Loading Overlay (Soft) */}
          {isSoftLoading && (
            <div className="absolute inset-0 bg-slate-50/10 backdrop-blur-[1px] z-10 transition-all duration-300 pointer-events-none" />
          )}

          <Tabs>
            <TabsList>
              <TabsTrigger active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Executive Overview</TabsTrigger>
              <TabsTrigger active={activeTab === "recommendation"} onClick={() => setActiveTab("recommendation")}>Recommendation Engine</TabsTrigger>
              <TabsTrigger active={activeTab === "segments"} onClick={() => setActiveTab("segments")}>Segment Intelligence</TabsTrigger>
              <TabsTrigger active={activeTab === "raw"} onClick={() => setActiveTab("raw")}>Raw VAPS Detail</TabsTrigger>
            </TabsList>

            {/* Tab 1: Overview */}
            <TabsContent active={activeTab === "overview"}>
              <div className="space-y-8 mt-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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

            {/* Tab 2: Recommendation Engine */}
            <TabsContent active={activeTab === "recommendation"}>
              <div className="mt-4">
                <RecommendationTable isLoading={isLoading} data={filteredUnitRows} />
              </div>
            </TabsContent>

            {/* Tab 3: Segment Intelligence */}
            <TabsContent active={activeTab === "segments"}>
              <div className="mt-4 flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  {["Market", "Division", "Region"].map(name => (
                    <button 
                      key={name}
                      onClick={() => setSegmentTab(name)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${segmentTab === name ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {name} Heatmap
                    </button>
                  ))}
                  <button 
                    onClick={() => setSegmentTab("Industry")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${segmentTab === "Industry" ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    Industry Comparison
                  </button>
                </div>

                {segmentTab !== "Industry" && (
                  <HeatmapTable 
                    isLoading={isLoading}
                    title={`${segmentTab} Segment Heatmap`} 
                    data={filteredSegments[segmentTab] || []} 
                    segmentName={segmentTab.toLowerCase()}
                    cutoff={data?.summary?.cutoff || 0.05}
                  />
                )}
                
                {segmentTab === "Industry" && (
                  <IndustryAnalysisTable isLoading={isLoading} marketRows={filteredSegments["Market"] || []} />
                )}
              </div>
            </TabsContent>

            {/* Tab 4: Raw VAPS Detail */}
            <TabsContent active={activeTab === "raw"}>
              <div className="mt-4 flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <button 
                    onClick={() => setRawTab("Unit")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${rawTab === "Unit" ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    Unit Level
                  </button>
                  {["Market", "Division", "Region"].map(name => (
                    <button 
                      key={name}
                      onClick={() => setRawTab(name)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${rawTab === name ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {name} Segment
                    </button>
                  ))}
                </div>

                {rawTab === "Unit" && (
                  <VapsDetailTable 
                    isLoading={isLoading}
                    title="Unit-Level VAPS Detail" 
                    data={filteredUnitRows} 
                    columns={detailColumns.unit} 
                  />
                )}

                {rawTab !== "Unit" && (
                  <VapsDetailTable 
                    isLoading={isLoading}
                    title={`${rawTab} Segment VAPS Detail`} 
                    data={filteredSegments[rawTab] || []} 
                    columns={detailColumns.segment(rawTab.toLowerCase())} 
                  />
                )}
              </div>
            </TabsContent>
            
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
