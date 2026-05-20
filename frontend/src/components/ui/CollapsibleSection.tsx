import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, description, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div 
        className={cn(
          "px-6 py-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50",
          isOpen && "border-b border-slate-100"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <button 
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
        >
          {isOpen ? "Hide Detailed Analysis" : "View Detailed Analysis"}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {isOpen && (
        <div className="p-6 bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
