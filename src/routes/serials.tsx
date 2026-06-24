import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  subscriptions as seedSubscriptions,
  serialIssues as seedSerialIssues,
  routingSlips as seedRoutingSlips,
} from "@/lib/mock-data";
import type { Subscription, SerialIssue, RoutingSlip } from "@/lib/mock-data";
import { toast } from "sonner";
import { FileText, Plus, RefreshCw, Send, Share2, CalendarDays, Pencil } from "lucide-react";

export const Route = createFileRoute("/serials")({
  head: () => ({ meta: [{ title: "Serials — Athenaeum" }] }),
  component: Serials,
});

// ─── Prediction Patterns ──────────────────────────────────────────────────────
type FreqConfig = {
  interval: number;        // days between issues
  publishDay: string;      // "Monday" | "1" | "15" etc.
  graceDays: number;
};

const FREQ_DEFAULTS: Record<Subscription["frequency"], FreqConfig> = {
  Weekly:    { interval: 7,   publishDay: "Monday",  graceDays: 3 },
  Monthly:   { interval: 30,  publishDay: "1",       graceDays: 7 },
  Quarterly: { interval: 91,  publishDay: "1",       graceDays: 14 },
  Annual:    { interval: 365, publishDay: "January", graceDays: 30 },
};

function generateExpected(start: string, freq: FreqConfig, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  for (let i = 0; i < count; i++) {
    d.setDate(d.getDate() + freq.interval);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const patternSchema = z.object({
  interval: z.coerce.number().min(1, "Must be ≥ 1").max(400),
  publishDay: z.string().min(1, "Required"),
  graceDays: z.coerce.number().min(0).max(90),
});
type PatternForm = z.infer<typeof patternSchema>;

function PredictionPatternsTab({ subscriptions }: { subscriptions: Subscription[] }) {
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [configs, setConfigs] = useState<Record<string, FreqConfig>>(() =>
    Object.fromEntries(subscriptions.map((s) => [s.id, { ...FREQ_DEFAULTS[s.frequency] }]))
  );
  const [editOpen, setEditOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState(6);

  const form = useForm<PatternForm>({
    resolver: zodResolver(patternSchema),
    defaultValues: { interval: 30, publishDay: "1", graceDays: 7 },
  });

  const openEdit = (sub: Subscription) => {
    setSelected(sub);
    const cfg = configs[sub.id] ?? FREQ_DEFAULTS[sub.frequency];
    form.reset(cfg);
    setEditOpen(true);
  };

  const onSave = (data: PatternForm) => {
    if (!selected) return;
    setConfigs((prev) => ({ ...prev, [selected.id]: data }));
    toast.success(`Prediction pattern saved for "${selected.title}"`);
    setEditOpen(false);
  };

  const preview = selected ? generateExpected(selected.nextIssue, configs[selected.id] ?? FREQ_DEFAULTS[selected.frequency], previewCount) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Subscription prediction patterns</CardTitle>
          <p className="text-sm text-muted-foreground">Configure the expected issue schedule for each subscription. Click a row to preview upcoming issues.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Interval (days)</TableHead>
                <TableHead>Publish day</TableHead>
                <TableHead>Grace days</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const cfg = configs[sub.id] ?? FREQ_DEFAULTS[sub.frequency];
                return (
                  <TableRow
                    key={sub.id}
                    className={`cursor-pointer ${selected?.id === sub.id ? "bg-muted/50" : ""}`}
                    onClick={() => setSelected(sub)}
                  >
                    <TableCell className="font-medium">{sub.title}</TableCell>
                    <TableCell><Badge variant="outline">{sub.frequency}</Badge></TableCell>
                    <TableCell className="mono">{cfg.interval}</TableCell>
                    <TableCell>{cfg.publishDay}</TableCell>
                    <TableCell>{cfg.graceDays} days</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(sub); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-serif text-base">
              <CalendarDays className="mr-2 inline-block h-4 w-4 text-muted-foreground" />
              Next {previewCount} expected issues — {selected.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show</span>
              {[4, 6, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setPreviewCount(n)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${previewCount === n ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                >{n}</button>
              ))}
              <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit pattern
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {preview.map((date, i) => (
                <div key={date} className="rounded-md border border-border bg-card p-3 text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Issue {i + 1}</div>
                  <div className="font-mono text-sm font-semibold">{date}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(date) < new Date() ? (
                      <span className="text-destructive">Past due</span>
                    ) : (
                      <>in {Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)} days</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit prediction pattern</DialogTitle>
            {selected && <p className="text-sm text-muted-foreground">{selected.title} · {selected.frequency}</p>}
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interval (days between issues)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publishDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish day / month</FormLabel>
                    <FormControl><Input placeholder="e.g. Monday, 1, 15, January" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="graceDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace days before marking late</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save pattern</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysLate(expected: string): number {
  const diff = Math.floor(
    (Date.now() - new Date(expected).getTime()) / 86_400_000,
  );
  return Math.max(0, diff);
}

function addPeriod(
  dateStr: string,
  frequency: Subscription["frequency"],
): string {
  const d = new Date(dateStr);
  switch (frequency) {
    case "Weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "Monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "Quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "Annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

const RENEWAL_COST: Record<Subscription["frequency"], number> = {
  Weekly: 520,
  Monthly: 144,
  Quarterly: 80,
  Annual: 45,
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const newSubSchema = z.object({
  title: z.string().min(1, "Title is required"),
  issn: z
    .string()
    .regex(/^\d{4}-\d{3}[\dX]$/i, "Format must be XXXX-XXXX"),
  vendor: z.string().min(1, "Vendor is required"),
  frequency: z.enum(["Weekly", "Monthly", "Quarterly", "Annual"]),
  startDate: z.string().min(1, "Start date is required"),
});
type NewSubValues = z.infer<typeof newSubSchema>;

const newRoutingSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription is required"),
  recipients: z.string().min(1, "Enter at least one recipient"),
  returnBy: z.string().min(1, "Return date is required"),
});
type NewRoutingValues = z.infer<typeof newRoutingSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

function Serials() {
  // ── State ──
  const [subs, setSubs] = useState<Subscription[]>(seedSubscriptions);
  const [issues, setIssues] = useState<SerialIssue[]>(seedSerialIssues);
  const [slips, setSlips] = useState<RoutingSlip[]>(seedRoutingSlips);

  // ── Dialog visibility ──
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);
  const [claimTarget, setClaimTarget] = useState<SerialIssue | null>(null);
  const [claimLetter, setClaimLetter] = useState("");
  const [newRoutingOpen, setNewRoutingOpen] = useState(false);

  // ── Stats ──
  const active = subs.filter((s) => s.status === "Active").length;
  const lapsed = subs.filter((s) => s.status === "Lapsed").length;
  const lateClaimed = issues.filter(
    (i) => i.status === "Late" || i.status === "Claimed",
  ).length;

  // ── Forms ──
  const newSubForm = useForm<NewSubValues>({
    resolver: zodResolver(newSubSchema),
    defaultValues: {
      title: "",
      issn: "",
      vendor: "",
      frequency: "Monthly",
      startDate: "",
    },
  });

  const newRoutingForm = useForm<NewRoutingValues>({
    resolver: zodResolver(newRoutingSchema),
    defaultValues: { subscriptionId: "", recipients: "", returnBy: "" },
  });

  // ─── New subscription ────────────────────────────────────────────────────

  function handleNewSub(values: NewSubValues) {
    const next = addPeriod(values.startDate, values.frequency);
    const newSub: Subscription = {
      id: `s${Date.now()}`,
      title: values.title,
      issn: values.issn,
      vendor: values.vendor,
      frequency: values.frequency,
      nextIssue: next,
      lastReceived: values.startDate,
      status: "Active",
    };
    setSubs((prev) => [...prev, newSub]);
    toast.success(`Subscription to "${values.title}" created`);
    setNewSubOpen(false);
    newSubForm.reset();
  }

  // ─── Renewal ─────────────────────────────────────────────────────────────

  function handleRenew(sub: Subscription) {
    const today = new Date().toISOString().slice(0, 10);
    setSubs((prev) =>
      prev.map((s) =>
        s.id === sub.id
          ? { ...s, status: "Active", nextIssue: addPeriod(today, s.frequency) }
          : s,
      ),
    );
    toast.success(`"${sub.title}" renewed for another year`);
    setRenewTarget(null);
  }

  // ─── Issue check-in ───────────────────────────────────────────────────────

  function handleCheckIn(issue: SerialIssue) {
    const today = new Date().toISOString().slice(0, 10);
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issue.id
          ? { ...i, status: "Received", received: today }
          : i,
      ),
    );
    toast.success(`${issue.title} ${issue.issue} checked in`);
  }

  // ─── Claims ──────────────────────────────────────────────────────────────

  function openClaim(issue: SerialIssue) {
    const vendor =
      subs.find((s) => s.title === issue.title)?.vendor ?? "your vendor";
    setClaimLetter(
      `Dear ${vendor},\n\nWe have not received ${issue.title} issue ${issue.issue} expected ${issue.expected}. Please arrange resupply or credit.\n\nRegards,\nAthenaeum Library`,
    );
    setClaimTarget(issue);
  }

  function handleSendClaim() {
    if (!claimTarget) return;
    setIssues((prev) =>
      prev.map((i) =>
        i.id === claimTarget.id ? { ...i, status: "Claimed" } : i,
      ),
    );
    toast.success(
      `Claim sent to vendor for ${claimTarget.title} ${claimTarget.issue}`,
    );
    setClaimTarget(null);
  }

  function handleClaimAll() {
    const lateIssues = issues.filter((i) => i.status === "Late");
    if (lateIssues.length === 0) return;
    setIssues((prev) =>
      prev.map((i) => (i.status === "Late" ? { ...i, status: "Claimed" } : i)),
    );
    toast.success(
      `Claims generated for ${lateIssues.length} late issue${lateIssues.length !== 1 ? "s" : ""}`,
    );
  }

  const claimableIssues = issues.filter(
    (i) => i.status === "Late" || i.status === "Claimed",
  );

  // ─── Routing slips ────────────────────────────────────────────────────────

  function handleMarkReturned(slip: RoutingSlip) {
    const idx = slip.recipients.indexOf(slip.currentHolder);
    const next = slip.recipients[idx + 1];
    if (next) {
      setSlips((prev) =>
        prev.map((s) =>
          s.id === slip.id ? { ...s, currentHolder: next } : s,
        ),
      );
      toast.success(`Routing slip for "${slip.title}" advanced to ${next}`);
    } else {
      setSlips((prev) =>
        prev.map((s) =>
          s.id === slip.id ? { ...s, status: "Complete" } : s,
        ),
      );
      toast.success(`Routing slip for "${slip.title}" marked complete`);
    }
  }

  function handleNewRouting(values: NewRoutingValues) {
    const sub = subs.find((s) => s.id === values.subscriptionId);
    if (!sub) return;
    const recipientList = values.recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const newSlip: RoutingSlip = {
      id: `rs${Date.now()}`,
      subscriptionId: values.subscriptionId,
      title: sub.title,
      recipients: recipientList,
      currentHolder: recipientList[0] ?? "",
      returnBy: values.returnBy,
      status: "Active",
    };
    setSlips((prev) => [...prev, newSlip]);
    toast.success(`Routing slip for "${sub.title}" created`);
    setNewRoutingOpen(false);
    newRoutingForm.reset();
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Serials"
      description="Periodicals, subscription tracking and issue check-in."
    >
      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active subscriptions" value={active} accent="success" />
        <StatCard label="Lapsed" value={lapsed} accent="destructive" />
        <StatCard label="Late or claimed" value={lateClaimed} accent="warning" />
        <StatCard label="Tracked titles" value={subs.length} />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="subs">
          <div className="w-full overflow-x-auto pb-1">
            <TabsList className="w-max min-w-full">
              <TabsTrigger value="subs">Subscriptions</TabsTrigger>
              <TabsTrigger value="issues">Issue check-in</TabsTrigger>
              <TabsTrigger value="claims">Claims</TabsTrigger>
              <TabsTrigger value="routing">Routing</TabsTrigger>
              <TabsTrigger value="patterns"><CalendarDays className="mr-1.5 h-4 w-4" />Prediction patterns</TabsTrigger>
            </TabsList>
          </div>

          {/* ════ Subscriptions tab ════ */}
          <TabsContent value="subs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-serif">Subscriptions</CardTitle>
                <Button size="sm" onClick={() => setNewSubOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  New subscription
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="mono">ISSN</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next issue</TableHead>
                      <TableHead>Last received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="mono text-xs">{s.issn}</TableCell>
                        <TableCell>{s.vendor}</TableCell>
                        <TableCell>{s.frequency}</TableCell>
                        <TableCell className="mono text-xs">{s.nextIssue}</TableCell>
                        <TableCell className="mono text-xs">{s.lastReceived}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              s.status === "Active"
                                ? "default"
                                : s.status === "Lapsed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(s.status === "Lapsed" ||
                            s.status === "Renewing") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRenewTarget(s)}
                            >
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Renew
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════ Issue check-in tab ════ */}
          <TabsContent value="issues" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">
                  Expected & received issues
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.title}</TableCell>
                        <TableCell>{i.issue}</TableCell>
                        <TableCell className="mono text-xs">{i.expected}</TableCell>
                        <TableCell className="mono text-xs">
                          {i.received ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              i.status === "Received"
                                ? "default"
                                : i.status === "Late" || i.status === "Claimed"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {i.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {i.status !== "Received" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(i)}
                            >
                              Check in
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════ Claims tab ════ */}
          <TabsContent value="claims" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-serif">Claims</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={issues.filter((i) => i.status === "Late").length === 0}
                  onClick={handleClaimAll}
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  Claim all late
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {claimableIssues.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No late or claimed issues at this time.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Expected date</TableHead>
                        <TableHead>Days late</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claimableIssues.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">{i.title}</TableCell>
                          <TableCell>{i.issue}</TableCell>
                          <TableCell className="mono text-xs">{i.expected}</TableCell>
                          <TableCell className="mono text-xs">
                            {daysLate(i.expected)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                i.status === "Claimed" ? "secondary" : "destructive"
                              }
                            >
                              {i.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openClaim(i)}
                            >
                              <FileText className="mr-1.5 h-3.5 w-3.5" />
                              Generate claim
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════ Routing tab ════ */}
          <TabsContent value="routing" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-serif">Routing slips</CardTitle>
                <Button size="sm" onClick={() => setNewRoutingOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  New routing slip
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Current holder</TableHead>
                      <TableHead>Return by</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slips.map((slip) => (
                      <TableRow key={slip.id}>
                        <TableCell className="font-medium">{slip.title}</TableCell>
                        <TableCell className="text-xs">
                          {slip.recipients.join(", ")}
                        </TableCell>
                        <TableCell>{slip.currentHolder}</TableCell>
                        <TableCell className="mono text-xs">{slip.returnBy}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              slip.status === "Active" ? "default" : "secondary"
                            }
                          >
                            {slip.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {slip.status === "Active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkReturned(slip)}
                            >
                              <Share2 className="mr-1.5 h-3.5 w-3.5" />
                              Mark returned
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════ Prediction patterns tab ════ */}
          <TabsContent value="patterns" className="mt-4">
            <PredictionPatternsTab subscriptions={subs} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ════ New Subscription Dialog ════ */}
      <Dialog
        open={newSubOpen}
        onOpenChange={(open) => {
          setNewSubOpen(open);
          if (!open) newSubForm.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New subscription</DialogTitle>
          </DialogHeader>
          <Form {...newSubForm}>
            <form
              onSubmit={newSubForm.handleSubmit(handleNewSub)}
              className="space-y-4"
            >
              <FormField
                control={newSubForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. The Lancet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newSubForm.control}
                name="issn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISSN</FormLabel>
                    <FormControl>
                      <Input placeholder="XXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newSubForm.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. EBSCO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newSubForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newSubForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewSubOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add subscription</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ════ Renewal AlertDialog ════ */}
      <AlertDialog
        open={!!renewTarget}
        onOpenChange={(open) => {
          if (!open) setRenewTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Renew <strong>{renewTarget?.title}</strong> for another year?{" "}
              {renewTarget && (
                <>
                  Cost:{" "}
                  <strong>
                    ${RENEWAL_COST[renewTarget.frequency].toLocaleString()}
                  </strong>
                  .
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => renewTarget && handleRenew(renewTarget)}
            >
              Confirm renewal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════ Claim letter Dialog ════ */}
      <Dialog
        open={!!claimTarget}
        onOpenChange={(open) => {
          if (!open) setClaimTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Generate claim — {claimTarget?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="claim-letter">Claim letter</Label>
            <Textarea
              id="claim-letter"
              className="min-h-[200px] font-mono text-sm"
              value={claimLetter}
              onChange={(e) => setClaimLetter(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimTarget(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendClaim}>
              <Send className="mr-1.5 h-4 w-4" />
              Send claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ New Routing Slip Dialog ════ */}
      <Dialog
        open={newRoutingOpen}
        onOpenChange={(open) => {
          setNewRoutingOpen(open);
          if (!open) newRoutingForm.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New routing slip</DialogTitle>
          </DialogHeader>
          <Form {...newRoutingForm}>
            <form
              onSubmit={newRoutingForm.handleSubmit(handleNewRouting)}
              className="space-y-4"
            >
              <FormField
                control={newRoutingForm.control}
                name="subscriptionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a title" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subs
                          .filter((s) => s.status === "Active")
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newRoutingForm.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipients (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alice, Bob, Carol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newRoutingForm.control}
                name="returnBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return by</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewRoutingOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create routing slip</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
