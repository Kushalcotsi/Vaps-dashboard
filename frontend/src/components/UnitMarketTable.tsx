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
import { UnitMarketSegmentRate } from "@/types"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useLocalStorageState } from "@/hooks/useLocalStorageState"
import { ArrowUpDown, Search, Download, RotateCcw, Info } from "lucide-react"
import { Card, CardHeader, CardContent } from "./ui/Card"
import { Badge } from "./ui/Badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/SelectShadcn"
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/TablePrims"
import { typography } from "@/design-system/typography"
import { Skeleton } from "./ui/Skeleton"

const columnHelper = createColumnHelper<UnitMarketSegmentRate>()

interface UnitMarketTableProps {
  data: UnitMarketSegmentRate[];
  isLoading?: boolean;
  title?: string;
}

export default function UnitMarketTable({ data, isLoading, title }: UnitMarketTableProps) {
  const [sorting, setSorting] = useLocalStorageState<SortingState>("vaps-dashboard:um-table:sorting", [])
  const [globalFilter, setGlobalFilter] = useLocalStorageState<string>("vaps-dashboard:um-table:search", "")
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedColId, setSelectedColId] = useState<string | null>(null)

  // Local filters
  const [marketFilter, setMarketFilter] = useLocalStorageState<string>("vaps-dashboard:um-table:marketFilter", "")
  const [confidenceFilter, setConfidenceFilter] = useLocalStorageState<string>("vaps-dashboard:um-table:confidenceFilter", "")
  const [recFilter, setRecFilter] = useLocalStorageState<string>("vaps-dashboard:um-table:recFilter", "")
  
  const markets = useMemo(() => Array.from(new Set(data.map(r => r.market).filter(Boolean) as string[])).sort(), [data])

  const filteredData = useMemo(() => {
    return data.filter(r => {
      // Commented out table filters per user request: keep only global filters
      // if (marketFilter && r.market !== marketFilter) return false;
      // if (confidenceFilter && r.confidenceLevel !== confidenceFilter) return false;
      // if (recFilter && r.recommendationLabel !== recFilter) return false;
      return true;
    });
  }, [data, marketFilter, confidenceFilter, recFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor("unit", {
      header: "Product",
      cell: info => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-700">{info.row.original.productName || "Unknown"}</span>
          <span className={cn(typography.mono, "text-[10px] text-slate-500 uppercase")}>{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("market", {
      header: "Market Segment",
      cell: info => <span className="text-xs font-medium text-slate-600">{info.getValue() || "Global"}</span>,
    }),
    columnHelper.accessor("confidenceLevel", {
      header: "Confidence",
      cell: info => <span className="text-[11px] font-medium text-slate-500">{info.getValue()}</span>,
    }),
    columnHelper.accessor("latestActivations", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider text-[10px] font-bold text-slate-500">
          Latest<br/>Activations <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-semibold text-slate-600">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor("historicalActivations", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider text-[10px] font-bold text-slate-500">
          Historical<br/>Activations <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-semibold text-slate-600">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor("periodsObserved", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider text-[10px] font-bold text-slate-500">
          Periods<br/>Observed <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-semibold text-slate-600">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor("productShareInMarket", {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider text-[10px] font-bold text-slate-500">
          Latest<br/>Share <ArrowUpDown size={10} />
        </button>
      ),
      cell: info => <span className="tabular-nums font-bold text-slate-900">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("historicalProductShareInMarket", {
      header: "Historical Share",
      cell: info => <span className="tabular-nums text-slate-600 text-xs">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("blendedProductShareInMarket", {
      header: "Blended Share",
      cell: info => <span className="tabular-nums font-medium text-slate-700 text-xs">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("marketContributionToProduct", {
      header: "Latest Contribution",
      cell: info => <span className="tabular-nums font-semibold text-slate-600">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("historicalMarketContributionToProduct", {
      header: "Historical Contribution",
      cell: info => <span className="tabular-nums text-slate-600 text-xs">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("blendedMarketContributionToProduct", {
      header: "Blended Contribution",
      cell: info => <span className="tabular-nums font-medium text-slate-700 text-xs">{(info.getValue() * 100).toFixed(1)}%</span>,
    }),
    columnHelper.accessor("momentumScore", {
      header: "Momentum",
      cell: info => <span className="tabular-nums font-medium text-slate-500 text-xs">{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor("trendScore", {
      header: "Trend",
      cell: info => <span className="tabular-nums font-medium text-slate-500 text-xs">{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor("recommendationScore", {
      header: "Score",
      cell: info => <span className="tabular-nums font-bold text-slate-800 text-xs">{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor("recommendationLabel", {
      header: "Label",
      cell: info => {
        const val = info.getValue() || "None";
        const variantMap: Record<string, any> = {
          "Core Recommendation": "success",
          "Emerging Opportunity": "info",
          "White Space Opportunity": "info",
          "High Dependency Risk": "warning",
          "Declining Product": "destructive",
          "Review Required": "warning",
          "Low Confidence": "default"
        };
        const variant = variantMap[val] || "default";
        
        return (
          <Badge variant={variant} className="whitespace-nowrap">
            {val}
          </Badge>
        )
      },
    }),
    columnHelper.accessor("reviewReason", {
      header: "Review Reason",
      cell: info => <span className="text-[10px] text-slate-400 line-clamp-2" title={info.getValue()}>{info.getValue() || "N/A"}</span>,
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
    const filename = `unit_market_recommendations.csv`;
    const exportColumns = [
      { label: "Product", key: "productName", fmt: (v: string, r: any) => `${r.productName} (${r.unit})` },
      { label: "Market Segment", key: "market" },
      { label: "Confidence", key: "confidenceLevel" },
      { label: "Latest Activations", key: "latestActivations" },
      { label: "Historical Activations", key: "historicalActivations" },
      { label: "Periods Observed", key: "periodsObserved" },
      { label: "Latest Share", key: "productShareInMarket", fmt: (v: any) => `${(Number(v || 0) * 100).toFixed(1)}%` },
      { label: "Historical Share", key: "historicalProductShareInMarket", fmt: (v: any) => `${(Number(v || 0) * 100).toFixed(1)}%` },
      { label: "Blended Share", key: "blendedProductShareInMarket", fmt: (v: any) => `${(Number(v || 0) * 100).toFixed(1)}%` },
      { label: "Latest Contribution", key: "marketContributionToProduct", fmt: (v: any) => `${(Number(v || 0) * 100).toFixed(1)}%` },
      { label: "Historical Contribution", key: "historicalMarketContributionToProduct", fmt: (v: any) => `${(Number(v || 0) * 100).toFixed(1)}%` },
      { label: "Blended Contribution", key: "blendedMarketContributionToProduct", fmt: (v: any) => `${(Number(v || 0) * 100).toFixed(1)}%` },
      { label: "Momentum", key: "momentumScore" },
      { label: "Trend", key: "trendScore" },
      { label: "Score", key: "recommendationScore" },
      { label: "Label", key: "recommendationLabel" },
      { label: "Review Reason", key: "reviewReason" }
    ];
    import('@/lib/export').then(({ exportToCsv }) => {
      exportToCsv(filename, exportColumns, filteredData);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 py-1.5 md:py-2 px-3 md:px-4">
        {title && (
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={typography.cardTitle}>{title}</h2>
          </div>
        )}
        <div className="flex flex-nowrap items-center gap-3 shrink-0 ml-auto">
          <div className="w-48">
            <Input 
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="SEARCH UNIT/MARKET"
              icon={<Search size={14} />}
              variantSize="sm"
            />
          </div>

          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mx-1">
            {table.getRowModel().rows.length} Records
          </span>

          {/* <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2 whitespace-nowrap">
            <Download size={12} />
            CSV
          </Button> */}
        </div>
      </CardHeader>


      {/* Table filters commented out per user request: keep only global filters
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 py-2 px-3 md:px-4 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Market</label>
          <Select value={marketFilter || "all"} onValueChange={(val) => setMarketFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Markets</SelectItem>
              {markets
                .filter(m => m && String(m).trim().toLowerCase() !== "all" && String(m).trim().toLowerCase() !== "all markets")
                .map(m => <SelectItem variantSize="sm" key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Confidence</label>
          <Select value={confidenceFilter || "all"} onValueChange={(val) => setConfidenceFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Confidence Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Confidence</SelectItem>
              <SelectItem variantSize="sm" value="High">High</SelectItem>
              <SelectItem variantSize="sm" value="Medium">Medium</SelectItem>
              <SelectItem variantSize="sm" value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recommendation</label>
          <Select value={recFilter || "all"} onValueChange={(val) => setRecFilter(val === "all" ? "" : val)}>
            <SelectTrigger variantSize="sm" className="bg-white hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Recommendations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem variantSize="sm" value="all">All Recommendations</SelectItem>
              {["Core Recommendation", "Emerging Opportunity", "Review Required"].map(a => <SelectItem variantSize="sm" key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-1 justify-end pb-0.5 lg:col-start-7">
          <button 
            title="Reset Filters"
            className="flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer w-fit ml-auto"
            onClick={() => {
              setMarketFilter("");
              setConfidenceFilter("");
              setRecFilter("");
              setGlobalFilter("");
            }}
          >
            <RotateCcw size={14} className="shrink-0" />
          </button>
        </div>
      </CardContent>
      */}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead 
                  key={header.id} 
                  isHighlighted={selectedColId === header.column.id}
                  isNum={
                    header.column.id === 'latestActivations' || 
                    header.column.id === 'historicalActivations' ||
                    header.column.id === 'periodsObserved' ||
                    header.column.id === 'productShareInMarket' || 
                    header.column.id === 'historicalProductShareInMarket' ||
                    header.column.id === 'blendedProductShareInMarket' ||
                    header.column.id === 'marketContributionToProduct' || 
                    header.column.id === 'historicalMarketContributionToProduct' ||
                    header.column.id === 'blendedMarketContributionToProduct' ||
                    header.column.id === 'momentumScore' ||
                    header.column.id === 'trendScore' ||
                    header.column.id === 'recommendationScore'
                  }
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
                No matching Unit Market records found
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
                    isNum={
                      cell.column.id === 'latestActivations' || 
                      cell.column.id === 'historicalActivations' ||
                      cell.column.id === 'periodsObserved' ||
                      cell.column.id === 'productShareInMarket' || 
                      cell.column.id === 'historicalProductShareInMarket' ||
                      cell.column.id === 'blendedProductShareInMarket' ||
                      cell.column.id === 'marketContributionToProduct' || 
                      cell.column.id === 'historicalMarketContributionToProduct' ||
                      cell.column.id === 'blendedMarketContributionToProduct' ||
                      cell.column.id === 'momentumScore' ||
                      cell.column.id === 'trendScore' ||
                      cell.column.id === 'recommendationScore'
                    }
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
