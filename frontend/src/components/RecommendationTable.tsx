"use client"

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { VapsAttachRate } from "@/types"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Info, CheckCircle2, AlertCircle, Clock, Search, Download } from "lucide-react"

const columnHelper = createColumnHelper<VapsAttachRate>()

interface RecommendationTableProps {
  data: VapsAttachRate[];
}

export default function RecommendationTable({ data }: RecommendationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = useMemo(() => [
    columnHelper.accessor("vaps", {
      header: "VAPS",
      cell: info => <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{info.getValue()}</span>,
    }),
    columnHelper.accessor("vapsDesc", {
      header: "Description",
      cell: info => <span className="font-bold text-slate-800 line-clamp-1" title={info.getValue()}>{info.getValue()}</span>,
    }),
    columnHelper.accessor("recommendationKind", {
      header: "Logic Kind",
      cell: info => <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{info.getValue()}</span>,
    }),
    columnHelper.accessor("recommendationValue", {
      header: "Ref Value",
      cell: info => <span className="text-xs text-slate-500 italic max-w-[120px] truncate block" title={info.getValue()}>{info.getValue() || "---"}</span>,
    }),
    columnHelper.accessor("activations", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
          VOL <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-bold text-slate-600">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor("attachRate", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
          RATE <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-black text-slate-900">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("decision", {
      header: "Decision",
      cell: info => {
        const val = info.getValue();
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-sm border",
            val.startsWith("Keep") && "bg-emerald-50 text-emerald-700 border-emerald-200",
            val === "Add" && "bg-blue-50 text-blue-700 border-blue-200",
            val === "Review Removal" && "bg-rose-50 text-rose-700 border-rose-200",
            val === "Monitor" && "bg-amber-50 text-amber-700 border-amber-200",
            val === "No Action" && "bg-slate-50 text-slate-500 border-slate-200"
          )}>
            {val.startsWith("Keep") && <CheckCircle2 size={10} />}
            {val === "Add" && <AlertCircle size={10} />}
            {val === "Review Removal" && <AlertCircle size={10} />}
            {val === "Monitor" && <Clock size={10} />}
            {val}
          </span>
        )
      },
    }),
    columnHelper.accessor("decisionReason", {
      header: "Rationale",
      cell: info => {
          const row = info.row.original;
          const tooltip = [
              `Recommendation Logic: ${row.recommendationKind}`,
              `Covered in Reference: ${row.coveredText}`,
              `Base Cutoff: ${((row.elbowCutoff || 0) * 100).toFixed(1)}%`,
              `Performance Value: ${row.recommendationValue || "None"}`
          ].join('\n');
          return (
              <div className="flex items-start gap-2 group cursor-help" title={tooltip}>
                <span className="text-[11px] font-medium text-slate-500 leading-snug line-clamp-2">
                    {info.getValue()}
                </span>
                <Info size={12} className="text-slate-300 group-hover:text-teal-400 mt-0.5 shrink-0 transition-colors" />
              </div>
          )
      },
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recommendation Sheet Comparison</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Business Logic & Performance Gap Analysis</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => {
              const headers = ["VAPS", "Description", "Logic Kind", "Ref Value", "Activations", "Attach Rate", "Decision", "Rationale"];
              const rows = data.map(r => [
                r.vaps,
                `"${r.vapsDesc.replace(/"/g, '""')}"`,
                r.recommendationKind,
                `"${(r.recommendationValue || "").toString().replace(/"/g, '""')}"`,
                r.activations,
                (r.attachRate * 100).toFixed(2) + "%",
                r.decision,
                `"${r.decisionReason.replace(/"/g, '""')}"`
              ]);
              const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.setAttribute("download", `VAPS_Analysis_${data[0]?.unit || 'Export'}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
          >
            <Download size={14} className="opacity-70" />
            Download CSV
          </button>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
            <input 
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Filter by VAPS ID or Description..."
              className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="text-left px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-3 text-sm text-slate-700 whitespace-nowrap lg:whitespace-normal">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
