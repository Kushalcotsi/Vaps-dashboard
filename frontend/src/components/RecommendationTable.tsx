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
import { ArrowUpDown, Search, Download, Filter } from "lucide-react"
import { Card, CardHeader, CardContent } from "./ui/Card"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"
import { Input, Select } from "./ui/Input"
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims"
import { typography } from "@/design-system/typography"
import { Skeleton } from "./ui/Skeleton"

const columnHelper = createColumnHelper<VapsAttachRate>()

interface RecommendationTableProps {
  data: VapsAttachRate[];
  isLoading?: boolean;
}

export default function RecommendationTable({ data, isLoading }: RecommendationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedColId, setSelectedColId] = useState<string | null>(null)

  // Local filters
  const [marketFilter, setMarketFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [recFilter, setRecFilter] = useState("")
  const [tierFilter, setTierFilter] = useState("")
  const [minAttach, setMinAttach] = useState("0")

  const markets = useMemo(() => Array.from(new Set(data.map(r => r.market).filter(Boolean))).sort(), [data])
  const tiers = useMemo(() => Array.from(new Set(data.map(r => r.tier).filter(Boolean))).sort(), [data])

  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (marketFilter && r.market !== marketFilter) return false;
      if (statusFilter && r.cutoffStatus !== statusFilter) return false;
      if (actionFilter && r.decision !== actionFilter) return false;
      if (recFilter && r.coveredText !== recFilter) return false;
      if (tierFilter && r.tier !== tierFilter) return false;
      if (parseFloat(minAttach) > 0 && (r.attachRate * 100) < parseFloat(minAttach)) return false;
      return true;
    });
  }, [data, marketFilter, statusFilter, actionFilter, recFilter, tierFilter, minAttach]);

  const columns = useMemo(() => [
    columnHelper.accessor("vaps", {
      header: "VAPS",
      cell: info => <span className={cn(typography.mono, "text-slate-800 bg-slate-100/50 px-1.5 py-0.5 rounded border border-slate-200")}>{info.getValue()}</span>,
    }),
    columnHelper.accessor("vapsDesc", {
      header: "VAPS description",
      cell: info => <span className="font-semibold text-slate-700 leading-normal block min-w-[200px]">{info.getValue()}</span>,
    }),
    columnHelper.accessor("recommendationKind" as any, {
      header: "Recommendation logic",
      cell: info => <span className={typography.label}>{info.getValue() || "Fixed quantity"}</span>,
    }),
    columnHelper.accessor("recommendationValue" as any, {
      header: "Recommendation value",
      cell: info => <span className="text-xs font-medium text-slate-500 italic block min-w-[100px]">{info.getValue() || "0"}</span>,
    }),
    columnHelper.accessor("coveredText" as any, {
      header: "Covered",
      cell: info => <span className="text-xs font-medium text-slate-500">{info.getValue() || "No"}</span>,
    }),
    columnHelper.accessor("activations", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
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
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
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
      header: () => (
        <div className="flex items-center gap-1.5">
          Decision
          <span 
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-300 text-[9px] font-bold text-slate-400 cursor-help hover:border-primary hover:text-primary transition-colors"
            title="Decision logic&#10;&#10;Keep: fixed recommendation and attach rate is at or above unit cutoff.&#10;Review Removal: fixed recommendation but attach rate is below unit cutoff.&#10;Keep Logic + Promote: conditional or quantity-driven logic is present and attach rate is at or above unit cutoff.&#10;Keep Logic: conditional or quantity-driven logic is present, but attach rate is below unit cutoff.&#10;Add: not covered in the sheet and attach rate is at or above unit cutoff.&#10;Monitor: observed attachment, but below unit cutoff.&#10;No Action: no observed attachment and not covered in the recommendation sheet."
          >
            i
          </span>
        </div>
      ),
      cell: info => {
        const val = info.getValue() || "No Action";
        const variantMap: Record<string, any> = {
          "Keep": "success",
          "Keep Logic": "success",
          "Keep Logic + Promote": "info",
          "Add": "info",
          "Review Removal": "destructive",
          "Monitor": "warning",
          "No Action": "default"
        };
        
        const variant = variantMap[val] || "default";
        
        return (
          <Badge variant={variant} title={info.row.original.decisionReason}>
            {val}
          </Badge>
        )
      },
    }),
    columnHelper.accessor("decisionReason", {
      header: "Reason",
      cell: info => <span className="text-[11px] font-medium text-slate-500 leading-relaxed block min-w-[250px]">{info.getValue()}</span>,
    }),
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const exportData = () => {
    const filename = `recommendation_sheet_comparison.csv`;
    const exportColumns = [
      { label: "VAPS", key: "vaps" },
      { label: "VAPS Description", key: "vapsDesc" },
      { label: "Recommendation Logic", key: "recommendationKind" },
      { label: "Recommendation Value", key: "recommendationValue" },
      { label: "Covered", key: "coveredText" },
      { label: "Unit Activations", key: "activations" },
      { label: "VAPS Associated", key: "associated" },
      { label: "Attach Rate", key: "attachRate", fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { label: "Unit Cutoff", key: "elbowCutoff", fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      { label: "Decision", key: "decision" },
      { label: "Reason", key: "decisionReason" }
    ];
    import('@/lib/export').then(({ exportToCsv }) => {
      exportToCsv(filename, exportColumns, filteredData);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-2">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <h2 className={typography.cardTitle}>Recommendation Sheet Comparison</h2>
        </div>
        <div className="flex flex-nowrap items-center gap-3 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            {table.getRowModel().rows.length} Records
          </span>
          <div className="w-48">
            <Input 
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="SEARCH VAPS ID"
              icon={<Search size={14} />}
              variantSize="sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2 whitespace-nowrap">
            <Download size={12} />
            CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-0 pb-4 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <label className={typography.label}>Market</label>
          <Select value={marketFilter} onChange={e => setMarketFilter(e.target.value)} variantSize="sm">
            <option value="">All Markets</option>
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={typography.label}>Status</label>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} variantSize="sm">
            <option value="">All Statuses</option>
            <option value="Above cutoff">Above cutoff</option>
            <option value="Below cutoff">Below cutoff</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={typography.label}>Action</label>
          <Select value={actionFilter} onChange={e => setActionFilter(e.target.value)} variantSize="sm">
            <option value="">All Actions</option>
            {["Add", "Keep", "Keep Logic", "Monitor", "No Action", "Review Removal"].map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={typography.label}>Covered</label>
          <Select value={recFilter} onChange={e => setRecFilter(e.target.value)} variantSize="sm">
            <option value="">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={typography.label}>Tier</label>
          <Select value={tierFilter} onChange={e => setTierFilter(e.target.value)} variantSize="sm">
            <option value="">All Tiers</option>
            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={typography.label}>Min Attach %</label>
          <Input 
            type="number" 
            value={minAttach} 
            onChange={e => setMinAttach(e.target.value)} 
            variantSize="sm" 
            min="0" max="100" step="0.1"
          />
        </div>
        <div className="flex flex-col gap-1 justify-end">
           <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest h-8"
            onClick={() => {
              setMarketFilter("");
              setStatusFilter("");
              setActionFilter("");
              setRecFilter("");
              setTierFilter("");
              setMinAttach("0");
              setGlobalFilter("");
            }}
           >
             Reset Filters
           </Button>
        </div>
      </CardContent>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead 
                  key={header.id} 
                  isHighlighted={selectedColId === header.column.id}
                  isNum={header.column.id === 'activations' || header.column.id === 'associated' || header.column.id === 'attachRate' || header.column.id === 'elbowCutoff'}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400 italic">
                No matching VAPS records found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id} isHighlighted={selectedRowId === row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell 
                    key={cell.id} 
                    isHighlighted={selectedColId === cell.column.id}
                    onClick={() => {
                      setSelectedRowId(row.id === selectedRowId ? null : row.id);
                      setSelectedColId(cell.column.id === selectedColId ? null : cell.column.id);
                    }}
                    isNum={cell.column.id === 'activations' || cell.column.id === 'associated' || cell.column.id === 'attachRate' || cell.column.id === 'elbowCutoff'}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </tbody>
      </Table>
    </Card>
  )
}
