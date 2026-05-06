import { BrandLogo } from "./BrandLogo";

export function GlobalHeader() {
  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <BrandLogo className="h-10 w-auto" />
          <div className="hidden md:block h-6 w-px bg-slate-200" />
          <h1 className="hidden md:block text-sm font-semibold text-slate-800 uppercase tracking-widest">
            Guided Selling Dashboard
          </h1>
        </div>
        
        {/* Navigation or User Profile could go here in the future */}
        {/* <div className="flex items-center gap-4">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
             Analytical Intelligence v2.0
           </span>
        </div> */}
      </div>
    </header>
  );
}
