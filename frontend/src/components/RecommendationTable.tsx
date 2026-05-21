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
import { useLocalStorageState } from "@/hooks/useLocalStorageState"
import { ArrowUpDown, Search, Download, Filter, Info, RotateCcw } from "lucide-react"
import { Card, CardHeader, CardContent } from "./ui/Card"
import { Badge } from "./ui/Badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/SelectShadcn"
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims"
import { typography } from "@/design-system/typography"
import { Skeleton } from "./ui/Skeleton"

const columnHelper = createColumnHelper<VapsAttachRate>()

interface RecommendationTableProps {
  data: VapsAttachRate[];
  isLoading?: boolean;
  title?: string;
  titleToggle?: React.ReactNode;
}

export default function RecommendationTable({ data, isLoading, title, titleToggle }: RecommendationTableProps) {
  const [sorting, setSorting] = useLocalStorageState<SortingState>("vaps-dashboard:rec-table:sorting", [])
  const [globalFilter, setGlobalFilter] = useLocalStorageState<string>("vaps-dashboard:rec-table:search", "")
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedColId, setSelectedColId] = useState<string | null>(null)

  // Local filters
  const [marketFilter, setMarketFilter] = useLocalStorageState<string>("vaps-dashboard:rec-table:marketFilter", "")
  const [statusFilter, setStatusFilter] = useLocalStorageState<string>("vaps-dashboard:rec-table:statusFilter", "")
  const [actionFilter, setActionFilter] = useLocalStorageState<string>("vaps-dashboard:rec-table:actionFilter", "")
  const [recFilter, setRecFilter] = useLocalStorageState<string>("vaps-dashboard:rec-table:recFilter", "")
  const [tierFilter, setTierFilter] = useLocalStorageState<string>("vaps-dashboard:rec-table:tierFilter", "")
  const [minAttach, setMinAttach] = useLocalStorageState<string>("vaps-dashboard:rec-table:minAttach", "0")

  const markets = useMemo(() => Array.from(new Set(data.map(r => r.market).filter(Boolean) as string[])).sort(), [data])
  const tiers = useMemo(() => Array.from(new Set(data.map(r => r.tier).filter(Boolean) as string[])).sort(), [data])

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
      cell: info => <span className="text-xs font-medium text-slate-600 block min-w-[200px]">{info.getValue() || "Unmapped"}</span>,
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
        <button 
          onClick={() => column.toggleSorting()} 
          className="flex items-center gap-1 hover:text-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider text-[9px] font-bold text-slate-500"
        >
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
        <button 
          onClick={() => column.toggleSorting()} 
          className="flex items-center gap-1 hover:text-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider text-[9px] font-bold text-slate-500"
        >
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-slate-400 hover:text-primary transition-colors cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs whitespace-pre-wrap text-xs">
              {`Decision logic\n\nKeep: fixed recommendation and attach rate is at or above unit cutoff.\nReview Removal: fixed recommendation but attach rate is below unit cutoff.\nKeep Logic + Promote: conditional or quantity-driven logic is present and attach rate is at or above unit cutoff.\nKeep Logic: conditional or quantity-driven logic is present, but attach rate is below unit cutoff.\nAdd: not covered in the sheet and attach rate is at or above unit cutoff.\nMonitor: observed attachment, but below unit cutoff.\nNo Action: no observed attachment and not covered in the recommendation sheet.`}
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Badge variant={variant}>
                  {val}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs whitespace-pre-wrap text-xs">
              {info.row.original.decisionReason}
            </TooltipContent>
          </Tooltip>
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
      { label: "VAPS Description", key: "vapsDesc", fmt: (v: string) => v || "Unmapped" },
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
      <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 py-2 md:py-2.5 px-4 md:px-6">
        {title && (
          <div className="flex flex-wrap items-center gap-3">
            {/* <Filter size={18} className="text-slate-400" /> */}
            <h2 className={typography.cardTitle}>{title}</h2>
          </div>
        )}
        <div className="flex flex-nowrap items-center gap-3 shrink-0 ml-auto">
          <div className="w-48">
            <Input 
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="SEARCH VAPS ID"
              icon={<Search size={14} />}
              variantSize="sm"
            />
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mx-1">
            {table.getRowModel().rows.length} Records
          </span>

          <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2 whitespace-nowrap">
            <Download size={12} />
            CSV
          </Button>
        </div>
      </CardHeader>


      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 py-2.5 px-4 md:px-6 border-b border-slate-100">
        <div className="flex flex-col gap-1">

          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Market</label>
          <Select value={marketFilter || "all"} onValueChange={(val) => setMarketFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Markets</SelectItem>
              {markets.map(m => <SelectItem variantSize="sm" key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</label>
          <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Statuses</SelectItem>
              <SelectItem variantSize="sm" value="Above cutoff">Above cutoff</SelectItem>
              <SelectItem variantSize="sm" value="Below cutoff">Below cutoff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Action</label>
          <Select value={actionFilter || "all"} onValueChange={(val) => setActionFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Actions</SelectItem>
              {["Add", "Keep", "Keep Logic", "Monitor", "No Action", "Review Removal"].map(a => <SelectItem variantSize="sm" key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Covered</label>
          <Select value={recFilter || "all"} onValueChange={(val) => setRecFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All</SelectItem>
              <SelectItem variantSize="sm" value="Yes">Yes</SelectItem>
              <SelectItem variantSize="sm" value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tier</label>
          <Select value={tierFilter || "all"} onValueChange={(val) => setTierFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Tiers</SelectItem>
              {tiers.map(t => <SelectItem variantSize="sm" key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Min Attach %</label>
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
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 h-[34px] border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 transition-all text-[10px] font-bold uppercase tracking-wider"
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
            <RotateCcw size={11} className="shrink-0" />
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
