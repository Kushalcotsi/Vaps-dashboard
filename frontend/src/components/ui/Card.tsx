import React from "react";
import { cn } from "@/lib/utils";
import { shadows } from "@/design-system/shadows";
import { spacing } from "@/design-system/spacing";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-xl",
      shadows.card,
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("p-4 md:p-6 border-b border-slate-100 bg-slate-50/30", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn(spacing.card, className)}>
      {children}
    </div>
  );
}
