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

export type SidebarTab = "overview" | "unit" | "market" | "division" | "region" | "raw";

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
        { id: "overview" as SidebarTab, label: "Overview", icon: LayoutDashboard },
      ]
    },
    {
      title: " Vaps Attach Rate By",
      items: [
        { id: "unit" as SidebarTab, label: "Unit", icon: BarChart3 },
        { id: "market" as SidebarTab, label: "Market and Unit", icon: PieChart },
        { id: "division" as SidebarTab, label: "Unit and Division", icon: Map },
        { id: "region" as SidebarTab, label: "Unit and Region", icon: Globe },
      ]
    },
    {
      title: "Data Explorer",
      items: [
        { id: "raw" as SidebarTab, label: "VAPS Details", icon: Database },
      ]
    }
  ];

  return (
    <TooltipProvider>
      <aside 
        className={cn(
          "h-full bg-[#00205b] border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 relative",
          isCollapsed ? "w-[68px]" : "w-[210px]"
        )}
      >
        {/* Toggle Collapse Button at the top */}
        <div className={cn("p-3 border-b border-white/10 flex", isCollapsed ? "justify-center" : "justify-end")}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-sm"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
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
