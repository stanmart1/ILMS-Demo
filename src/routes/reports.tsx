import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Athenaeum" }] }),
  component: Reports,
});

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

function Reports() {
  const [sql, setSql] = useState(sampleQuery);
  const [results, setResults] = useState<typeof sampleResult | null>(null);

  return (
    <PageShell title="Reports" description="Run saved reports or write SQL against the library data warehouse.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved reports" value={savedReports.length} />
        <StatCard label="Scheduled" value={3} accent="accent" />
        <StatCard label="Run this month" value={284} />
        <StatCard label="Avg runtime" value="0.4s" accent="success" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-serif">SQL editor</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSql(sampleQuery); setResults(null); }}>Reset</Button>
              <Button size="sm" onClick={() => { setResults(sampleResult); toast.success("Query executed in 412 ms"); }}>Run query</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={14} className="mono text-xs" />
            {results && (
              <div className="rounded-md border border-border">
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{results.length} rows · 412 ms</span>
                  <Button variant="ghost" size="sm" onClick={() => toast.success("Exported as CSV")}>Export CSV</Button>
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
                        {Object.values(r).map((v, j) => <TableCell key={j} className="mono text-xs">{v as any}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif">Saved reports</CardTitle></CardHeader>
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
                  <Button size="sm" variant="ghost" onClick={() => toast.success(`Running “${r.name}”`)}>Run</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
