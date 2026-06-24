import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { checkouts as initialCheckouts, holds as initialHolds, patrons, fines as initialFines } from "@/lib/mock-data";
import type { Checkout, Hold, Fine } from "@/lib/mock-data";
import { toast } from "sonner";
import { BookOpen, RotateCcw, RefreshCw, Bookmark, Search, User, DollarSign, X, AlertTriangle, ArrowRightLeft, SendHorizonal, CheckCircle2 } from "lucide-react";
import { DataPagination, usePagination } from "@/components/data-pagination";

export const Route = createFileRoute("/circulation")({
  head: () => ({ meta: [{ title: "Circulation — Athenaeum" }] }),
  component: Circulation,
});

// ─── Hold trap dialog when returning an item with a waiting hold ────────────
function HoldTrapDialog({ open, holdFor, onConfirm, onClose }: {
  open: boolean; holdFor: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" /> Hold waiting!
          </AlertDialogTitle>
          <AlertDialogDescription>
            This item has a hold for <strong>{holdFor}</strong>. Would you like to mark it as ready for pickup at the holds shelf?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Skip</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Mark ready for pickup</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Patron quick-view side panel ────────────────────────────────────────────
function PatronPanel({ patronId, open, onClose, checkouts, fines }: {
  patronId: string | null; open: boolean; onClose: () => void;
  checkouts: Checkout[]; fines: Fine[];
}) {
  const patron = patrons.find((p) => p.id === patronId);
  if (!patron) return null;
  const loans = checkouts.filter((c) => c.cardNumber === patron.cardNumber && c.status !== "Returned");
  const patronFines = fines.filter((f) => f.patronId === patron.id && !f.paid);
  const totalOwed = patronFines.reduce((s, f) => s + f.amount, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-serif">Patron account</SheetTitle>
        </SheetHeader>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-lg">
              {patron.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-serif text-lg font-semibold">{patron.name}</div>
              <div className="text-sm text-muted-foreground mono">{patron.cardNumber}</div>
              <div className="text-sm text-muted-foreground">{patron.email}</div>
              <div className="mt-1 flex gap-2">
                <Badge variant={patron.status === "Active" ? "default" : patron.status === "Suspended" ? "destructive" : "outline"}>{patron.status}</Badge>
                <Badge variant="secondary">{patron.category}</Badge>
              </div>
            </div>
          </div>
          <Separator />

          <div>
            <div className="mb-2 font-medium text-sm">Current loans ({loans.length})</div>
            {loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active loans.</p>
            ) : (
              <ul className="space-y-2">
                {loans.map((c) => (
                  <li key={c.id} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">Due {c.dueDate} · {c.renewals}/2 renewals</div>
                    <Badge className="mt-1" variant={c.status === "Overdue" ? "destructive" : "secondary"} >{c.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium text-sm">Outstanding fines</div>
              {totalOwed > 0 && <span className="text-destructive font-semibold text-sm">${totalOwed.toFixed(2)}</span>}
            </div>
            {patronFines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding fines.</p>
            ) : (
              <ul className="space-y-2">
                {patronFines.map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">{f.itemTitle}</div>
                      <div className="text-xs text-muted-foreground">{f.type} · {f.date}</div>
                    </div>
                    <span className="text-destructive font-mono font-medium">${f.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">Member since {patron.joined} · {patron.category} category · Joined branch: Central</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Place Hold dialog ────────────────────────────────────────────────────────
const holdSchema = z.object({
  patronCard: z.string().min(1, "Patron card required"),
  titleSearch: z.string().min(1, "Title is required"),
  pickupBranch: z.string().min(1, "Select a branch"),
});
type HoldForm = z.infer<typeof holdSchema>;

function PlaceHoldDialog({ open, onClose, onPlace }: {
  open: boolean; onClose: () => void;
  onPlace: (hold: Hold) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HoldForm>({ resolver: zodResolver(holdSchema) });

  const onSubmit = (data: HoldForm) => {
    const patron = patrons.find((p) => p.cardNumber === data.patronCard);
    if (!patron) { toast.error("Patron not found"); return; }
    const newHold: Hold = {
      id: `h${Date.now()}`,
      patron: patron.name,
      title: data.titleSearch,
      placed: new Date().toISOString().slice(0, 10),
      pickupBranch: data.pickupBranch,
      position: 1,
      status: "Waiting",
    };
    onPlace(newHold);
    toast.success(`Hold placed for ${patron.name}`);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-serif">Place a hold</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Patron card number</Label>
            <Input {...register("patronCard")} placeholder="C-100245" className="mono" />
            {errors.patronCard && <p className="text-xs text-destructive mt-1">{errors.patronCard.message}</p>}
          </div>
          <div>
            <Label>Title / keyword search</Label>
            <Input {...register("titleSearch")} placeholder="e.g. The Midnight Library" />
            {errors.titleSearch && <p className="text-xs text-destructive mt-1">{errors.titleSearch.message}</p>}
          </div>
          <div>
            <Label>Pickup branch</Label>
            <Select onValueChange={(v) => { }} defaultValue="">
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {["Central", "Riverside", "North Hill"].map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* register workaround */}
            <input type="hidden" {...register("pickupBranch")} defaultValue="Central" />
            {errors.pickupBranch && <p className="text-xs text-destructive mt-1">{errors.pickupBranch.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Place hold</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Patron Lookup dialog ─────────────────────────────────────────────────────
function PatronLookupDialog({ open, onClose, onSelect }: {
  open: boolean; onClose: () => void; onSelect: (card: string) => void;
}) {
  const [q, setQ] = useState("");
  const matches = patrons.filter((p) =>
    !q || [p.name, p.cardNumber, p.email].some((f) => f.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-serif">Search patron</DialogTitle></DialogHeader>
        <Input placeholder="Name, card number, or email…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border mt-2">
          {matches.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.cardNumber); onClose(); }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mono">{p.cardNumber} · {p.email}</div>
              </div>
              <Badge variant={p.status === "Active" ? "default" : p.status === "Suspended" ? "destructive" : "outline"} className="ml-3">
                {p.status}
              </Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pay Fine dialog ──────────────────────────────────────────────────────────
function PayFineDialog({ fine, open, onClose, onPay }: {
  fine: Fine | null; open: boolean; onClose: () => void; onPay: (id: string) => void;
}) {
  if (!fine) return null;
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif">Process fine payment</AlertDialogTitle>
          <AlertDialogDescription>
            Collect <strong>${fine.amount.toFixed(2)}</strong> from <strong>{fine.patronName}</strong> for {fine.type.toLowerCase()} on "{fine.itemTitle}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { onPay(fine.id); onClose(); }}>Confirm payment</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Transit management ───────────────────────────────────────────────────────
type TransitItem = {
  id: string;
  barcode: string;
  title: string;
  fromBranch: string;
  toBranch: string;
  sentDate: string;
  reason: "Hold" | "Transfer" | "Return";
  holdFor?: string;
  status: "In transit" | "Received";
};

const initialTransit: TransitItem[] = [
  { id: "tr1", barcode: "31901-00045", title: "The Sympathizer", fromBranch: "Riverside", toBranch: "Central", sentDate: "2026-06-22", reason: "Hold", holdFor: "Eleanor Voss", status: "In transit" },
  { id: "tr2", barcode: "31901-00203", title: "Thinking, Fast and Slow", fromBranch: "Central", toBranch: "North Hill", sentDate: "2026-06-21", reason: "Transfer", status: "In transit" },
  { id: "tr3", barcode: "31901-00510", title: "The Midnight Library", fromBranch: "North Hill", toBranch: "Central", sentDate: "2026-06-20", reason: "Hold", holdFor: "Marcus Holloway", status: "Received" },
];

const sendItemSchema = z.object({
  barcode: z.string().min(1, "Barcode required"),
  title: z.string().min(1, "Title required"),
  fromBranch: z.string().min(1, "Select origin branch"),
  toBranch: z.string().min(1, "Select destination branch"),
  reason: z.enum(["Hold", "Transfer", "Return"]),
  holdFor: z.string().optional(),
});
type SendItemForm = z.infer<typeof sendItemSchema>;

function SendItemDialog({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (item: TransitItem) => void }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SendItemForm>({
    resolver: zodResolver(sendItemSchema),
    defaultValues: { reason: "Transfer" },
  });
  const reason = watch("reason");

  const onSubmit = (data: SendItemForm) => {
    if (data.fromBranch === data.toBranch) { toast.error("Origin and destination must differ"); return; }
    const item: TransitItem = {
      id: `tr${Date.now()}`,
      barcode: data.barcode,
      title: data.title,
      fromBranch: data.fromBranch,
      toBranch: data.toBranch,
      sentDate: new Date().toISOString().slice(0, 10),
      reason: data.reason,
      holdFor: data.holdFor,
      status: "In transit",
    };
    onSend(item);
    toast.success(`Item sent to ${data.toBranch}`);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-serif">Send item in transit</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Barcode</Label>
              <Input {...register("barcode")} placeholder="31901-xxxxx" className="mono" />
              {errors.barcode && <p className="text-xs text-destructive mt-1">{errors.barcode.message}</p>}
            </div>
            <div>
              <Label>Title</Label>
              <Input {...register("title")} placeholder="Item title" />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From branch</Label>
              <Select onValueChange={() => {}}>
                <SelectTrigger><SelectValue placeholder="Origin" /></SelectTrigger>
                <SelectContent>{["Central", "Riverside", "North Hill", "Eastside Annex"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
              <input type="hidden" {...register("fromBranch")} defaultValue="Central" />
            </div>
            <div>
              <Label>To branch</Label>
              <Select onValueChange={() => {}}>
                <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent>{["Central", "Riverside", "North Hill", "Eastside Annex"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
              <input type="hidden" {...register("toBranch")} defaultValue="Riverside" />
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <Select onValueChange={() => {}}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Hold">Hold fulfillment</SelectItem>
                <SelectItem value="Transfer">Branch transfer</SelectItem>
                <SelectItem value="Return">Return to home branch</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register("reason")} defaultValue="Transfer" />
          </div>
          {reason === "Hold" && (
            <div>
              <Label>Patron (hold for)</Label>
              <Input {...register("holdFor")} placeholder="Patron name" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit"><SendHorizonal className="mr-2 h-4 w-4" />Send item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Circulation component ───────────────────────────────────────────────
function Circulation() {
  const [checkouts, setCheckouts] = useState(initialCheckouts);
  const [holds, setHolds] = useState(initialHolds);
  const [fines, setFines] = useState(initialFines);
  const [cardNumber, setCardNumber] = useState("");
  const [barcode, setBarcode] = useState("");

  const [showPatronLookup, setShowPatronLookup] = useState(false);
  const [showPlaceHold, setShowPlaceHold] = useState(false);
  const [showPatronPanel, setShowPatronPanel] = useState(false);
  const [selectedPatronId, setSelectedPatronId] = useState<string | null>(null);
  const [holdTrap, setHoldTrap] = useState<{ open: boolean; holdFor: string; checkoutId: string }>({ open: false, holdFor: "", checkoutId: "" });
  const [payFine, setPayFine] = useState<Fine | null>(null);
  const [transitItems, setTransitItems] = useState<TransitItem[]>(initialTransit);
  const [showSendItem, setShowSendItem] = useState(false);
  const [transitFilter, setTransitFilter] = useState<"All" | "In transit" | "Received">("All");
  const [transitPage, setTransitPage] = useState({ page: 1, pageSize: 10 });

  // Pagination states
  const [checkoutPage, setCheckoutPage] = useState({ page: 1, pageSize: 10 });
  const [holdsPage, setHoldsPage] = useState({ page: 1, pageSize: 10 });
  const [finesPage, setFinesPage] = useState({ page: 1, pageSize: 10 });

  const overdueCount = checkouts.filter((c) => c.status === "Overdue").length;
  const onLoanCount = checkouts.filter((c) => c.status === "On loan").length;
  const unpaidFines = fines.filter((f) => !f.paid);
  const totalFinesOwed = unpaidFines.reduce((s, f) => s + f.amount, 0);

  const { paged: pagedCheckouts, ...checkoutPag } = usePagination(
    checkouts.filter((c) => c.status !== "Returned"), checkoutPage
  );
  const { paged: pagedHolds, ...holdsPag } = usePagination(holds, holdsPage);
  const { paged: pagedFines, ...finesPag } = usePagination(fines, finesPage);
  const filteredTransit = transitItems.filter((t) => transitFilter === "All" || t.status === transitFilter);
  const { paged: pagedTransit, ...transitPag } = usePagination(filteredTransit, transitPage);
  const inTransitCount = transitItems.filter((t) => t.status === "In transit").length;

  const onCheckout = () => {
    if (!cardNumber || !barcode) return toast.error("Enter patron card and item barcode");
    const patron = patrons.find((p) => p.cardNumber === cardNumber);
    if (!patron) return toast.error("Patron not found");
    if (patron.status !== "Active") return toast.error(`Patron is ${patron.status.toLowerCase()}`);
    const patronFines = fines.filter((f) => f.patronId === patron.id && !f.paid);
    if (patronFines.reduce((s, f) => s + f.amount, 0) >= 10) {
      return toast.error("Patron has $10+ in fines. Please clear fines before checkout.");
    }
    const due = new Date(); due.setDate(due.getDate() + 28);
    setCheckouts((prev) => [
      { id: `co${Date.now()}`, patron: patron.name, cardNumber, title: `Item ${barcode}`, barcode, checkedOut: new Date().toISOString().slice(0, 10), dueDate: due.toISOString().slice(0, 10), status: "On loan", renewals: 0 },
      ...prev,
    ]);
    toast.success(`Checked out to ${patron.name}`, { description: `Due ${due.toLocaleDateString()}` });
    setBarcode("");
  };

  const onReturn = (id: string) => {
    const co = checkouts.find((c) => c.id === id);
    if (!co) return;
    setCheckouts((prev) => prev.map((c) => c.id === id ? { ...c, status: "Returned" as const } : c));
    // check for hold trap
    const waitingHold = holds.find((h) => h.title === co.title && h.status === "Waiting");
    if (waitingHold) {
      setHoldTrap({ open: true, holdFor: waitingHold.patron, checkoutId: id });
    } else {
      toast.success("Item returned");
    }
  };

  const onHoldTrapConfirm = () => {
    const co = checkouts.find((c) => c.id === holdTrap.checkoutId);
    if (co) {
      setHolds((prev) => prev.map((h) => h.title === co.title && h.status === "Waiting"
        ? { ...h, status: "Ready for pickup" as const } : h));
      toast.success("Item returned & hold activated — ready for pickup");
    }
    setHoldTrap({ open: false, holdFor: "", checkoutId: "" });
  };

  const onRenew = (id: string) => {
    setCheckouts((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      if (c.renewals >= 2) { toast.error("Renewal limit reached"); return c; }
      const newDue = new Date(c.dueDate); newDue.setDate(newDue.getDate() + 28);
      toast.success(`Renewed — new due date ${newDue.toLocaleDateString()}`);
      return { ...c, renewals: c.renewals + 1, dueDate: newDue.toISOString().slice(0, 10), status: "On loan" as const };
    }));
  };

  const onCancelHold = (id: string) => {
    setHolds((prev) => prev.filter((h) => h.id !== id));
    toast.success("Hold cancelled");
  };

  const onSuspendHold = (id: string) => {
    setHolds((prev) => prev.map((h) => h.id === id ? { ...h, status: "Waiting" as const } : h));
    toast.info("Hold suspended — will not be filled until reactivated");
  };

  const openPatronPanel = (cardNum: string) => {
    const patron = patrons.find((p) => p.cardNumber === cardNum);
    if (patron) { setSelectedPatronId(patron.id); setShowPatronPanel(true); }
  };

  return (
    <PageShell title="Circulation desk" description="Checkouts, returns, renewals, holds, and fines.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items on loan" value={onLoanCount} />
        <StatCard label="Overdue" value={overdueCount} accent="destructive" />
        <StatCard label="Holds in queue" value={holds.length} accent="accent" />
        <StatCard label="Fines owed" value={`$${totalFinesOwed.toFixed(2)}`} accent="warning" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="checkout">
          <TabsList>
            <TabsTrigger value="checkout"><BookOpen className="mr-1.5 h-4 w-4" />Check out</TabsTrigger>
            <TabsTrigger value="return"><RotateCcw className="mr-1.5 h-4 w-4" />Return / Renew</TabsTrigger>
            <TabsTrigger value="holds"><Bookmark className="mr-1.5 h-4 w-4" />Holds</TabsTrigger>
            <TabsTrigger value="fines"><DollarSign className="mr-1.5 h-4 w-4" />Fines</TabsTrigger>
            <TabsTrigger value="transit">
              <ArrowRightLeft className="mr-1.5 h-4 w-4" />Transit
              {inTransitCount > 0 && <span className="ml-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1.5">{inTransitCount}</span>}
            </TabsTrigger>
          </TabsList>

          {/* ── Check out ── */}
          <TabsContent value="checkout" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">New checkout</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="card">Patron card</Label>
                    <div className="flex gap-1">
                      <Input id="card" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="C-100245" className="mono" />
                      <Button size="icon" variant="outline" onClick={() => setShowPatronLookup(true)} title="Search patron">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bc">Item barcode</Label>
                    <Input id="bc" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="31901-00xxx" className="mono" />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={onCheckout} className="flex-1">Check out</Button>
                    {cardNumber && (
                      <Button variant="outline" size="icon" onClick={() => openPatronPanel(cardNumber)} title="View patron account">
                        <User className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Loan period: 28 days · Max renewals: 2 · Blocked if fines ≥ $10 · Try card <span className="mono">C-100245</span></p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Return / Renew ── */}
          <TabsContent value="return" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">Active loans</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="mono">Barcode</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Renewals</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedCheckouts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <button className="text-left hover:underline" onClick={() => openPatronPanel(c.cardNumber)}>
                            <div className="font-medium">{c.patron}</div>
                            <div className="text-xs text-muted-foreground mono">{c.cardNumber}</div>
                          </button>
                        </TableCell>
                        <TableCell>{c.title}</TableCell>
                        <TableCell className="mono text-xs">{c.barcode}</TableCell>
                        <TableCell className="mono text-xs">{c.dueDate}</TableCell>
                        <TableCell>{c.renewals}/2</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "Overdue" ? "destructive" : "secondary"}>{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => onRenew(c.id)} title="Renew">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onReturn(c.id)}>Return</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DataPagination {...checkoutPag} page={checkoutPage.page} pageSize={checkoutPage.pageSize} onChange={setCheckoutPage} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Holds ── */}
          <TabsContent value="holds" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Holds & reserves</CardTitle>
                <Button size="sm" onClick={() => setShowPlaceHold(true)}>+ Place hold</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Queue #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedHolds.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.patron}</TableCell>
                        <TableCell>{h.title}</TableCell>
                        <TableCell className="mono text-xs">{h.placed}</TableCell>
                        <TableCell>{h.pickupBranch}</TableCell>
                        <TableCell>#{h.position}</TableCell>
                        <TableCell>
                          <Badge variant={h.status === "Ready for pickup" ? "default" : h.status === "In transit" ? "secondary" : "outline"}>{h.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {h.status === "Waiting" && (
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => onSuspendHold(h.id)}>Suspend</Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onCancelHold(h.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DataPagination {...holdsPag} page={holdsPage.page} pageSize={holdsPage.pageSize} onChange={setHoldsPage} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Fines ── */}
          <TabsContent value="fines" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Patron fines</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Outstanding: <span className="font-semibold text-destructive">${unpaidFines.reduce((s, f) => s + f.amount, 0).toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedFines.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <button className="text-left hover:underline" onClick={() => openPatronPanel(f.cardNumber)}>
                            <div className="font-medium">{f.patronName}</div>
                            <div className="text-xs mono text-muted-foreground">{f.cardNumber}</div>
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{f.itemTitle}</TableCell>
                        <TableCell><Badge variant="outline">{f.type}</Badge></TableCell>
                        <TableCell className="mono text-xs">{f.date}</TableCell>
                        <TableCell className={`text-right mono font-medium ${!f.paid ? "text-destructive" : ""}`}>${f.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={f.paid ? "default" : "destructive"}>{f.paid ? "Paid" : "Unpaid"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!f.paid && (
                            <Button size="sm" variant="outline" onClick={() => setPayFine(f)}>
                              <DollarSign className="mr-1 h-3.5 w-3.5" /> Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DataPagination {...finesPag} page={finesPage.page} pageSize={finesPage.pageSize} onChange={setFinesPage} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Transit ── */}
          <TabsContent value="transit" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Inter-branch transit</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {(["All", "In transit", "Received"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setTransitFilter(f); setTransitPage({ page: 1, pageSize: 10 }); }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${transitFilter === f ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                      >{f}</button>
                    ))}
                  </div>
                  <Button size="sm" onClick={() => setShowSendItem(true)}>
                    <SendHorizonal className="mr-1.5 h-4 w-4" /> Send item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mono">Barcode</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Hold for</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedTransit.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="mono text-xs">{t.barcode}</TableCell>
                        <TableCell className="font-medium text-sm">{t.title}</TableCell>
                        <TableCell className="text-sm">{t.fromBranch}</TableCell>
                        <TableCell className="text-sm">{t.toBranch}</TableCell>
                        <TableCell className="mono text-xs">{t.sentDate}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{t.reason}</Badge></TableCell>
                        <TableCell className="text-sm">{t.holdFor ?? <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "In transit" ? "secondary" : "default"}>
                            {t.status === "Received" && <CheckCircle2 className="mr-1 h-3 w-3" />}{t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {t.status === "In transit" && (
                            <Button size="sm" variant="outline" onClick={() => {
                              setTransitItems((prev) => prev.map((i) => i.id === t.id ? { ...i, status: "Received" as const } : i));
                              toast.success(`Item received at ${t.toBranch}`);
                            }}>
                              Receive
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pagedTransit.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                          No transit items match the current filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <DataPagination {...transitPag} page={transitPage.page} pageSize={transitPage.pageSize} onChange={setTransitPage} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      <SendItemDialog open={showSendItem} onClose={() => setShowSendItem(false)} onSend={(item) => setTransitItems((prev) => [item, ...prev])} />
      <PatronLookupDialog open={showPatronLookup} onClose={() => setShowPatronLookup(false)} onSelect={(card) => setCardNumber(card)} />
      <PlaceHoldDialog open={showPlaceHold} onClose={() => setShowPlaceHold(false)} onPlace={(h) => setHolds((prev) => [h, ...prev])} />
      <PatronPanel patronId={selectedPatronId} open={showPatronPanel} onClose={() => setShowPatronPanel(false)} checkouts={checkouts} fines={fines} />
      <HoldTrapDialog open={holdTrap.open} holdFor={holdTrap.holdFor} onConfirm={onHoldTrapConfirm} onClose={() => setHoldTrap({ open: false, holdFor: "", checkoutId: "" })} />
      <PayFineDialog fine={payFine} open={!!payFine} onClose={() => setPayFine(null)}
        onPay={(id) => { setFines((prev) => prev.map((f) => f.id === id ? { ...f, paid: true } : f)); toast.success("Fine payment recorded"); }} />
    </PageShell>
  );
}
