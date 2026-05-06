import React from "react";
import { cn } from "@/lib/utils";
import { typography } from "@/design-system/typography";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-auto relative">
      <table className={cn("w-full border-separate border-spacing-0", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={cn("bg-slate-50 sticky top-0 z-20 shadow-sm", className)}>
      {children}
    </thead>
  );
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("hover:bg-slate-50/50 transition-colors group", className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className, isNum, onClick }: { children: React.ReactNode; className?: string; isNum?: boolean; onClick?: () => void }) {
  return (
    <th 
      onClick={onClick}
      className={cn(
      "border-b border-slate-200 px-4 py-3 bg-slate-50 text-left whitespace-nowrap",
      typography.tableHeader,
      isNum && "text-right",
      className
    )}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, isNum, isBold }: { children: React.ReactNode; className?: string; isNum?: boolean; isBold?: boolean }) {
  return (
    <td className={cn(
      "px-4 py-2.5 border-b border-slate-100",
      isBold ? typography.tableCellBold : typography.tableCell,
      isNum && "text-right tabular-nums",
      className
    )}>
      {children}
    </td>
  );
}
