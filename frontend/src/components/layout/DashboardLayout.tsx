import React from "react";
import { GlobalHeader } from "../GlobalHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div className="relative h-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-y-auto pb-2">
          {children}
        </main>
      </div>
    </div>
  );
}
