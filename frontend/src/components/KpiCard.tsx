import { cn } from "@/lib/utils"
import { Card, CardContent } from "./ui/Card"
import { typography } from "@/design-system/typography"

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
  valueClassName?: string;
}

export default function KpiCard({ label, value, subValue, className, valueClassName }: KpiCardProps) {
  return (
    <Card className={cn("hover:translate-y-[-2px] transition-transform", className)}>
      <CardContent className="flex flex-col gap-2">
        <span className={typography.label}>
          {label}
        </span>
        <div className="flex flex-col gap-1">
          <strong className={cn("text-2xl font-bold text-slate-900 tracking-tight", valueClassName)}>
            {value}
          </strong>
          {subValue && (
            <span className="text-xs text-slate-500 font-medium">
              {subValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
