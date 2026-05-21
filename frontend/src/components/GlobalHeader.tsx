import React from "react";

export function GlobalHeader() {
  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm shrink-0">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 shrink-0">
          <h1 className="text-sm font-semibold text-slate-800 tracking-tight">
            Guided Selling: VAPS Recommendation for Office Space | Single Wide
          </h1>
        </div>
      </div>
    </header>
  );
}


