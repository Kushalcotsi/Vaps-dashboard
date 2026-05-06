import React from "react";
import { spacing } from "@/design-system/spacing";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(spacing.container, className)}>
      {children}
    </div>
  );
}
