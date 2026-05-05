"use client"

import { useMemo } from "react"
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

interface ElbowChartProps {
  data: VapsAttachRate[];
  cutoff: number;
}

export default function ElbowChart({ data, cutoff }: ElbowChartProps) {
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

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[400px] mt-4 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <p className="text-slate-400 text-sm">No attachment data available for this selection</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="index" 
            hide 
          />
          <YAxis 
            tickFormatter={(value) => `${value}%`}
            fontSize={12}
            tick={{ fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip 
            formatter={(value: unknown) => [typeof value === 'number' ? `${value.toFixed(1)}%` : String(value), "Attach Rate"]}
            labelFormatter={(index) => chartData[index as number]?.name}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            stroke="#0d9488" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRate)" 
            animationDuration={1500}
          />
          <ReferenceLine 
            y={cutoff * 100} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            label={{ 
              value: `Cutoff: ${(cutoff * 100).toFixed(1)}%`, 
              position: 'insideBottomRight', 
              fill: '#ef4444',
              fontSize: 12,
              fontWeight: '700',
              offset: 10
            }} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
