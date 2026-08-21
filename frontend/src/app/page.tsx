"use client"

import { useMemo, useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchDashboardData, fetchUnitMarketDashboardData } from "@/lib/api"
import { useDashboardStore } from "@/store/useDashboardStore"
import { useUnitMarketStore } from "@/store/useUnitMarketStore"
import { UNIT_TYPES, MOCK_PRODUCT_CODES, getDynamicProductCodes } from "@/lib/mockProductCodes"
import DistributionBars from "@/components/DistributionBars"
import ElbowChart from "@/components/ElbowChart"
import RecommendationTable from "@/components/RecommendationTable"
import HeatmapTable from "@/components/HeatmapTable"
import IndustryAnalysisTable from "@/components/IndustryAnalysisTable"
import VapsDetailTable from "@/components/VapsDetailTable"
import UnitMarketTable from "@/components/UnitMarketTable"
import UnitMarketHeatmapTable from "@/components/UnitMarketHeatmapTable"
import UnitSummaryCard from "@/components/UnitSummaryCard"
import UnitMarketSummaryCard from "@/components/UnitMarketSummaryCard"
import UnitMarketDistributionBars from "@/components/UnitMarketDistributionBars"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar, SidebarTab } from "@/components/layout/Sidebar"
import { InlineSegmentedControl } from "@/components/ui/InlineSegmentedControl"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"
import { Loader2, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip"


export default function DashboardPage() {
  const { 
    unitType,
    selectedUnit, setSelectedUnit,
    selectedSource, setSelectedSource,
    selectedGroup, setSelectedGroup,
    activeTab, setActiveTab
  } = useDashboardStore()

  const {
    unitType: umUnitType,
    selectedUnit: umSelectedUnit,
    selectedMarket: umSelectedMarket,
  } = useUnitMarketStore()

  const isUM = activeTab.startsWith("um_");

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["dashboard", selectedUnit, unitType],
    queryFn: () => {
      return fetchDashboardData(selectedUnit);
    },
    enabled: !!selectedUnit && !isUM,
    staleTime: 600000, // Keep data fresh for 10 minutes
    gcTime: 1800000, // Keep in garbage collector cache for 30 minutes
    placeholderData: keepPreviousData,
  })

  const { data: umData, isLoading: umIsLoading, isFetching: umIsFetching } = useQuery({
    queryKey: ["um_dashboard", umSelectedUnit, umSelectedMarket],
    queryFn: () => {
      return fetchUnitMarketDashboardData(umSelectedUnit, umSelectedMarket);
    },
    enabled: !!umSelectedUnit && isUM,
    staleTime: 600000, // Keep data fresh for 10 minutes
    gcTime: 1800000, // Keep in garbage collector cache for 30 minutes
    placeholderData: keepPreviousData,
  })

  const filteredUmRecommendations = useMemo(() => {
    if (!umData?.latestRecommendations) return [];
    if (umSelectedUnit !== "all") return umData.latestRecommendations;
    const availableCodes = new Set<string>(umData.latestRecommendations.map((r: any) => r.unit));
    const { validCodesForType } = getDynamicProductCodes(umUnitType, availableCodes);
    const validSet = new Set(validCodesForType);
    return umData.latestRecommendations.filter((r: any) => validSet.has(r.unit));
  }, [umData?.latestRecommendations, umUnitType, umSelectedUnit]);

  // ONE-TIME O(N) extraction per render instead of calculating inside the filter loop (O(N^2) freeze)
  const validCodesSet = useMemo(() => {
    const availableCodes = new Set<string>((data?.unitRows || []).map((row: any) => row.unit));
    const { validCodesForType } = getDynamicProductCodes(unitType, availableCodes);
    return new Set(validCodesForType);
  }, [data?.unitRows, unitType]);

  const matchesFilters = (r: any) => {
    // If 'all' is selected, we MUST filter by the current Unit Type category
    const matchesType = selectedUnit !== "all" || validCodesSet.has(r.unit);
    const matchesSource = !selectedSource || r.source === selectedSource;
    const matchesGroup = !selectedGroup || r.mainGroup === selectedGroup;
    return matchesType && matchesSource && matchesGroup;
  };

  const filteredUnitRows = useMemo(() => {
    if (!data?.unitRows) return [];
    return data.unitRows.filter(matchesFilters);
  }, [data, selectedSource, selectedGroup, selectedUnit, validCodesSet]);

  const filteredRecommendationRows = useMemo(() => {
    if (!data?.recommendationRows) return [];
    return data.recommendationRows.filter(matchesFilters);
  }, [data, selectedSource, selectedGroup, selectedUnit, validCodesSet]);

  const filteredIndustryRecommendationRows = useMemo(() => {
    if (!data?.industryRecommendationRows) return [];
    return data.industryRecommendationRows.filter(matchesFilters);
  }, [data, selectedSource, selectedGroup, selectedUnit, validCodesSet]);

  const filteredSegments = useMemo(() => {
    if (!data?.segments) return {};
    const result: Record<string, any[]> = {};
    Object.entries(data.segments).forEach(([name, rows]) => {
      result[name] = (rows as any[]).filter(matchesFilters);
    });
    return result;
  }, [data, selectedSource, selectedGroup, selectedUnit, validCodesSet]);

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
  
  // Sub-view states for toggles
  const [unitSubView, setUnitSubView] = useState("recommendation"); // recommendation | industry
  const [marketSubView, setMarketSubView] = useState("heatmap"); // heatmap | table
  const [divisionSubView, setDivisionSubView] = useState("heatmap"); // heatmap | table
  const [regionSubView, setRegionSubView] = useState("heatmap"); // heatmap | table
  const [umRecommendationsSubView, setUmRecommendationsSubView] = useState("heatmap"); // heatmap | table

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
      const urlUnitType = params.get("unitType");
      if (urlUnitType && UNIT_TYPES.includes(urlUnitType)) {
        useDashboardStore.getState().setUnitType(urlUnitType);
      }

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
      setUmRecommendationsSubView(params.get("umRecommendationsSubView") || "heatmap");
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
    if (unitType && unitType !== "Glo") {
      params.set("unitType", unitType);
    }

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
    if (umRecommendationsSubView !== "heatmap") {
      params.set("umRecommendationsSubView", umRecommendationsSubView);
    }

    const searchStr = params.toString();
    const newUrl = searchStr ? `${window.location.pathname}?${searchStr}` : window.location.pathname;
    
    window.history.replaceState(null, '', newUrl);
  }, [
    isHydrated,
    activeTab,
    unitType,
    selectedUnit,
    selectedSource,
    selectedGroup,
    unitSubView,
    marketSubView,
    divisionSubView,
    regionSubView,
    umRecommendationsSubView
  ]);

  // Show a "Processing" indicator for background fetches
  const isSoftLoading = isUM ? (umIsFetching && !umIsLoading) : (isFetching && !isLoading);
  const showLoading = isUM ? (umIsLoading || umIsFetching) : (isLoading || isFetching);

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

  const renderUmOverview = () => {
    const recs = [...(filteredUmRecommendations || [])];
    const sortedByScore = [...recs].sort((a: any, b: any) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
    const sortedByMomentum = [...recs].sort((a: any, b: any) => (b.momentumScore || b.recommendationScore || 0) - (a.momentumScore || a.recommendationScore || 0));

    let topCore = sortedByScore
      .filter((r: any) => {
        const l = (r.recommendationLabel || "").toLowerCase();
        return l.includes("core") || (r.recommendationScore || 0) >= 0.25;
      })
      .slice(0, 5);
    if (topCore.length < 5 && sortedByScore.length > 0) {
      const added = new Set(topCore.map((r: any) => `${r.unit}-${r.market}-${r.productName}`));
      for (const r of sortedByScore) {
        const key = `${r.unit}-${r.market}-${r.productName}`;
        if (!added.has(key) && topCore.length < 5) {
          topCore.push(r);
          added.add(key);
        }
      }
    }

    let topEmerging = sortedByMomentum
      .filter((r: any) => {
        const l = (r.recommendationLabel || "").toLowerCase();
        return l.includes("emerg") || l.includes("white") || l.includes("opport") || (r.momentumScore || 0) > 1.0;
      })
      .slice(0, 5);
    if (topEmerging.length < 5 && sortedByMomentum.length > 0) {
      const added = new Set(topEmerging.map((r: any) => `${r.unit}-${r.market}-${r.productName}`));
      for (const r of sortedByMomentum) {
        const key = `${r.unit}-${r.market}-${r.productName}`;
        if (!added.has(key) && topEmerging.length < 5) {
          topEmerging.push(r);
          added.add(key);
        }
      }
    }

    const umDisplayData = umData ? {
      ...umData,
      latestRecommendations: filteredUmRecommendations
    } : null;

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <UnitMarketSummaryCard 
          data={umDisplayData} 
          selectedUnit={umSelectedUnit} 
          selectedMarket={umSelectedMarket} 
          isLoading={showLoading} 
        />

        <section>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <UnitMarketDistributionBars 
              isLoading={showLoading}
              title="Top 5 Core Recommendations" 
              type="core"
              data={topCore} 
            />
            <UnitMarketDistributionBars 
              isLoading={showLoading}
              title="Top 5 Emerging Opportunities" 
              type="emerging"
              data={topEmerging} 
            />
          </div>
        </section>
      </div>
    );
  };

  const renderUmRecommendations = () => (
    <div className="animate-in fade-in duration-300 space-y-3">
      <div className="flex flex-col gap-1 pb-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Unit Market Segment Recommendations</h2>
        </div>
        <div>
          <InlineSegmentedControl 
            size="sm"
            options={[
              { id: "heatmap", label: "Heat Map" },
              { id: "table", label: "Table View" }
            ]}
            value={umRecommendationsSubView}
            onChange={setUmRecommendationsSubView}
          />
        </div>
      </div>
      
      {umRecommendationsSubView === "heatmap" ? (
        <UnitMarketHeatmapTable isLoading={showLoading} data={filteredUmRecommendations} title="" />
      ) : (
        <UnitMarketTable isLoading={showLoading} data={filteredUmRecommendations} title="" />
      )}
    </div>
  );

  const renderUmRawData = () => (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1 pb-0">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">Market Segment Details (All)</h2>
      </div>
      <UnitMarketTable isLoading={showLoading} data={filteredUmRecommendations} title="" />
    </div>
  );

  return (
    <DashboardLayout sidebar={<Sidebar activeTab={activeTab as SidebarTab} onTabChange={setActiveTab as any} />}>
      <PageContainer className="px-8 py-6">
        <div className="relative">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "unit" && renderUnitAnalysis()}
          {activeTab === "market" && renderSegmentAnalysis("market", marketSubView, setMarketSubView)}
          {activeTab === "division" && renderSegmentAnalysis("division", divisionSubView, setDivisionSubView)}
          {activeTab === "region" && renderSegmentAnalysis("region", regionSubView, setRegionSubView)}
          {activeTab === "raw" && renderRawData()}
          {/* {activeTab === "um_overview" && renderUmOverview()}
          {activeTab === "um_recommendations" && renderUmRecommendations()}
          {activeTab === "um_raw" && renderUmRawData()} */}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
