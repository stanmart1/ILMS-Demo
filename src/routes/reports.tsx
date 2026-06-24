import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { toast } from "sonner";
import {
  ArrowLeft, Download, BarChart2, PieChart as PieIcon, TrendingUp,
  TableIcon, Search, Play, Plus, Trash2, Pencil, SlidersHorizontal,
  BookOpen, ShoppingCart, Newspaper, LibraryBig, Users, Clock, Pause, CirclePlay,
} from "lucide-react";
import {
  REPORT_LIBRARY, toCSV, getCirculationByMonth, getTopTitles, getFinesByType,
  type ReportDefinition, type ReportResult, type ReportModule, type ChartType,
} from "@/lib/report-engine";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { budgets, checkouts as mockCheckouts, patrons as mockPatrons, fines as mockFines, purchaseOrders as mockPurchaseOrders, bibRecords as mockBibRecords, subscriptions as mockSubscriptions } from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Athenaeum" }] }),
  component: Reports,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<ReportModule, string> = {
  Circulation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Patrons: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Acquisitions: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Serials: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Catalog: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

const MODULE_ICONS: Record<ReportModule, React.ElementType> = {
  Circulation: BookOpen,
  Patrons: Users,
  Acquisitions: ShoppingCart,
  Serials: Newspaper,
  Catalog: LibraryBig,
};

const CHART_COLORS = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "oklch(0.62 0.12 200)",
];

const CHART_TYPE_ICONS: Record<ChartType, React.ElementType> = {
  "bar": BarChart2, "horizontal-bar": BarChart2, "area": TrendingUp,
  "line": TrendingUp, "pie": PieIcon, "table": TableIcon,
};

// ─── Shared: column cell renderer ────────────────────────────────────────────

function CellValue({ type, value }: { type: string; value: unknown }) {
  if (value == null || value === "") return <span className="text-muted-foreground">—</span>;
  if (type === "currency") return <span className="font-mono">₦{(value as number).toFixed(2)}</span>;
  if (type === "percent") return <span className="font-mono">{value}%</span>;
  if (type === "number") return <span className="font-mono">{value as number}</span>;
  if (type === "badge") {
    const v = String(value);
    const variant =
      ["Active", "Received", "Paid", "Available"].includes(v) ? "default" :
      ["Overdue", "Suspended", "Expired", "Late", "Lapsed", "Disputed"].includes(v) ? "destructive" :
      ["Renewing", "Pending", "Approved", "On loan"].includes(v) ? "secondary" : "outline";
    return <Badge variant={variant} className="text-[11px]">{v}</Badge>;
  }
  return <span>{String(value)}</span>;
}

// ─── Shared: chart renderer ───────────────────────────────────────────────────

function ReportChart({ result, chartType }: { result: ReportResult; chartType: ChartType }) {
  const { chartData, chartConfig } = result;
  if (!chartData.length) return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>;

  const tooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)" };

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} dataKey={chartConfig.pieValueKey ?? "value"} nameKey={chartConfig.xKey}
            cx="50%" cy="50%" outerRadius={90}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "horizontal-bar") {
    const bar = chartConfig.bars?.[0];
    if (!bar) return null;
    return (
      <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 36)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey={chartConfig.xKey} type="category" tick={{ fontSize: 11 }} width={120} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey={bar.key} name={bar.label} fill={bar.color} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // bar (grouped)
  const bars = chartConfig.bars ?? [];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Report Library + Viewer
// ═══════════════════════════════════════════════════════════════════════════════

const MODULES: ReportModule[] = ["Circulation", "Patrons", "Acquisitions", "Serials", "Catalog"];

function ReportCard({ def, onRun }: { def: ReportDefinition; onRun: () => void }) {
  const result = useMemo(() => def.compute(), [def]);
  const ChartIcon = CHART_TYPE_ICONS[def.chartType];
  const ModuleIcon = MODULE_ICONS[def.module];

  return (
    <button
      onClick={onRun}
      className="group rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <ModuleIcon className="h-5 w-5 text-accent" />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <ChartIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">{def.chartType.replace("-", " ")}</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="font-serif font-semibold leading-snug group-hover:text-accent transition-colors">{def.name}</div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{def.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${MODULE_COLORS[def.module]}`}>
          {def.module}
        </span>
        <span className="text-xs text-muted-foreground mono">{result.rows.length} rows</span>
      </div>
    </button>
  );
}

function ReportViewer({ def, onBack }: { def: ReportDefinition; onBack: () => void }) {
  const result = useMemo(() => def.compute(), [def]);
  const [page, setPage] = useState({ page: 1, pageSize: 10 });
  const { paged, totalPages, totalItems } = usePagination(result.rows, page);

  const handleExport = useCallback(() => {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${def.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.rows.length} rows as CSV`);
  }, [def, result]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to library
          </Button>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-semibold">{def.name}</h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MODULE_COLORS[def.module]}`}>
              {def.module}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {result.summaryStats.map((s) => {
          const accentClass =
            s.accent === "success" ? "text-success" :
            s.accent === "warning" ? "text-warning" :
            s.accent === "destructive" ? "text-destructive" : "text-foreground";
          return (
            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`mt-1 font-serif text-2xl font-semibold ${accentClass}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {def.chartType !== "table" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">{def.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportChart result={result} chartType={def.chartType} />
          </CardContent>
        </Card>
      )}

      {/* Data table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-serif text-base">Data ({totalItems} rows)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {result.columns.map((col) => (
                    <TableHead key={col.key} className="text-xs">{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((row, i) => (
                  <TableRow key={i} className="hover:bg-muted/50">
                    {result.columns.map((col) => (
                      <TableCell key={col.key} className="text-sm py-2">
                        <CellValue type={col.type} value={row[col.key]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataPagination page={page.page} pageSize={page.pageSize} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportLibraryTab() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ReportModule | "All">("All");
  const [activeReport, setActiveReport] = useState<ReportDefinition | null>(null);

  const filtered = useMemo(() =>
    REPORT_LIBRARY.filter((r) => {
      const matchesModule = moduleFilter === "All" || r.module === moduleFilter;
      const matchesSearch = !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      return matchesModule && matchesSearch;
    }),
    [search, moduleFilter]
  );

  if (activeReport) {
    return <ReportViewer def={activeReport} onBack={() => setActiveReport(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Search + module filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...MODULES] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                moduleFilter === m
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <BarChart2 className="h-12 w-12 mb-3 opacity-25" />
          <p className="text-sm">No reports match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((def) => (
            <ReportCard key={def.id} def={def} onRun={() => setActiveReport(def)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Report Builder + Saved reports
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_SOURCES = [
  { value: "checkouts", label: "Checkouts", fields: ["patron", "cardNumber", "title", "status", "dueDate", "renewals"] },
  { value: "patrons", label: "Patrons", fields: ["name", "cardNumber", "category", "status", "fines", "joined"] },
  { value: "fines", label: "Fines", fields: ["patronName", "itemTitle", "type", "amount", "paid", "date"] },
  { value: "purchaseOrders", label: "Purchase orders", fields: ["id", "vendor", "status", "total", "fund", "created"] },
  { value: "bibRecords", label: "Catalog records", fields: ["title", "author", "format", "year", "copies", "available"] },
  { value: "subscriptions", label: "Subscriptions", fields: ["title", "issn", "vendor", "frequency", "status"] },
] as const;

const OPERATORS = ["equals", "not equals", "contains", "greater than", "less than"] as const;
const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar chart" },
  { value: "horizontal-bar", label: "Horizontal bar" },
  { value: "pie", label: "Pie chart" },
  { value: "table", label: "Table only" },
];

const builderSchema = z.object({
  name: z.string().min(1, "Name required"),
  source: z.string().min(1, "Select a data source"),
  groupBy: z.string().optional(),
  metric: z.enum(["count", "sum", "avg"]).default("count"),
  metricField: z.string().optional(),
  chartType: z.string().default("bar"),
  filters: z.array(z.object({
    field: z.string().min(1),
    operator: z.string().min(1),
    value: z.string().min(1),
  })),
});
type BuilderForm = z.infer<typeof builderSchema>;

type SavedReport = { id: string; name: string; source: string; rows: number; savedAt: string; config: BuilderForm };

function computeBuilderPreview(form: Partial<BuilderForm>): { rows: Record<string, unknown>[]; chartData: Record<string, unknown>[] } {
  if (!form.source) return { rows: [], chartData: [] };

  const staticMap: Record<string, unknown[]> = {
    checkouts: mockCheckouts,
    patrons: mockPatrons,
    fines: mockFines,
    purchaseOrders: mockPurchaseOrders,
    bibRecords: mockBibRecords,
    subscriptions: mockSubscriptions,
  };

  let data: Record<string, unknown>[] = (staticMap[form.source] ?? []) as Record<string, unknown>[];

  // Apply filters
  (form.filters ?? []).forEach((f) => {
    if (!f.field || !f.operator || !f.value) return;
    data = data.filter((row) => {
      const cellRaw = row[f.field];
      const cell = String(cellRaw ?? "").toLowerCase();
      const val = f.value.toLowerCase();
      if (f.operator === "equals") return cell === val;
      if (f.operator === "not equals") return cell !== val;
      if (f.operator === "contains") return cell.includes(val);
      if (f.operator === "greater than") return Number(cellRaw) > Number(f.value);
      if (f.operator === "less than") return Number(cellRaw) < Number(f.value);
      return true;
    });
  });

  // Group
  let chartData: Record<string, unknown>[] = [];
  if (form.groupBy) {
    const grouped: Record<string, number> = {};
    data.forEach((row) => {
      const key = String(row[form.groupBy!] ?? "Unknown");
      grouped[key] = (grouped[key] ?? 0) + 1;
    });
    chartData = Object.entries(grouped).map(([name, count]) => ({ name, count }));
  }

  return { rows: data.slice(0, 50), chartData };
}

function ReportBuilderTab() {
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SavedReport | null>(null);
  const [preview, setPreview] = useState<{ rows: Record<string, unknown>[]; chartData: Record<string, unknown>[]; columns: string[] } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<BuilderForm>({
    resolver: zodResolver(builderSchema),
    defaultValues: { metric: "count", chartType: "bar", filters: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "filters" });

  const watchedSource = watch("source");
  const watchedGroupBy = watch("groupBy");
  const watchedFilters = watch("filters");
  const watchedChartType = watch("chartType") as ChartType;

  const sourceFields = DATA_SOURCES.find((s) => s.value === watchedSource)?.fields ?? [];

  // Live preview with debounce
  const triggerPreview = useCallback((form: Partial<BuilderForm>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = computeBuilderPreview(form);
      const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
      setPreview({ ...result, columns });
    }, 200);
  }, []);

  // Re-run preview whenever form values change
  useEffect(() => {
    const subscription = watch((values) => triggerPreview(values));
    return () => subscription.unsubscribe();
  }, [watch, triggerPreview]);

  const onSave = (data: BuilderForm) => {
    if (editTarget) {
      setSaved((prev) => prev.map((s) =>
        s.id === editTarget.id ? { ...s, name: data.name, source: data.source, config: data, rows: preview?.rows.length ?? 0 } : s
      ));
      toast.success("Report updated");
      setEditTarget(null);
    } else {
      const result = computeBuilderPreview(data);
      setSaved((prev) => [
        { id: `sr-${Date.now()}`, name: data.name, source: data.source, rows: result.rows.length, savedAt: new Date().toISOString().slice(0, 10), config: data },
        ...prev,
      ]);
      toast.success(`"${data.name}" saved`);
    }
    reset({ metric: "count", chartType: "bar", filters: [] });
    setPreview(null);
  };

  const onRunSaved = (sr: SavedReport) => {
    const result = computeBuilderPreview(sr.config);
    const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
    setPreview({ ...result, columns });
    reset(sr.config);
    toast.success(`Running "${sr.name}"`);
  };

  const onEditSaved = (sr: SavedReport) => {
    setEditTarget(sr);
    reset(sr.config);
  };

  const onDeleteConfirm = () => {
    if (!deleteTarget) return;
    setSaved((prev) => prev.filter((s) => s.id !== deleteTarget));
    toast.success("Report deleted");
    setDeleteTarget(null);
  };

  const tooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)" };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* ── Builder form ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {editTarget ? `Editing: ${editTarget.name}` : "Build a report"}
            </CardTitle>
            {editTarget && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setEditTarget(null); reset({ metric: "count", chartType: "bar", filters: [] }); }}>
                Cancel edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <div>
                <Label>Report name</Label>
                <Input {...register("name")} placeholder="e.g. Overdue books by branch" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label>Data source</Label>
                <Controller name="source" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                    <SelectContent>
                      {DATA_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.source && <p className="text-xs text-destructive mt-1">{errors.source.message}</p>}
              </div>

              {/* Filter rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Filters</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs"
                    onClick={() => append({ field: sourceFields[0] ?? "", operator: "equals", value: "" })}
                    disabled={!watchedSource}>
                    <Plus className="h-3 w-3 mr-1" /> Add filter
                  </Button>
                </div>
                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground">No filters — showing all rows.</p>
                )}
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-1.5 mb-2">
                    <Controller name={`filters.${i}.field`} control={control} render={({ field: f }) => (
                      <Select onValueChange={f.onChange} value={f.value}>
                        <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{sourceFields.map((sf) => <SelectItem key={sf} value={sf}>{sf}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                    <Controller name={`filters.${i}.operator`} control={control} render={({ field: f }) => (
                      <Select onValueChange={f.onChange} value={f.value}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{OPERATORS.map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                    <Input {...register(`filters.${i}.value`)} placeholder="value" className="flex-1 h-8 text-xs" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Label>Group by</Label>
                  <Controller name="groupBy" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedSource}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {sourceFields.map((sf) => <SelectItem key={sf} value={sf}>{sf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label>Metric</Label>
                  <Controller name="metric" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>

              <div>
                <Label>Chart type</Label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {CHART_TYPES.map(({ value, label }) => {
                    const Icon = CHART_TYPE_ICONS[value];
                    return (
                      <Controller key={value} name="chartType" control={control} render={({ field }) => (
                        <button type="button"
                          onClick={() => field.onChange(value)}
                          className={`flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] transition-colors ${field.value === value ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-foreground"}`}>
                          <Icon className="h-4 w-4" />
                          {label.split(" ")[0]}
                        </button>
                      )} />
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editTarget ? <><Pencil className="mr-2 h-4 w-4" />Update report</> : <><Plus className="mr-2 h-4 w-4" />Save report</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Saved reports */}
        {saved.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-sm">Saved reports ({saved.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {saved.map((sr) => (
                  <li key={sr.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sm">{sr.name}</div>
                      <div className="text-xs text-muted-foreground">{sr.source} · {sr.rows} rows · {sr.savedAt}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRunSaved(sr)} title="Run">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditSaved(sr)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(sr.id)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Live preview ── */}
      <Card className="self-start">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base">Live preview</CardTitle>
          <CardDescription className="text-xs">Updates automatically as you configure the report.</CardDescription>
        </CardHeader>
        <CardContent>
          {!preview || !preview.rows.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <SlidersHorizontal className="h-10 w-10 mb-3 opacity-25" />
              <p className="text-sm">Select a data source to see a live preview.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">{preview.rows.length} rows</div>

              {/* Chart (if groupBy set and chartType !== table) */}
              {watchedGroupBy && watchedGroupBy !== "_none" && preview.chartData.length > 0 && watchedChartType !== "table" && (
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-3">Grouped by {watchedGroupBy}</div>
                  {watchedChartType === "pie" ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={preview.chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {preview.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={preview.chartData} layout={watchedChartType === "horizontal-bar" ? "vertical" : "horizontal"} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        {watchedChartType === "horizontal-bar"
                          ? <><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} /></>
                          : <><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /></>
                        }
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" name="Count" fill="var(--color-chart-2)" radius={watchedChartType === "horizontal-bar" ? [0, 3, 3, 0] : [3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* Table preview (first 10 rows) */}
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview.columns.slice(0, 6).map((col) => (
                        <TableHead key={col} className="text-xs">{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i} className="hover:bg-muted/50">
                        {preview.columns.slice(0, 6).map((col) => (
                          <TableCell key={col} className="text-xs py-1.5 max-w-[160px] truncate">
                            {String(row[col] ?? "—")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.rows.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">Showing first 10 of {preview.rows.length} rows</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete saved report?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Interactive Analytics
// ═══════════════════════════════════════════════════════════════════════════════

type DatePreset = "30d" | "90d" | "ytd" | "custom";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom" },
];

function AnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>("ytd");
  const [drillKey, setDrillKey] = useState<string | null>(null);

  const circulationData = useMemo(() => getCirculationByMonth(), []);
  const topTitlesData = useMemo(() => getTopTitles(8), []);
  const finesData = useMemo(() => getFinesByType(), []);
  const budgetData = useMemo(() =>
    budgets.map((b) => ({ fund: b.fund.split(" ")[0], allocated: b.allocated, spent: b.spent })),
    []
  );

  const tooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)" };

  // Drill-down: show matching rows from on-loan report when a bar is clicked
  const drillResult = useMemo(() => {
    if (!drillKey) return null;
    const def = REPORT_LIBRARY.find((r) => r.id === "on-loan");
    if (!def) return null;
    const result = def.compute();
    return result.rows.filter((r) => String(r["status"]) === drillKey || String(r["patron"]) === drillKey);
  }, [drillKey]);

  return (
    <div className="space-y-6">
      {/* Date range controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Period:</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                preset === p.value
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" className="h-8 text-xs w-36" defaultValue="2026-01-01" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" className="h-8 text-xs w-36" defaultValue="2026-06-30" />
          </div>
        )}
        <span className="ml-auto text-xs text-muted-foreground">Click any bar or segment to drill down</span>
      </div>

      {/* Row 1: Circulation trend + Top titles */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Circulation activity</CardTitle>
            <CardDescription className="text-xs">Checkouts and overdue items by month (from active data)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={circulationData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                onClick={(d) => d?.activeLabel && setDrillKey(d.activeLabel)}>
                <defs>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="checkouts" name="Checkouts" stroke="var(--color-chart-1)" fill="url(#gC)" strokeWidth={2} />
                <Area type="monotone" dataKey="overdue" name="Overdue" stroke="var(--color-chart-4)" fill="url(#gO)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Top circulated titles</CardTitle>
            <CardDescription className="text-xs">Derived from active checkout data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topTitlesData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                onClick={(d) => d?.activeLabel && setDrillKey(d.activeLabel)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 10 }} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="checkouts" name="Checkouts" fill="var(--color-chart-2)" radius={[0, 3, 3, 0]}
                  onClick={(d) => setDrillKey(d.title)} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Fines + Budget */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Fines by type — assessed vs collected</CardTitle>
            <CardDescription className="text-xs">Grouped from live fines data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={finesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                onClick={(d) => d?.activeLabel && setDrillKey(d.activeLabel)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `₦${(v as number).toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="assessed" name="Assessed" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]}
                  onClick={(d) => setDrillKey(d.type)} />
                <Bar dataKey="collected" name="Collected" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Budget: allocated vs spent</CardTitle>
            <CardDescription className="text-xs">Live from budgets data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="fund" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `₦${(v as number).toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated" name="Allocated" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="spent" name="Spent" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down panel */}
      {drillKey && (
        <Card className="border-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-serif text-base">
              Drill-down: <span className="text-accent">{drillKey}</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setDrillKey(null)}>Clear</Button>
          </CardHeader>
          <CardContent>
            {!drillResult || drillResult.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No matching rows in the on-loan dataset for "{drillKey}".</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(drillResult[0]).slice(0, 7).map((k) => (
                        <TableHead key={k} className="text-xs">{k}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drillResult.map((row, i) => (
                      <TableRow key={i} className="bg-accent/5">
                        {Object.keys(drillResult[0]).slice(0, 7).map((k) => (
                          <TableCell key={k} className="text-sm py-2">{String(row[k] ?? "—")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2 px-1">{drillResult.length} matching row{drillResult.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Summary stat cards — all computed from real data */}
      {(() => {
        const onLoanResult = REPORT_LIBRARY.find((r) => r.id === "on-loan")!.compute();
        const finesResult = REPORT_LIBRARY.find((r) => r.id === "outstanding-fines")!.compute();
        const budgetResult = REPORT_LIBRARY.find((r) => r.id === "budget-utilisation")!.compute();
        const availResult = REPORT_LIBRARY.find((r) => r.id === "availability")!.compute();
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...onLoanResult.summaryStats.slice(0, 1),
              ...finesResult.summaryStats.slice(1, 2),
              ...budgetResult.summaryStats.slice(2, 3),
              ...availResult.summaryStats.slice(3, 4),
            ].map((s) => {
              const accentClass = s.accent === "success" ? "text-success" : s.accent === "warning" ? "text-warning" : s.accent === "destructive" ? "text-destructive" : "text-foreground";
              return (
                <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className={`mt-1 font-serif text-2xl font-semibold ${accentClass}`}>{s.value}</div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Scheduled Reports tab
// ═══════════════════════════════════════════════════════════════════════════════

type ScheduleFrequency = "Daily" | "Weekly" | "Monthly";
type ScheduledReport = {
  id: string;
  name: string;
  reportId: string;
  frequency: ScheduleFrequency;
  hour: string;
  recipients: string;
  lastRun: string | null;
  nextRun: string;
  active: boolean;
};

const scheduleSchema = z.object({
  name: z.string().min(1, "Name required"),
  reportId: z.string().min(1, "Select a report"),
  frequency: z.enum(["Daily", "Weekly", "Monthly"]),
  hour: z.string().min(1, "Select a time"),
  recipients: z.string().min(1, "At least one recipient email required"),
});
type ScheduleForm = z.infer<typeof scheduleSchema>;

function nextRunDate(freq: ScheduleFrequency, hour: string): string {
  const d = new Date();
  d.setHours(parseInt(hour.split(":")[0] ?? "8", 10), 0, 0, 0);
  if (freq === "Daily") d.setDate(d.getDate() + 1);
  else if (freq === "Weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const initialSchedules: ScheduledReport[] = [
  { id: "sc1", name: "Daily circulation summary", reportId: "r01", frequency: "Daily", hour: "07:00", recipients: "director@library.org", lastRun: "2026-07-23 07:00", nextRun: nextRunDate("Daily", "07:00"), active: true },
  { id: "sc2", name: "Weekly overdue report", reportId: "r02", frequency: "Weekly", hour: "08:00", recipients: "circulation@library.org, director@library.org", lastRun: "2026-07-21 08:00", nextRun: nextRunDate("Weekly", "08:00"), active: true },
  { id: "sc3", name: "Monthly acquisitions spend", reportId: "r08", frequency: "Monthly", hour: "09:00", recipients: "acquisitions@library.org", lastRun: "2026-07-01 09:00", nextRun: nextRunDate("Monthly", "09:00"), active: false },
];

function ScheduledReportsTab() {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(initialSchedules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduledReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledReport | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { frequency: "Weekly", hour: "08:00" },
  });

  const openNew = () => { setEditTarget(null); reset({ frequency: "Weekly", hour: "08:00" }); setDialogOpen(true); };
  const openEdit = (s: ScheduledReport) => {
    setEditTarget(s);
    reset({ name: s.name, reportId: s.reportId, frequency: s.frequency, hour: s.hour, recipients: s.recipients });
    setDialogOpen(true);
  };

  const onSave = (data: ScheduleForm) => {
    const next = nextRunDate(data.frequency, data.hour);
    if (editTarget) {
      setSchedules((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...data, nextRun: next } : s));
      toast.success("Schedule updated");
    } else {
      setSchedules((prev) => [{
        id: `sc${Date.now()}`, ...data, lastRun: null, nextRun: next, active: true,
      }, ...prev]);
      toast.success("Schedule created");
    }
    setDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  const runNow = (s: ScheduledReport) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    setSchedules((prev) => prev.map((r) => r.id === s.id ? { ...r, lastRun: now } : r));
    toast.success(`"${s.name}" queued — recipients will receive the report shortly`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold">Scheduled reports</h3>
          <p className="text-sm text-muted-foreground">Automatically run reports on a schedule and email results to recipients.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> New schedule</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => {
                const def = REPORT_LIBRARY.find((r) => r.id === s.reportId);
                return (
                  <TableRow key={s.id} className={!s.active ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{def?.name ?? s.reportId}</TableCell>
                    <TableCell><Badge variant="outline">{s.frequency}</Badge></TableCell>
                    <TableCell className="mono text-xs">{s.hour}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{s.recipients}</TableCell>
                    <TableCell className="mono text-xs">{s.lastRun ?? <span className="text-muted-foreground">Never</span>}</TableCell>
                    <TableCell className="mono text-xs">{s.active ? s.nextRun : <span className="text-muted-foreground">Paused</span>}</TableCell>
                    <TableCell>
                      <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Active" : "Paused"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Run now" onClick={() => runNow(s)}>
                          <CirclePlay className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title={s.active ? "Pause" : "Resume"} onClick={() => toggleActive(s.id)}>
                          {s.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteTarget(s)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No scheduled reports yet. Click "+ New schedule" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">{editTarget ? "Edit schedule" : "New schedule"}</AlertDialogTitle>
          </AlertDialogHeader>
          <form id="schedule-form" onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <Label>Schedule name</Label>
              <Input {...register("name")} placeholder="e.g. Weekly overdue report" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Report</Label>
              <Select defaultValue={editTarget?.reportId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select a report" /></SelectTrigger>
                <SelectContent>
                  {REPORT_LIBRARY.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("reportId")} defaultValue={editTarget?.reportId ?? REPORT_LIBRARY[0]?.id} />
              {errors.reportId && <p className="text-xs text-destructive mt-1">{errors.reportId.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Frequency</Label>
                <Select defaultValue={editTarget?.frequency ?? "Weekly"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Daily", "Weekly", "Monthly"] as const).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input type="hidden" {...register("frequency")} defaultValue={editTarget?.frequency ?? "Weekly"} />
              </div>
              <div>
                <Label>Time</Label>
                <Select defaultValue={editTarget?.hour ?? "08:00"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["06:00","07:00","08:00","09:00","12:00","17:00","20:00","23:00"].map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input type="hidden" {...register("hour")} defaultValue={editTarget?.hour ?? "08:00"} />
              </div>
            </div>
            <div>
              <Label>Email recipients (comma-separated)</Label>
              <Input {...register("recipients")} placeholder="person@library.org, another@library.org" />
              {errors.recipients && <p className="text-xs text-destructive mt-1">{errors.recipients.message}</p>}
            </div>
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" form="schedule-form">Save schedule</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>"{deleteTarget?.name}" will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget?.id));
              toast.success("Schedule deleted");
              setDeleteTarget(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Root component
// ═══════════════════════════════════════════════════════════════════════════════

function Reports() {
  return (
    <PageShell
      title="Reports"
      description="Browse pre-built reports, build custom queries, and explore live analytics."
    >
      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library"><LibraryBig className="mr-1.5 h-4 w-4" />Report library</TabsTrigger>
          <TabsTrigger value="builder"><SlidersHorizontal className="mr-1.5 h-4 w-4" />Builder</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="mr-1.5 h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="scheduled"><Clock className="mr-1.5 h-4 w-4" />Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-5">
          <ReportLibraryTab />
        </TabsContent>

        <TabsContent value="builder" className="mt-5">
          <ReportBuilderTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-5">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-5">
          <ScheduledReportsTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
