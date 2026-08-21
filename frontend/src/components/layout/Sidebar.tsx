import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Map, 
  Globe, 
  Database,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";
import { BrandLogo } from "../BrandLogo";

export type SidebarTab = "overview" | "unit" | "market" | "division" | "region" | "raw" | "um_overview" | "um_recommendations" | "um_raw";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups = [
    {
      title: "Summary",
      items: [
        { id: "overview" as SidebarTab, label: "VAPS Overview", icon: LayoutDashboard },
      ]
    },
    {
      title: "Vaps Attach Rate By",
      items: [
        { id: "unit" as SidebarTab, label: "Vaps", icon: BarChart3 },
        { id: "market" as SidebarTab, label: "Market and Vaps", icon: PieChart },
        { id: "division" as SidebarTab, label: "Vaps and Division", icon: Map },
        { id: "region" as SidebarTab, label: "Vaps and Region", icon: Globe },
      ]
    },
    {
      title: "Data Explorer",
      items: [
        { id: "raw" as SidebarTab, label: "VAPS Details", icon: Database },
      ]
    },
    // {
    //   title: "Unit Market Segment",
    //   items: [
    //     { id: "um_overview" as SidebarTab, label: "Segment Overview", icon: LayoutDashboard },
    //     { id: "um_recommendations" as SidebarTab, label: "Recommendations", icon: BarChart3 },
    //     { id: "um_raw" as SidebarTab, label: "Market Segment Details", icon: Database },
    //   ]
    // }
  ];

  return (
    <TooltipProvider>
      <aside 
        className={cn(
          "h-full bg-[#00205b] border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 relative z-50",
          isCollapsed ? "w-[68px]" : "w-[210px]"
        )}
      >
        {/* Floating Toggle Collapse Button centered on border line */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-[44px] -right-3 z-50 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow hover:scale-105 flex items-center justify-center text-[#00205b] hover:text-[#003399] hover:bg-slate-50 transition-all cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
        </button>

        {/* Sidebar Brand Header */}
        <div className={cn(
          "h-14 flex items-center border-b border-white/10 shrink-0 select-none overflow-hidden justify-center",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {!isCollapsed ? (
            <BrandLogo className="h-10 w-auto" logoColor="#ffffff" />
          ) : (
            <BrandLogo className="h-5 w-auto mx-auto" logoColor="#ffffff" />
          )}
        </div>

        <div className="flex-grow overflow-y-auto py-4 px-3 space-y-4">

          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-1.5 truncate">
                  {group.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  
                  const buttonEl = (
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all group",
                        isCollapsed ? "justify-center p-2" : "px-2.5 py-1.5",
                        isActive 
                          ? "bg-white/10 text-white" 
                          : "text-white/100 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon 
                        size={16} 
                        className={cn(
                          "transition-colors shrink-0",
                          isActive ? "text-white" : "text-white/100 group-hover:text-white"
                        )} 
                      />
                      {!isCollapsed && <span className="truncate text-xs">{item.label}</span>}
                      {isActive && !isCollapsed && (
                        <ChevronRight size={14} className="ml-auto text-white/50 shrink-0" />
                      )}
                    </button>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.id} delayDuration={50}>
                        <TooltipTrigger asChild>
                          {buttonEl}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-semibold text-xs bg-slate-900 border-slate-800 text-white">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.id}>{buttonEl}</React.Fragment>;
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </TooltipProvider>
  );
}
