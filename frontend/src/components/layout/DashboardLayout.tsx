import React from "react";
import { GlobalHeader } from "../GlobalHeader";
import { spacing } from "@/design-system/spacing";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <GlobalHeader />
      <main className="flex-1 py-4 md:py-6">
        {children}
      </main>
      
      {/* Footer could be added here if needed */}
    </div>
  );
}
