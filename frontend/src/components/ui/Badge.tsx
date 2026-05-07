import React from "react";
import { cn } from "@/lib/utils";
import { typography } from "@/design-system/typography";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-slate-200 text-slate-800 border-slate-300",
    success: "bg-emerald-600 text-white border-emerald-700",
    warning: "bg-amber-500 text-white border-amber-600",
    destructive: "bg-rose-600 text-white border-rose-700",
    info: "bg-blue-600 text-white border-blue-700",
    outline: "bg-transparent text-slate-600 border-slate-300",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
