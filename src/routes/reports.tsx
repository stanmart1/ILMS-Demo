import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { toast } from "sonner";
import { Play, Download, Calendar, BarChart2 } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Athenaeum" }] }),
  component: Reports,
});

// ─── Mock data ────────────────────────────────────────────────────────────────
const savedReports = [
  { id: "r1", name: "Overdue items by branch", category: "Circulation", lastRun: "2026-06-23", rows: 142 },
  { id: "r2", name: "Top 50 most-circulated titles (90d)", category: "Circulation", lastRun: "2026-06-22", rows: 50 },
  { id: "r3", name: "Patrons with fines > $10", category: "Patrons", lastRun: "2026-06-20", rows: 38 },
  { id: "r4", name: "FY26 fund expenditure by month", category: "Acquisitions", lastRun: "2026-06-18", rows: 12 },
  { id: "r5", name: "Lapsed serial subscriptions", category: "Serials", lastRun: "2026-06-15", rows: 4 },
  { id: "r6", name: "New cataloging additions (30d)", category: "Cataloging", lastRun: "2026-06-23", rows: 87 },
];

const sampleQuery = `-- Overdue items grouped by branch
SELECT
  b.name AS branch,
  COUNT(*) AS overdue_count,
  SUM(DATEDIFF(CURRENT_DATE, c.due_date)) AS total_days_overdue
FROM checkouts c
  JOIN items i ON i.id = c.item_id
  JOIN branches b ON b.id = i.home_branch_id
WHERE c.returned_at IS NULL
  AND c.due_date < CURRENT_DATE
GROUP BY b.name
ORDER BY overdue_count DESC;`;

const sampleResult = [
  { branch: "Central", overdue_count: 67, total_days_overdue: 821 },
  { branch: "Riverside", overdue_count: 41, total_days_overdue: 502 },
  { branch: "North Hill", overdue_count: 34, total_days_overdue: 388 },
];

// ─── Statistical data ─────────────────────────────────────────────────────────
const monthlyCirculation = [
  { month: "Jan", checkouts: 842, returns: 810, renewals: 215, holds: 98 },
  { month: "Feb", checkouts: 765, returns: 790, renewals: 188, holds: 87 },
  { month: "Mar", checkouts: 910, returns: 875, renewals: 234, holds: 124 },
  { month: "Apr", checkouts: 1020, returns: 980, renewals: 290, holds: 148 },
  { month: "May", checkouts: 988, returns: 1005, renewals: 261, holds: 135 },
  { month: "Jun", checkouts: 854, returns: 820, renewals: 210, holds: 112 },
];

const topTitles = [
  { title: "Sapiens", checkouts: 48 },
  { title: "The Midnight Library", checkouts: 42 },
  { title: "Educated", checkouts: 38 },
  { title: "Thinking, Fast and Slow", checkouts: 35 },
  { title: "The Sympathizer", checkouts: 31 },
];

const finesByBranch = [
  { branch: "Central", fines: 142.50, collected: 98.25 },
  { branch: "Riverside", fines: 89.75, collected: 62.00 },
  { branch: "North Hill", fines: 67.25, collected: 51.50 },
];

// ─── Guided Report Wizard ──────────────────────────────────────────────────────
const wizardSchema = z.object({
  module: z.string().min(1, "Select a module"),
  reportType: z.string().min(1, "Select a report type"),
  dateFrom: z.string().min(1, "Select start date"),
  dateTo: z.string().min(1, "Select end date"),
  groupBy: z.string().optional(),
  includeCharts: z.boolean().default(true),
});
type WizardForm = z.infer<typeof wizardSchema>;

const reportTypes: Record<string, string[]> = {
  Circulation: ["Checkouts by patron category", "Overdue items", "Most circulated titles", "Holds summary"],
  Acquisitions: ["Fund expenditure", "Vendor spend", "Outstanding orders", "Invoice status"],
  Cataloging: ["New additions", "Records by format", "Subject distribution"],
  Serials: ["Active subscriptions", "Lapsed subscriptions", "Claims summary"],
  Patrons: ["New registrations", "Active vs inactive", "Fines report", "Category breakdown"],
};

function GuidedWizard() {
  const [wizardResult, setWizardResult] = useState<null | { title: string; rows: number; sql: string }>(null);
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: { includeCharts: true },
  });
  const selectedModule = watch("module");

  const onGenerate = (data: WizardForm) => {
    const sql = `-- Generated: ${data.reportType}\nSELECT * FROM ${data.module.toLowerCase()} WHERE date BETWEEN '${data.dateFrom}' AND '${data.dateTo}'${data.groupBy ? `\nGROUP BY ${data.groupBy}` : ""};`;
    setWizardResult({ title: data.reportType, rows: Math.floor(Math.random() * 200) + 10, sql });
    toast.success(`Report generated: ${data.reportType}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader><CardTitle className="font-serif text-base">Report builder</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
            <div>
              <Label>Module</Label>
              <Controller name="module" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(reportTypes).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.module && <p className="text-xs text-destructive mt-1">{errors.module.message}</p>}
            </div>

            <div>
              <Label>Report type</Label>
              <Controller name="reportType" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedModule}>
                  <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
                  <SelectContent>
                    {(reportTypes[selectedModule] ?? []).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.reportType && <p className="text-xs text-destructive mt-1">{errors.reportType.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date from</Label>
                <Input type="date" {...register("dateFrom")} defaultValue="2026-01-01" />
              </div>
              <div>
                <Label>Date to</Label>
                <Input type="date" {...register("dateTo")} defaultValue="2026-06-30" />
              </div>
            </div>

            <div>
              <Label>Group by (optional)</Label>
              <Controller name="groupBy" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="No grouping" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="patron_category">Patron category</SelectItem>
                    <SelectItem value="item_type">Item type</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="flex items-center gap-2">
              <Controller name="includeCharts" control={control} render={({ field }) => (
                <Checkbox id="charts" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label htmlFor="charts" className="cursor-pointer">Include visualisation</Label>
            </div>

            <Button type="submit" className="w-full"><Play className="mr-2 h-4 w-4" />Generate report</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-serif text-base">
            {wizardResult ? wizardResult.title : "Report preview"}
          </CardTitle>
          {wizardResult && (
            <Button size="sm" variant="outline" onClick={() => toast.success("Exported as CSV")}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!wizardResult ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <BarChart2 className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">Configure your report on the left and click <strong>Generate report</strong>.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{wizardResult.rows} rows · Generated just now</div>
              <div className="rounded-md bg-muted p-3 font-mono text-xs">{wizardResult.sql}</div>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-3 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground">
                  <span>Branch</span><span>Count</span><span>Metric</span>
                </div>
                {["Central", "Riverside", "North Hill"].map((br, i) => (
                  <div key={br} className="grid grid-cols-3 gap-4 px-4 py-2.5 text-sm hover:bg-muted/50">
                    <span>{br}</span>
                    <span className="mono">{[142, 87, 64][i]}</span>
                    <span className="mono">{[824, 502, 388][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Statistical dashboards ────────────────────────────────────────────────────
function StatisticalDashboards() {
  return (
    <div className="space-y-6">
      {/* Monthly circulation trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base">Monthly circulation trend — 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyCirculation} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gCheckouts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReturns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="checkouts" name="Checkouts" stroke="var(--color-chart-1)" fill="url(#gCheckouts)" strokeWidth={2} />
              <Area type="monotone" dataKey="returns" name="Returns" stroke="var(--color-chart-2)" fill="url(#gReturns)" strokeWidth={2} />
              <Line type="monotone" dataKey="renewals" name="Renewals" stroke="var(--color-chart-3)" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top titles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Top 5 circulated titles (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topTitles} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="checkouts" name="Checkouts" fill="var(--color-chart-2)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fines by branch */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Fines: assessed vs. collected by branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={finesByBranch} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => `$${v}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="fines" name="Assessed" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total checkouts YTD" value="5,379" accent="accent" />
        <StatCard label="Avg loans / day" value="29.4" />
        <StatCard label="Renewal rate" value="24.8%" accent="success" />
        <StatCard label="Holds fulfilled" value="92.1%" accent="success" />
      </div>
    </div>
  );
}

// ─── Main Reports component ───────────────────────────────────────────────────
function Reports() {
  const [sql, setSql] = useState(sampleQuery);
  const [results, setResults] = useState<typeof sampleResult | null>(null);

  return (
    <PageShell title="Reports" description="SQL editor, guided wizard, saved reports and statistical dashboards.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved reports" value={savedReports.length} />
        <StatCard label="Scheduled" value={3} accent="accent" />
        <StatCard label="Run this month" value={284} />
        <StatCard label="Avg runtime" value="0.4s" accent="success" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="sql">
          <TabsList>
            <TabsTrigger value="sql">SQL editor</TabsTrigger>
            <TabsTrigger value="wizard">Report wizard</TabsTrigger>
            <TabsTrigger value="stats"><BarChart2 className="mr-1.5 h-4 w-4" />Statistics</TabsTrigger>
          </TabsList>

          {/* ── SQL editor ── */}
          <TabsContent value="sql" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="font-serif">SQL editor</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSql(sampleQuery); setResults(null); }}>Reset</Button>
                    <Button size="sm" onClick={() => { setResults(sampleResult); toast.success("Query executed in 412 ms"); }}>
                      <Play className="mr-1.5 h-3.5 w-3.5" /> Run query
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={14} className="mono text-xs" />
                  {results && (
                    <div className="rounded-md border border-border">
                      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
                        <span className="text-muted-foreground">{results.length} rows · 412 ms</span>
                        <Button variant="ghost" size="sm" onClick={() => toast.success("Exported as CSV")}>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(results[0]).map((k) => <TableHead key={k} className="mono text-xs">{k}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((r, i) => (
                            <TableRow key={i}>
                              {Object.values(r).map((v, j) => <TableCell key={j} className="mono text-xs">{v as string | number}</TableCell>)}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Inline chart from SQL results */}
                      <div className="p-4 border-t border-border">
                        <div className="text-xs font-medium text-muted-foreground mb-3">Result visualisation</div>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={results} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                            <Bar dataKey="overdue_count" name="Overdue items" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="font-serif">Saved reports</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Scheduling interface coming soon")}>
                    <Calendar className="mr-1.5 h-3.5 w-3.5" /> Schedule
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {savedReports.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-sm">{r.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                            <span>last run {r.lastRun}</span>
                            <span>· {r.rows} rows</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setResults(sampleResult); setSql(sampleQuery); toast.success(`Running "${r.name}"`); }}>
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Guided wizard ── */}
          <TabsContent value="wizard" className="mt-4">
            <GuidedWizard />
          </TabsContent>

          {/* ── Statistical dashboards ── */}
          <TabsContent value="stats" className="mt-4">
            <StatisticalDashboards />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
