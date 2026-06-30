"use client"

import { useMemo, useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchDashboardData } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import DistributionBars from "@/components/DistributionBars"
import ElbowChart from "@/components/ElbowChart"
import RecommendationTable from "@/components/RecommendationTable"
import HeatmapTable from "@/components/HeatmapTable"
import IndustryAnalysisTable from "@/components/IndustryAnalysisTable"
import VapsDetailTable from "@/components/VapsDetailTable"
import UnitSummaryCard from "@/components/UnitSummaryCard"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar, SidebarTab } from "@/components/layout/Sidebar"
import { InlineSegmentedControl } from "@/components/ui/InlineSegmentedControl"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"
import { Loader2, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip"


export default function DashboardPage() {
  const { 
    selectedUnit, setSelectedUnit,
    selectedSource, setSelectedSource,
    selectedGroup, setSelectedGroup
  } = useDashboardStore()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["dashboard", selectedUnit],
    queryFn: () => fetchDashboardData(selectedUnit),
    enabled: !!selectedUnit,
    staleTime: 30000, // Keep data fresh for 30s
    placeholderData: keepPreviousData,
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
      { key: "vapsDesc", label: "VAPS description", fmt: (v: string) => v || "Unmapped" },
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
      { key: "vapsDesc", label: "VAPS description", fmt: (v: string) => v || "Unmapped" },
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

  const [activeTab, setActiveTab] = useState<SidebarTab>("overview");
  
  // Sub-view states for toggles
  const [unitSubView, setUnitSubView] = useState("recommendation"); // recommendation | industry
  const [marketSubView, setMarketSubView] = useState("heatmap"); // heatmap | table
  const [divisionSubView, setDivisionSubView] = useState("heatmap"); // heatmap | table
  const [regionSubView, setRegionSubView] = useState("heatmap"); // heatmap | table

  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate state from URL on initial mount and browser back/forward (popstate) navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hydrateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      
      // Tab
      const urlTab = params.get("tab");
      setActiveTab((urlTab as SidebarTab) || "overview");
      
      // Global filters
      const urlUnit = params.get("unit");
      setSelectedUnit(urlUnit === null || urlUnit === "all" ? "all" : urlUnit);
      
      const urlSource = params.get("source");
      setSelectedSource(urlSource || "");
      
      const urlGroup = params.get("group");
      setSelectedGroup(urlGroup || "");
      
      // Sub-view toggles
      setUnitSubView(params.get("unitSubView") || "recommendation");
      setMarketSubView(params.get("marketSubView") || "heatmap");
      setDivisionSubView(params.get("divisionSubView") || "heatmap");
      setRegionSubView(params.get("regionSubView") || "heatmap");
    };

    hydrateFromUrl();
    setIsHydrated(true);

    window.addEventListener("popstate", hydrateFromUrl);
    return () => {
      window.removeEventListener("popstate", hydrateFromUrl);
    };
  }, [setSelectedUnit, setSelectedSource, setSelectedGroup]);

  // 2. Synchronize store/React state changes to URL query parameters
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    const params = new URLSearchParams();
    
    // Sidebar active tab
    if (activeTab !== "overview") {
      params.set("tab", activeTab);
    }
    
    // Global filters
    if (selectedUnit && selectedUnit !== "all") {
      params.set("unit", selectedUnit);
    }
    
    if (selectedSource && selectedSource !== "") {
      params.set("source", selectedSource);
    }
    
    if (selectedGroup && selectedGroup !== "") {
      params.set("group", selectedGroup);
    }
    
    // Subviews
    if (unitSubView !== "recommendation") {
      params.set("unitSubView", unitSubView);
    }
    if (marketSubView !== "heatmap") {
      params.set("marketSubView", marketSubView);
    }
    if (divisionSubView !== "heatmap") {
      params.set("divisionSubView", divisionSubView);
    }
    if (regionSubView !== "heatmap") {
      params.set("regionSubView", regionSubView);
    }

    const searchStr = params.toString();
    const newUrl = searchStr ? `${window.location.pathname}?${searchStr}` : window.location.pathname;
    
    window.history.replaceState(null, '', newUrl);
  }, [
    isHydrated,
    activeTab,
    selectedUnit,
    selectedSource,
    selectedGroup,
    unitSubView,
    marketSubView,
    divisionSubView,
    regionSubView
  ]);

  // Show a "Processing" indicator for background fetches
  const isSoftLoading = isFetching && !isLoading;
  const showLoading = isLoading || isFetching;

  const renderOverview = () => {
    const handleScrollToElbow = () => {
      const element = document.getElementById("elbow-chart-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <UnitSummaryCard 
          summary={dynamicSummary} 
          isLoading={showLoading} 
          onCutoffClick={handleScrollToElbow} 
        />

        <section>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <DistributionBars 
              isLoading={showLoading}
              title="Top 5 Recommended VAPS Attach Rates" 
              data={filteredUnitRows.filter(r => r.coveredByRecommendationLogic).sort((a,b)=>b.attachRate-a.attachRate).slice(0,5)} 
              cutoff={data?.summary?.cutoff || 0} 
            />
            <DistributionBars 
              isLoading={showLoading}
              title="Top 5 Missed Opportunity Rate" 
              data={filteredUnitRows.filter(r => !r.coveredByRecommendationLogic && r.attachRate >= (data?.summary?.cutoff || 0)).sort((a,b)=>b.attachRate-a.attachRate).slice(0,5)} 
              cutoff={data?.summary?.cutoff || 0} 
            />
          </div>
        </section>

        <section id="elbow-chart-section">
          <ElbowChart isLoading={showLoading} data={filteredUnitRows} cutoff={data?.summary?.cutoff || 0.05} />
        </section>
      </div>
    );
  };


  const renderUnitAnalysis = () => (
    <div className="animate-in fade-in duration-300 space-y-3">
      <div className="flex flex-col gap-1 pb-0">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">VAPS Attach Rate by Unit</h2>
        <div>
          <InlineSegmentedControl 
            size="sm"
            options={[
              { id: "recommendation", label: "Recommendation" },
              { id: "industry", label: "Industry" }
            ]}
            value={unitSubView}
            onChange={setUnitSubView}
          />
        </div>
      </div>

      {unitSubView === "recommendation" ? (
        <RecommendationTable 
          isLoading={showLoading} 
          data={filteredRecommendationRows} 
          title=""
        />
      ) : (
        <IndustryAnalysisTable 
          isLoading={showLoading} 
          marketRows={filteredIndustryRecommendationRows} 
          title=""
        />
      )}
    </div>
  );

  const renderSegmentAnalysis = (type: "market" | "division" | "region", subView: string, setSubView: (v: string) => void) => {
    const titles = {
      market: "VAPS Attach Rate by Market and Unit",
      division: "VAPS Attach Rate by Unit and Division",
      region: "VAPS Attach Rate by Unit and Region"
    };

    const segmentKey = type.charAt(0).toUpperCase() + type.slice(1);
    const segmentData = filteredSegments[segmentKey] || [];
    
    // Calculate maxRate for heatmap tooltip if heatmap is selected
    const maxRate = segmentData.length > 0 ? Math.max(...segmentData.map(r => r.attachRate || 0), 0) : 0;
    const fmtPct = (val?: number) => (val === null || val === undefined) ? "0.0%" : `${(val * 100).toFixed(1)}%`;

    return (
      <div className="animate-in fade-in duration-300 space-y-3">
        <div className="flex flex-col gap-1 pb-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">{titles[type]}</h2>
            {subView === "heatmap" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 hover:text-primary transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs whitespace-pre-wrap text-xs">
                  {`Segment heatmap logic\n\nColoring: intensity matches attach rate relative to the maximum observed (${fmtPct(maxRate)}).\nSignals: industry signal logic is applied at the segment level.\n\nClick a cell to highlight related data across the workspace.`}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div>
            <InlineSegmentedControl 
              size="sm"
              options={[
                { id: "heatmap", label: "Heatmap" },
                { id: "table", label: "Table" }
              ]}
              value={subView}
              onChange={setSubView}
            />
          </div>
        </div>

        {subView === "heatmap" ? (
          <HeatmapTable 
            isLoading={showLoading}
            title="" 
            data={segmentData} 
            segmentName={type} 
            cutoff={data?.summary?.cutoff || 0.05} 
          />
        ) : (
          <VapsDetailTable 
            isLoading={showLoading} 
            title="" 
            columns={detailColumns.segment(type)} 
            data={segmentData} 
          />
        )}
      </div>
    );
  };

  const renderRawData = () => (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1 pb-0">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">Unit-Level VAPS Detail</h2>
      </div>
      <VapsDetailTable isLoading={showLoading} title="" columns={detailColumns.unit} data={filteredUnitRows} />
    </div>
  );



  return (
    <DashboardLayout sidebar={<Sidebar activeTab={activeTab} onTabChange={setActiveTab} />}>
      <PageContainer className="px-8 py-6">
        <div className="relative">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "unit" && renderUnitAnalysis()}
          {activeTab === "market" && renderSegmentAnalysis("market", marketSubView, setMarketSubView)}
          {activeTab === "division" && renderSegmentAnalysis("division", divisionSubView, setDivisionSubView)}
          {activeTab === "region" && renderSegmentAnalysis("region", regionSubView, setRegionSubView)}
          {activeTab === "raw" && renderRawData()}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
