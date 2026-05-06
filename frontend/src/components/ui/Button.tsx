import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-[#00205B] text-white hover:bg-[#00153D] shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-bold",
    md: "px-4 py-2 text-sm font-bold",
    lg: "px-6 py-3 text-base font-bold",
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
