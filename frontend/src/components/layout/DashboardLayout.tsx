import React from "react";
import { GlobalHeader } from "../GlobalHeader";
import { GlobalFilterBar } from "../GlobalFilterBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div className="relative h-screen flex bg-[#FAFAFA] overflow-hidden">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <GlobalHeader />
        <GlobalFilterBar />
        <main className="flex-1 overflow-y-auto pb-2">
          {children}
        </main>
      </div>
    </div>
  );
}


