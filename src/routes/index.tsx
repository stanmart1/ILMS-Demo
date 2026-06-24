import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkouts, holds, budgets, subscriptions, bibRecords, patrons } from "@/lib/mock-data";
import { ArrowRightLeft, BookMarked, Newspaper, ShoppingCart } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Athenaeum" }] }),
  component: Dashboard,
});

// ─── Chart data ───────────────────────────────────────────────────────────────

const circulationByMonth = [
  { month: "Jan", checkouts: 842, returns: 810, renewals: 215 },
  { month: "Feb", checkouts: 765, returns: 790, renewals: 188 },
  { month: "Mar", checkouts: 910, returns: 875, renewals: 234 },
  { month: "Apr", checkouts: 1020, returns: 980, renewals: 290 },
  { month: "May", checkouts: 988, returns: 1005, renewals: 261 },
  { month: "Jun", checkouts: 854, returns: 820, renewals: 210 },
];

const collectionByFormat = [
  { name: "Books", value: 14200 },
  { name: "e-Books", value: 3400 },
  { name: "Audiobooks", value: 1800 },
  { name: "DVDs", value: 920 },
  { name: "Periodicals", value: 640 },
  { name: "Reference", value: 460 },
];

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.62 0.12 200)",
];

const patronRegistrations = [
  { month: "Jan", new: 42 }, { month: "Feb", new: 35 }, { month: "Mar", new: 58 },
  { month: "Apr", new: 71 }, { month: "May", new: 63 }, { month: "Jun", new: 47 },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const overdue = checkouts.filter((c) => c.status === "Overdue").length;
  const onLoan = checkouts.filter((c) => c.status === "On loan").length;
  const readyHolds = holds.filter((h) => h.status === "Ready for pickup").length;
  const activePatrons = patrons.filter((p) => p.status === "Active").length;
  const totalCopies = bibRecords.reduce((s, b) => s + b.copies, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.allocated, 0);
  const spentBudget = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <PageShell
      title="Good morning, Margaret"
      description="Tuesday, June 24, 2026 · Central Branch overview"
      actions={<Button asChild><Link to="/circulation">Open circulation desk</Link></Button>}
    >
      {/* ── Key metrics ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items on loan" value={onLoan} hint={`${overdue} overdue`} />
        <StatCard label="Holds ready" value={readyHolds} hint="Awaiting pickup" accent="accent" />
        <StatCard label="Active patrons" value={activePatrons.toLocaleString()} hint={`${patrons.length} total`} accent="success" />
        <StatCard label="Catalog items" value={totalCopies} hint={`${bibRecords.length} titles`} />
      </div>

      {/* ── Analytics charts ── */}
      <div className="mt-6">
        <Tabs defaultValue="circulation">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold">Analytics</h2>
            <TabsList>
              <TabsTrigger value="circulation">Circulation</TabsTrigger>
              <TabsTrigger value="collection">Collection</TabsTrigger>
              <TabsTrigger value="patrons">Patrons</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="circulation">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base">Circulation activity — Jan to Jun 2026</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={circulationByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="checkouts" name="Checkouts" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="returns" name="Returns" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="renewals" name="Renewals" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-base">Collection by format</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={collectionByFormat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {collectionByFormat.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => v.toLocaleString()} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-base">Budget utilisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted-foreground">FY 2026 total spend</span>
                      <span className="font-mono">₦{spentBudget.toLocaleString()} / ₦{totalBudget.toLocaleString()}</span>
                    </div>
                    <Progress value={(spentBudget / totalBudget) * 100} className="mt-2" />
                  </div>
                  <ul className="space-y-3">
                    {budgets.map((b) => {
                      const pct = (b.spent / b.allocated) * 100;
                      return (
                        <li key={b.fund}>
                          <div className="flex justify-between text-xs">
                            <span>{b.fund}</span>
                            <span className="mono text-muted-foreground">{pct.toFixed(0)}%</span>
                          </div>
                          <Progress value={pct} className="mt-1 h-1.5" />
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patrons">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base">New patron registrations — Jan to Jun 2026</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={patronRegistrations} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="new" name="New registrations" stroke="var(--color-chart-2)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Today's activity ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-serif">Today at the circulation desk</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/circulation">View all</Link></Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {checkouts.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.patron} · {c.cardNumber} · due {c.dueDate}</div>
                  </div>
                  <Badge variant={c.status === "Overdue" ? "destructive" : "secondary"}>{c.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-serif">Budget at a glance</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">FY 2026 spend</span>
                <span className="font-mono text-sm">₦{spentBudget.toLocaleString()} / ₦{totalBudget.toLocaleString()}</span>
              </div>
              <Progress value={(spentBudget / totalBudget) * 100} className="mt-2" />
            </div>
            <ul className="space-y-3">
              {budgets.slice(0, 4).map((b) => {
                const pct = (b.spent / b.allocated) * 100;
                return (
                  <li key={b.fund}>
                    <div className="flex justify-between text-xs">
                      <span>{b.fund}</span>
                      <span className="mono text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="mt-1 h-1.5" />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/circulation", label: "Check out / Return", icon: ArrowRightLeft, desc: "Loans, returns & renewals" },
          { to: "/cataloging", label: "Catalog a title", icon: BookMarked, desc: "MARC21 / UNIMARC editor" },
          { to: "/acquisitions", label: "Create order", icon: ShoppingCart, desc: "Purchase orders & funds" },
          { to: "/serials", label: "Check in issue", icon: Newspaper, desc: "Periodicals & claims" },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-accent hover:shadow-md">
            <q.icon className="h-5 w-5 text-accent" />
            <div className="mt-3 font-medium">{q.label}</div>
            <div className="text-xs text-muted-foreground">{q.desc}</div>
          </Link>
        ))}
      </div>

      {/* ── Serials & Holds ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-serif">Upcoming serial issues</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {subscriptions.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium text-sm">{s.title}</div>
                    <div className="text-xs text-muted-foreground mono">ISSN {s.issn} · {s.frequency}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">next</div>
                    <div className="text-sm mono">{s.nextIssue}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-serif">Holds queue</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {holds.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium text-sm">{h.title}</div>
                    <div className="text-xs text-muted-foreground">{h.patron} · pickup at {h.pickupBranch}</div>
                  </div>
                  <Badge variant={h.status === "Ready for pickup" ? "default" : "outline"}>{h.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
