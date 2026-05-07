"use client"

import { useMemo, useState, useEffect } from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"
import { VapsAttachRate } from "@/types"
import { Card, CardHeader, CardContent } from "./ui/Card"
import { typography } from "@/design-system/typography"
import { colors } from "@/design-system/colors"
import { Skeleton } from "./ui/Skeleton"

interface ElbowChartProps {
  data: VapsAttachRate[];
  cutoff: number;
  isLoading?: boolean;
}

export default function ElbowChart({ data, cutoff, isLoading }: ElbowChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    return data
      .filter(r => r.attachRate > 0)
      .sort((a, b) => b.attachRate - a.attachRate)
      .map((r, index) => ({
        name: r.vapsDesc,
        rate: r.attachRate * 100,
        index: index
      }));
  }, [data]);

  if (isLoading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <h2 className={typography.sectionTitle}>Geometric Elbow Distribution</h2>
        </CardHeader>
        <CardContent className="h-[450px] flex flex-col gap-4">
           <div className="flex-1 w-full bg-slate-50/50 rounded-xl relative overflow-hidden">
             <Skeleton className="absolute inset-0" />
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recalculating Distribution...</span>
             </div>
           </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-slate-400 text-sm italic">No attachment data available for this selection</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className={typography.sectionTitle}>Geometric Elbow Distribution</h2>
      </CardHeader>
      <CardContent className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="index" 
              hide 
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              fontSize={11}
              tick={{ fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip 
              formatter={(value: unknown) => [typeof value === 'number' ? `${value.toFixed(1)}%` : String(value), "Attach Rate"]}
              labelFormatter={(index) => chartData[index as number]?.name}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                padding: '12px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke={colors.primary} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRate)" 
              animationDuration={1500}
            />
            <ReferenceLine 
              y={cutoff * 100} 
              stroke={colors.destructive} 
              strokeDasharray="5 5" 
              strokeWidth={1.5}
              label={{ 
                value: `Cutoff: ${(cutoff * 100).toFixed(1)}%`, 
                position: 'insideBottomRight', 
                fill: colors.destructive,
                fontSize: 10,
                fontWeight: '600',
                offset: 10
              }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
