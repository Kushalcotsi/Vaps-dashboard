import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ className, icon, ...props }: InputProps) {
  return (
    <div className="relative w-full group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full bg-slate-50 border border-slate-200 rounded-lg py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary",
          icon ? "pl-9 pr-3" : "px-3",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary appearance-none cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
