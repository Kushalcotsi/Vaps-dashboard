import React from "react";
import { cn } from "@/lib/utils";
import { LayoutGrid, Table2, SlidersHorizontal, Building2 } from "lucide-react";

interface Option {
  id: string;
  label: string;
}

interface InlineSegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heatmap: LayoutGrid,
  table: Table2,
  recommendation: SlidersHorizontal,
  industry: Building2
};

export function InlineSegmentedControl({ options, value, onChange, size = "md" }: InlineSegmentedControlProps) {
  const isSm = size === "sm";
  return (
    <div className={cn(
      "flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 w-fit items-center h-[34px]"
    )}>
      {options.map((opt) => {
        const isActive = value === opt.id;
        const Icon = iconMap[opt.id];
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 h-full rounded-md text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap",
              isActive 
                ? "bg-[#00205B] text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
            )}
          >
            {Icon && <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-400")} />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
