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
import { ArrowUpDown, Search, Download } from "lucide-react"

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
      cell: info => <span className="font-mono text-[10px] font-semibold text-slate-800 bg-slate-100/50 px-1.5 py-0.5 rounded border border-slate-200">{info.getValue()}</span>,
    }),
    columnHelper.accessor("vapsDesc", {
      header: "VAPS description",
      cell: info => <span className="font-semibold text-slate-700 line-clamp-1" title={info.getValue()}>{info.getValue()}</span>,
    }),
    columnHelper.accessor("recommendationKind" as any, {
      header: "Recommendation logic",
      cell: info => <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{info.getValue() || "Fixed quantity"}</span>,
    }),
    columnHelper.accessor("recommendationValue" as any, {
      header: "Recommendation value",
      cell: info => <span className="text-[11px] font-medium text-slate-500 italic truncate block max-w-[120px]">{info.getValue() || "0"}</span>,
    }),
    columnHelper.accessor("coveredText" as any, {
      header: "Covered",
      cell: info => <span className="text-[11px] font-medium text-slate-500">{info.getValue() || "No"}</span>,
    }),
    columnHelper.accessor("activations", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase">
          Unit activations <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-semibold text-slate-600">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor("associated", {
      header: "VAPS associated",
      cell: info => <span className="tabular-nums font-semibold text-slate-600">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor("attachRate", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase">
          Attach rate <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-bold text-slate-900">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("elbowCutoff" as any, {
      header: "Unit cutoff",
      cell: info => <span className="tabular-nums font-medium text-slate-400">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("decision", {
      header: "Decision",
      cell: info => {
        const val = info.getValue() || "No Action";
        return (
          <span className={cn(
            "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit border",
            val.startsWith("Keep") && "bg-[#e7f4ef] text-[#00d27a] border-[#00d27a]/20",
            val === "Add" && "bg-[#e8f1fb] text-[#2c7be5] border-[#2c7be5]/20",
            val === "Review Removal" && "bg-[#fdecec] text-[#e63757] border-[#e63757]/20",
            val === "Monitor" && "bg-[#fff2d6] text-[#f6c344] border-[#f6c344]/20",
            val === "No Action" && "bg-slate-50 text-slate-500 border-slate-200"
          )}>
            {val}
          </span>
        )
      },
    }),
    columnHelper.accessor("decisionReason", {
      header: "Reason",
      cell: info => <span className="text-[11px] font-medium text-slate-500 leading-tight block max-w-[200px]">{info.getValue()}</span>,
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Recommendation Sheet Comparison</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="FILTER VAPS ID"
              className="bg-white border border-slate-200 rounded-md pl-9 pr-4 py-1.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
            />
          </div>
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest">
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[600px] relative">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap border-b border-slate-200 bg-slate-50">
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
                  <td key={cell.id} className="px-4 py-2.5 whitespace-nowrap lg:whitespace-normal text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
