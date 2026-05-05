import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
  valueClassName?: string;
}

export default function KpiCard({ label, value, subValue, className, valueClassName }: KpiCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl p-5 flex flex-col gap-2 min-w-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
      className
    )}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-emerald-500/0 rounded-full blur-2xl" />
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none z-10">
        {label}
      </span>
      <div className="flex flex-col gap-1 z-10">
        <strong className={cn("text-3xl font-extrabold text-slate-900 tracking-tight", valueClassName)}>
          {value}
        </strong>
        {subValue && (
          <span className="text-xs text-slate-500 leading-none">
            {subValue}
          </span>
        )}
      </div>
    </div>
  )
}
