import React from "react";
import { cn } from "@/lib/utils";
import { typography } from "@/design-system/typography";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-auto relative max-h-[85vh] border-t border-slate-100 scrollbar-gutter-stable rounded-b-xl bg-white">
      <table className={cn("w-full border-separate border-spacing-0 table-auto", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={cn("bg-slate-50 sticky top-0 z-40 shadow-sm", className)}>
      {children}
    </thead>
  );
}

export function TableRow({ children, className, isHighlighted }: { children: React.ReactNode; className?: string; isHighlighted?: boolean }) {
  return (
    <tr className={cn(
      "relative transition-colors group",
      "hover:bg-slate-50/50",
      // Row highlight overlay - z-10 ensures it's above base but below content
      isHighlighted && "after:absolute after:inset-0 after:bg-primary/[0.04] after:pointer-events-none after:z-10",
      className
    )}>
      {children}
    </tr>
  );
}

export function TableHead({ 
  children, 
  className, 
  isNum, 
  onClick, 
  isHighlighted, 
  style 
}: { 
  children: React.ReactNode; 
  className?: string; 
  isNum?: boolean; 
  onClick?: () => void; 
  isHighlighted?: boolean; 
  style?: React.CSSProperties 
}) {
  return (
    <th 
      onClick={onClick}
      style={style}
      className={cn(
        "relative border-b border-slate-200 px-6 py-5 bg-slate-50 text-left transition-colors leading-relaxed align-bottom overflow-hidden",
        typography.tableHeader,
        isNum && "text-right",
        // Column head highlight - z-10
        isHighlighted && "text-primary after:absolute after:inset-0 after:bg-primary/[0.06] after:pointer-events-none after:z-10",
        className
      )}
    >
      <span className="relative z-20">{children}</span>
    </th>
  );
}

export function TableCell({ 
  children, 
  className, 
  isNum, 
  isBold, 
  isHighlighted,
  onClick,
  colSpan
}: { 
  children: React.ReactNode; 
  className?: string; 
  isNum?: boolean; 
  isBold?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  colSpan?: number;
}) {
  return (
    <td 
      onClick={onClick}
      colSpan={colSpan}
      className={cn(
        "relative px-6 py-4 border-b border-slate-100 transition-colors cursor-pointer align-middle h-14 overflow-hidden",
        isBold ? typography.tableCellBold : typography.tableCell,
        isNum && "text-right tabular-nums",
        // Cell/Column highlight overlay - z-10
        isHighlighted && "after:absolute after:inset-0 after:bg-primary/[0.04] after:pointer-events-none after:z-10",
        className
      )}
    >
      <div className="relative z-20 w-full h-full flex items-center">
        {children}
      </div>
    </td>
  );
}
