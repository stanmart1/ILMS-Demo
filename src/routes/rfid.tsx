import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import JsBarcode from "jsbarcode";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  rfidTags as initialTags,
  gateEvents as initialGateEvents,
  patrons,
} from "@/lib/mock-data";
import type { RFIDTag, GateEvent } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Cpu,
  Tag,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  LogOut,
  Trash2,
  Plus,
  RotateCcw,
  ArrowRightLeft,
  ShoppingCart,
  User,
  XCircle,
  ScanLine,
} from "lucide-react";
import { DataPagination, usePagination } from "@/components/data-pagination";

export const Route = createFileRoute("/rfid")({
  head: () => ({ meta: [{ title: "RFID & Barcode — Athenaeum" }] }),
  component: RFIDPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genTagId() {
  const hex = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
  return `E200-3412-${hex()}-${hex()}`;
}

function statusBadge(status: RFIDTag["status"]) {
  const map: Record<RFIDTag["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    Active:       { label: "Active",       variant: "default" },
    Deactivated:  { label: "Deactivated",  variant: "secondary" },
    Lost:         { label: "Lost",         variant: "destructive" },
    Unlinked:     { label: "Unlinked",     variant: "outline" },
  };
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

// ─── Barcode SVG (Code 128) ───────────────────────────────────────────────────

function BarcodeImage({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const render = useCallback(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 1.8,
        height: 48,
        displayValue: true,
        fontSize: 11,
        margin: 6,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      // invalid value — leave blank
    }
  }, [value]);
  useEffect(() => { render(); }, [render]);
  return <svg ref={svgRef} className="w-full" />;
}

// ─── Program tag dialog ───────────────────────────────────────────────────────

function ProgramTagDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (tag: RFIDTag) => void;
}) {
  const [barcode, setBarcode] = useState("");
  const [title, setTitle]     = useState("");

  const reset = () => { setBarcode(""); setTitle(""); };

  const handleSave = () => {
    if (!barcode.trim()) return toast.error("Barcode is required");
    if (!title.trim())   return toast.error("Title is required");
    const tag: RFIDTag = {
      id:           `rf${Date.now()}`,
      barcode:      barcode.trim(),
      title:        title.trim(),
      tagId:        genTagId(),
      status:       "Active",
      programmedAt: new Date().toISOString().slice(0, 10),
      lastSeen:     new Date().toISOString().slice(0, 10),
    };
    onSave(tag);
    reset();
    onOpenChange(false);
    toast.success("Tag programmed", { description: tag.tagId });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Program new RFID tag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Item barcode</Label>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="31901-00xxx"
              className="mono mt-1"
            />
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title"
              className="mt-1"
            />
          </div>
          {barcode && (
            <div className="rounded border border-border bg-white p-2">
              <BarcodeImage value={barcode} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSave}>
            <Cpu className="mr-1.5 h-4 w-4" />
            Program tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Simulate gate event dialog ───────────────────────────────────────────────

function SimulateGateDialog({
  open,
  onOpenChange,
  tags,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tags: RFIDTag[];
  onAdd: (ev: GateEvent) => void;
}) {
  const [tagId, setTagId]         = useState("");
  const [direction, setDirection] = useState<"Exit" | "Entry">("Exit");

  const handleAdd = () => {
    const tag = tags.find((t) => t.tagId === tagId);
    if (!tag) return toast.error("Select a tag");
    const alarm = tag.status !== "Active";
    const ev: GateEvent = {
      id:             `ge${Date.now()}`,
      timestamp:      new Date().toLocaleString("sv-SE").replace("T", " "),
      tagId:          tag.tagId,
      title:          tag.title,
      barcode:        tag.barcode,
      direction,
      alarmTriggered: alarm,
    };
    onAdd(ev);
    onOpenChange(false);
    setTagId("");
    if (alarm) {
      toast.error("Security alarm triggered!", {
        description: `"${tag.title}" — tag status: ${tag.status}`,
        duration: 6000,
      });
    } else {
      toast.success(`Gate event logged — ${direction}`, {
        description: tag.title,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Simulate gate event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tag</Label>
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a tag…" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.tagId}>
                    <span className="mono text-xs">{t.tagId}</span>
                    <span className="ml-2 text-muted-foreground text-xs">— {t.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "Exit" | "Entry")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Exit">Exit (leaving library)</SelectItem>
                <SelectItem value="Entry">Entry (returning item)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>
            <ArrowRightLeft className="mr-1.5 h-4 w-4" />
            Simulate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tag Management tab ───────────────────────────────────────────────────────

function TagManagementTab() {
  const [tags, setTags]           = useState<RFIDTag[]>(initialTags);
  const [programOpen, setProgramOpen] = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const active      = tags.filter((t) => t.status === "Active").length;
  const deactivated = tags.filter((t) => t.status === "Deactivated").length;
  const lost        = tags.filter((t) => t.status === "Lost").length;

  const setStatus = (id: string, status: RFIDTag["status"]) => {
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    toast.success(`Tag ${status.toLowerCase()}`);
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tag removed");
    setDeleteId(null);
  };

  const { page, pageSize, setPage, paged, totalPages } = usePagination(tags, 8);

  return (
    <div className="space-y-6">
      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total tags"   value={tags.length}  icon={<Tag className="h-5 w-5" />} />
        <StatCard title="Active"       value={active}       icon={<Wifi className="h-5 w-5" />} />
        <StatCard title="Deactivated"  value={deactivated}  icon={<WifiOff className="h-5 w-5" />} />
        <StatCard title="Lost"         value={lost}         icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="font-serif text-base">RFID Tags</CardTitle>
          <Button size="sm" onClick={() => setProgramOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Program new tag
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="mono">Tag ID</TableHead>
                  <TableHead className="mono">Barcode</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Programmed</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="mono text-xs">{tag.tagId}</TableCell>
                    <TableCell className="mono text-xs">{tag.barcode}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[180px] truncate">{tag.title}</TableCell>
                    <TableCell>{statusBadge(tag.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tag.programmedAt}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tag.lastSeen ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {tag.status !== "Active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setStatus(tag.id, "Active")}
                            title="Activate"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {tag.status === "Active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setStatus(tag.id, "Deactivated")}
                            title="Deactivate"
                          >
                            <WifiOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(tag.id)}
                          title="Remove tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={tags.length}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ProgramTagDialog
        open={programOpen}
        onOpenChange={setProgramOpen}
        onSave={(tag) => setTags((prev) => [tag, ...prev])}
      />

      <AlertDialog open={!!deleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove RFID tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the tag record. The physical tag will
              not be erased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteTag(deleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Self-checkout kiosk tab ──────────────────────────────────────────────────

type KioskItem = { barcode: string; title: string; tagId: string };

function SelfCheckoutTab() {
  const [step, setStep]         = useState<"card" | "items" | "done">("card");
  const [cardInput, setCardInput] = useState("");
  const [patron, setPatron]     = useState<(typeof patrons)[0] | null>(null);
  const [items, setItems]       = useState<KioskItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [tags]                  = useState<RFIDTag[]>(initialTags);

  const resetKiosk = () => {
    setStep("card");
    setCardInput("");
    setPatron(null);
    setItems([]);
    setBarcodeInput("");
  };

  const handleScanCard = () => {
    const p = patrons.find((x) => x.cardNumber === cardInput.trim());
    if (!p) return toast.error("Card not found");
    if (p.status !== "Active") return toast.error(`Patron account is ${p.status.toLowerCase()}`);
    setPatron(p);
    setStep("items");
  };

  const handleScanItem = () => {
    const bc = barcodeInput.trim();
    if (!bc) return;
    if (items.some((i) => i.barcode === bc)) {
      setBarcodeInput("");
      return toast.warning("Item already added");
    }
    const tag = tags.find((t) => t.barcode === bc);
    if (!tag) return toast.error("No RFID tag found for that barcode");
    if (tag.status !== "Active") return toast.error("Tag is not active — please see a librarian");
    setItems((prev) => [...prev, { barcode: bc, title: tag.title, tagId: tag.tagId }]);
    setBarcodeInput("");
  };

  const handleCheckout = () => {
    if (items.length === 0) return toast.warning("No items scanned");
    const due = new Date();
    due.setDate(due.getDate() + 28);
    setStep("done");
    toast.success(`${items.length} item${items.length !== 1 ? "s" : ""} checked out`, {
      description: `Due ${due.toLocaleDateString()}`,
    });
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg">
        {/* kiosk frame */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-4 px-6">
            <div className="flex items-center gap-3">
              <ScanLine className="h-6 w-6" />
              <div>
                <div className="font-serif font-semibold text-lg">Self-Checkout</div>
                <div className="text-xs opacity-80">Athenaeum Library</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 min-h-[380px]">
            {/* Step 1 — scan patron card */}
            {step === "card" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-4">
                  <User className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">Scan your library card</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Hold your card over the reader or enter your card number below.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Card number</Label>
                  <div className="flex gap-2">
                    <Input
                      value={cardInput}
                      onChange={(e) => setCardInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScanCard()}
                      placeholder="C-000000"
                      className="mono"
                    />
                    <Button onClick={handleScanCard}>
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — scan items */}
            {step === "items" && patron && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{patron.name}</p>
                    <p className="text-xs text-muted-foreground mono">{patron.cardNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 text-xs"
                    onClick={resetKiosk}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Scan item barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScanItem()}
                      placeholder="31901-00xxx"
                      className="mono"
                      autoFocus
                    />
                    <Button onClick={handleScanItem}>
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Items to check out ({items.length})
                    </p>
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {items.map((item) => (
                        <div key={item.barcode} className="flex items-center gap-3 px-3 py-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground mono">{item.barcode}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-1.5 text-destructive hover:text-destructive"
                            onClick={() =>
                              setItems((prev) => prev.filter((i) => i.barcode !== item.barcode))
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No items scanned yet</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Check out {items.length > 0 ? `(${items.length})` : ""}
                </Button>
              </div>
            )}

            {/* Step 3 — done */}
            {step === "done" && patron && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-serif font-semibold text-lg">Checkout complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {items.length} item{items.length !== 1 ? "s" : ""} checked out to{" "}
                    <strong>{patron.name}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due{" "}
                    {new Date(
                      Date.now() + 28 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="w-full rounded-lg border border-border divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.barcode} className="flex items-center gap-3 px-3 py-2 text-left">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mono">{item.barcode}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={resetKiosk}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Having trouble? Please see a staff member at the circulation desk.
        </p>
      </div>
    </div>
  );
}

// ─── Security Gate tab ────────────────────────────────────────────────────────

function SecurityGateTab() {
  const [events, setEvents]           = useState<GateEvent[]>(initialGateEvents);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [tags]                        = useState<RFIDTag[]>(initialTags);

  const alarms   = events.filter((e) => e.alarmTriggered).length;
  const exits    = events.filter((e) => e.direction === "Exit").length;
  const entries  = events.filter((e) => e.direction === "Entry").length;

  const { page, pageSize, setPage, paged, totalPages } = usePagination(events, 10);

  return (
    <div className="space-y-6">
      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total events"   value={events.length} icon={<ArrowRightLeft className="h-5 w-5" />} />
        <StatCard title="Alarms"         value={alarms}        icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard title="Exits"          value={exits}         icon={<LogOut className="h-5 w-5" />} />
        <StatCard title="Entries"        value={entries}       icon={<LogIn className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="font-serif text-base">Gate event log</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setSimulateOpen(true)}>
            <ArrowRightLeft className="mr-1.5 h-4 w-4" />
            Simulate event
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="mono">Tag ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="mono">Barcode</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Alarm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((ev) => (
                  <TableRow
                    key={ev.id}
                    className={ev.alarmTriggered ? "bg-destructive/5" : undefined}
                  >
                    <TableCell className="text-xs text-muted-foreground mono whitespace-nowrap">
                      {ev.timestamp}
                    </TableCell>
                    <TableCell className="mono text-xs">{ev.tagId}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[160px] truncate">
                      {ev.title}
                    </TableCell>
                    <TableCell className="mono text-xs">{ev.barcode}</TableCell>
                    <TableCell>
                      {ev.direction === "Exit" ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                          Exit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                          Entry
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ev.alarmTriggered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <ShieldAlert className="h-4 w-4" />
                          Alarm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldCheck className="h-4 w-4" />
                          Clear
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={events.length}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <SimulateGateDialog
        open={simulateOpen}
        onOpenChange={setSimulateOpen}
        tags={tags}
        onAdd={(ev) => setEvents((prev) => [ev, ...prev])}
      />
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

function RFIDPage() {
  return (
    <PageShell
      title="RFID & Barcode"
      description="Tag management, self-checkout kiosk, and security gate monitoring"
    >
      <Tabs defaultValue="tags">
        <TabsList className="mb-6">
          <TabsTrigger value="tags">
            <Tag className="mr-1.5 h-4 w-4" />
            Tag management
          </TabsTrigger>
          <TabsTrigger value="kiosk">
            <ScanLine className="mr-1.5 h-4 w-4" />
            Self-checkout kiosk
          </TabsTrigger>
          <TabsTrigger value="gate">
            <ShieldAlert className="mr-1.5 h-4 w-4" />
            Security gate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags">
          <TagManagementTab />
        </TabsContent>

        <TabsContent value="kiosk">
          <SelfCheckoutTab />
        </TabsContent>

        <TabsContent value="gate">
          <SecurityGateTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
