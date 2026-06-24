import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { purchaseOrders as initPOs, vendors as initVendors, budgets as initBudgets, invoices as initInvoices } from "@/lib/mock-data";
import type { PurchaseOrder, Vendor, Budget, Invoice } from "@/lib/mock-data";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, ArrowLeftRight, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/acquisitions")({
  head: () => ({ meta: [{ title: "Acquisitions — Athenaeum" }] }),
  component: Acquisitions,
});

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// ─── Local types ───────────────────────────────────────────────────────────
type LineItem = {
  title: string;
  qty: number;
  unitPrice: number;
  received: boolean;
};

// Pre-populated line items for existing submitted POs
const DEFAULT_PO_LINE_ITEMS: Record<string, LineItem[]> = {
  "PO-2026-0142": [
    { title: "The Great Alone", qty: 5, unitPrice: 18.99, received: false },
    { title: "All the Light We Cannot See", qty: 4, unitPrice: 19.50, received: false },
    { title: "Where the Crawdads Sing", qty: 6, unitPrice: 17.75, received: false },
    { title: "The Covenant of Water", qty: 5, unitPrice: 21.00, received: false },
    { title: "Tomorrow, and Tomorrow, and Tomorrow", qty: 4, unitPrice: 18.45, received: false },
  ],
  "PO-2026-0144": [
    { title: "Science (Annual Subscription)", qty: 1, unitPrice: 480.00, received: false },
    { title: "JAMA (Annual Subscription)", qty: 1, unitPrice: 520.00, received: false },
    { title: "The Lancet (Annual Subscription)", qty: 1, unitPrice: 440.00, received: false },
    { title: "Nature Medicine (Annual Subscription)", qty: 1, unitPrice: 495.00, received: false },
    { title: "Cell (Annual Subscription)", qty: 1, unitPrice: 510.00, received: false },
    { title: "NEJM (Annual Subscription)", qty: 1, unitPrice: 395.00, received: false },
  ],
};

// ─── Zod schemas ───────────────────────────────────────────────────────────
const lineItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  qty: z.coerce.number().int().min(1, "At least 1"),
  unitPrice: z.coerce.number().min(0, "Price must be ≥ 0"),
});

const newPOSchema = z.object({
  vendor: z.string().min(1, "Select a vendor"),
  fund: z.string().min(1, "Select a fund"),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
});
type NewPOForm = z.infer<typeof newPOSchema>;

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact is required"),
  email: z.string().email("Invalid email address"),
});
type VendorForm = z.infer<typeof vendorSchema>;

const budgetFundSchema = z.object({
  fund: z.string().min(1, "Fund name is required"),
  allocated: z.coerce.number().min(0, "Amount must be ≥ 0"),
});
type BudgetFundForm = z.infer<typeof budgetFundSchema>;

const transferSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  destination: z.string().min(1, "Select a destination fund"),
});
type TransferForm = z.infer<typeof transferSchema>;

const disputeSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});
type DisputeForm = z.infer<typeof disputeSchema>;

// ─── New PO dialog ─────────────────────────────────────────────────────────
function NewPODialog({
  open,
  onClose,
  vendors,
  budgets,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  vendors: Vendor[];
  budgets: Budget[];
  onSubmit: (po: PurchaseOrder, lineItems: LineItem[]) => void;
}) {
  const form = useForm<NewPOForm>({
    resolver: zodResolver(newPOSchema),
    defaultValues: {
      vendor: "",
      fund: "",
      notes: "",
      lineItems: [{ title: "", qty: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  function handleSubmit(data: NewPOForm) {
    const totalAmt = data.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
    const itemsCount = data.lineItems.reduce((s, li) => s + li.qty, 0);
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const id = `PO-2026-${seq}`;
    const po: PurchaseOrder = {
      id,
      vendor: data.vendor,
      fund: data.fund,
      items: itemsCount,
      total: totalAmt,
      status: "Draft",
      created: new Date().toISOString().slice(0, 10),
    };
    const lis: LineItem[] = data.lineItems.map((li) => ({
      title: li.title,
      qty: li.qty,
      unitPrice: li.unitPrice,
      received: false,
    }));
    onSubmit(po, lis);
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fund"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fund…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgets.map((b) => (
                          <SelectItem key={b.fund} value={b.fund}>{b.fund}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes…" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Line items</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ title: "", qty: 1, unitPrice: 0 })}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add line
                </Button>
              </div>

              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_80px_110px_36px] gap-2 px-1">
                  <span className="text-xs text-muted-foreground">Title</span>
                  <span className="text-xs text-muted-foreground">Qty</span>
                  <span className="text-xs text-muted-foreground">Unit price</span>
                  <span />
                </div>

                {fields.map((fieldItem, idx) => (
                  <div key={fieldItem.id} className="grid grid-cols-[1fr_80px_110px_36px] gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`lineItems.${idx}.title`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input placeholder="Title" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`lineItems.${idx}.qty`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`lineItems.${idx}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input type="number" min={0} step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      disabled={fields.length === 1}
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Create PO</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Receive items dialog ──────────────────────────────────────────────────
function ReceiveItemsDialog({
  po,
  lineItems,
  onToggle,
  onMarkFullyReceived,
  onClose,
}: {
  po: PurchaseOrder | null;
  lineItems: LineItem[];
  onToggle: (idx: number) => void;
  onMarkFullyReceived: () => void;
  onClose: () => void;
}) {
  if (!po) return null;

  return (
    <Dialog open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receive items for {po.id}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          {po.vendor} · {po.fund}
        </p>

        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {lineItems.map((li, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`rcv-${idx}`}
                checked={li.received}
                onCheckedChange={() => onToggle(idx)}
              />
              <Label htmlFor={`rcv-${idx}`} className="flex-1 cursor-pointer flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{li.title}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">× {li.qty}</span>
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onMarkFullyReceived}>
            <PackageCheck className="h-4 w-4 mr-2" /> Mark fully received
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vendor create / edit dialog ───────────────────────────────────────────
function VendorDialog({
  open,
  vendor,
  onClose,
  onSubmit,
}: {
  open: boolean;
  vendor?: Vendor;
  onClose: () => void;
  onSubmit: (data: VendorForm, existing?: Vendor) => void;
}) {
  const form = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { name: "", contact: "", email: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        vendor
          ? { name: vendor.name, contact: vendor.contact, email: vendor.email }
          : { name: "", contact: "", email: "" }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    form.reset();
    onClose();
  }

  function handleSubmit(data: VendorForm) {
    onSubmit(data, vendor);
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit vendor" : "Add vendor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Vendor name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl><Input placeholder="Contact person" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="orders@vendor.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">{vendor ? "Save changes" : "Add vendor"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── New budget fund dialog ────────────────────────────────────────────────
function BudgetFundDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFundForm) => void;
}) {
  const form = useForm<BudgetFundForm>({
    resolver: zodResolver(budgetFundSchema),
    defaultValues: { fund: "", allocated: 0 },
  });

  useEffect(() => {
    if (open) form.reset({ fund: "", allocated: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    form.reset();
    onClose();
  }

  function handleSubmit(data: BudgetFundForm) {
    onSubmit(data);
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New budget fund</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fund"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fund name</FormLabel>
                  <FormControl><Input placeholder="e.g. Young Adult" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allocated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocated amount ($)</FormLabel>
                  <FormControl><Input type="number" min={0} step="100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Create fund</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fund transfer dialog ──────────────────────────────────────────────────
function TransferDialog({
  open,
  sourceFund,
  budgets,
  onClose,
  onSubmit,
}: {
  open: boolean;
  sourceFund: string | null;
  budgets: Budget[];
  onClose: () => void;
  onSubmit: (sourceFund: string, data: TransferForm) => void;
}) {
  const form = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: { amount: 0, destination: "" },
  });

  useEffect(() => {
    if (open) form.reset({ amount: 0, destination: "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    form.reset();
    onClose();
  }

  function handleSubmit(data: TransferForm) {
    if (!sourceFund) return;
    onSubmit(sourceFund, data);
    form.reset();
    onClose();
  }

  const otherFunds = budgets.filter((b) => b.fund !== sourceFund);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer from "{sourceFund}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination fund</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fund…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {otherFunds.map((b) => (
                        <SelectItem key={b.fund} value={b.fund}>{b.fund}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">
                <ArrowLeftRight className="h-4 w-4 mr-2" /> Transfer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice dispute dialog ────────────────────────────────────────────────
function DisputeDialog({
  open,
  invoiceId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onSubmit: (invoiceId: string, reason: string) => void;
}) {
  const form = useForm<DisputeForm>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    form.reset();
    onClose();
  }

  function handleSubmit(data: DisputeForm) {
    if (!invoiceId) return;
    onSubmit(invoiceId, data.reason);
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Dispute invoice{invoiceId ? ` ${invoiceId}` : ""}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the reason for the dispute…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="destructive">Dispute invoice</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
function Acquisitions() {
  const [pos, setPOs] = useState<PurchaseOrder[]>(initPOs);
  const [vendorList, setVendorList] = useState<Vendor[]>(initVendors);
  const [budgetList, setBudgetList] = useState<Budget[]>(initBudgets);
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(initInvoices);
  const [poLineItems, setPoLineItems] = useState<Record<string, LineItem[]>>(DEFAULT_PO_LINE_ITEMS);

  // Dialog open state
  const [newPOOpen, setNewPOOpen] = useState(false);
  const [receivePOId, setReceivePOId] = useState<string | null>(null);
  const [vendorDialog, setVendorDialog] = useState<{ open: boolean; vendor?: Vendor }>({ open: false });
  const [budgetFundOpen, setBudgetFundOpen] = useState(false);
  const [transferFund, setTransferFund] = useState<string | null>(null);
  const [disputeInvoiceId, setDisputeInvoiceId] = useState<string | null>(null);

  // Derived stats (react to budgetList / pos state)
  const totalAllocated = budgetList.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgetList.reduce((s, b) => s + b.spent, 0);
  const totalEncumbered = budgetList.reduce((s, b) => s + b.encumbered, 0);
  const openPOs = pos.filter((p) => p.status === "Submitted" || p.status === "Draft").length;

  const receivePO = pos.find((p) => p.id === receivePOId) ?? null;
  const receiveLIs = receivePOId ? (poLineItems[receivePOId] ?? []) : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleNewPOSubmit(po: PurchaseOrder, lineItems: LineItem[]) {
    setPOs((prev) => [...prev, po]);
    setPoLineItems((prev) => ({ ...prev, [po.id]: lineItems }));
    toast.success(`Purchase order ${po.id} created as Draft.`);
  }

  function handleToggleLineItem(poId: string, idx: number) {
    setPoLineItems((prev) => {
      const items = [...(prev[poId] ?? [])];
      items[idx] = { ...items[idx], received: !items[idx].received };
      return { ...prev, [poId]: items };
    });
  }

  function handleMarkFullyReceived() {
    if (!receivePOId) return;
    setPoLineItems((prev) => ({
      ...prev,
      [receivePOId]: (prev[receivePOId] ?? []).map((li) => ({ ...li, received: true })),
    }));
    setPOs((prev) =>
      prev.map((p) => (p.id === receivePOId ? { ...p, status: "Received" } : p))
    );
    toast.success(`${receivePOId} marked as fully received.`);
    setReceivePOId(null);
  }

  function handleVendorSubmit(data: VendorForm, existing?: Vendor) {
    if (existing) {
      setVendorList((prev) => prev.map((v) => (v.id === existing.id ? { ...v, ...data } : v)));
      toast.success(`Vendor "${data.name}" updated.`);
    } else {
      const newVendor: Vendor = {
        id: `v${Date.now()}`,
        ...data,
        activeOrders: 0,
        totalSpent: 0,
      };
      setVendorList((prev) => [...prev, newVendor]);
      toast.success(`Vendor "${data.name}" added.`);
    }
  }

  function handleBudgetFundSubmit(data: BudgetFundForm) {
    const newBudget: Budget = {
      fund: data.fund,
      allocated: data.allocated,
      spent: 0,
      encumbered: 0,
    };
    setBudgetList((prev) => [...prev, newBudget]);
    toast.success(`Fund "${data.fund}" created with ${fmt(data.allocated)} allocated.`);
  }

  function handleTransfer(sourceFund: string, data: TransferForm) {
    setBudgetList((prev) =>
      prev.map((b) => {
        if (b.fund === sourceFund) return { ...b, allocated: b.allocated - data.amount };
        if (b.fund === data.destination) return { ...b, allocated: b.allocated + data.amount };
        return b;
      })
    );
    toast.success(
      `${fmt(data.amount)} transferred from "${sourceFund}" to "${data.destination}".`
    );
  }

  function handleApproveInvoice(id: string) {
    setInvoiceList((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "Approved" as const } : inv))
    );
    toast.success("Invoice approved.");
  }

  function handleMarkPaid(id: string) {
    setInvoiceList((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "Paid" as const } : inv))
    );
    toast.success("Invoice marked as paid.");
  }

  function handleDisputeSubmit(id: string, _reason: string) {
    setInvoiceList((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "Disputed" as const } : inv))
    );
    toast.error(`Invoice ${id} has been disputed.`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Acquisitions"
      description="Purchase orders, fund management and vendor relations."
      actions={
        <Button onClick={() => setNewPOOpen(true)}>+ New purchase order</Button>
      }
    >
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="FY budget" value={fmt(totalAllocated)} />
        <StatCard label="Spent" value={fmt(totalSpent)} accent="success" />
        <StatCard label="Encumbered" value={fmt(totalEncumbered)} accent="warning" />
        <StatCard label="Open POs" value={openPOs} accent="accent" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Purchase orders</TabsTrigger>
            <TabsTrigger value="budgets">Funds & budgets</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* ── Purchase orders tab ────────────────────────────────────── */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mono">PO #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="mono text-xs">{p.id}</TableCell>
                        <TableCell>{p.vendor}</TableCell>
                        <TableCell>{p.fund}</TableCell>
                        <TableCell className="text-right">{p.items}</TableCell>
                        <TableCell className="text-right mono">{fmt(p.total)}</TableCell>
                        <TableCell className="mono text-xs">{p.created}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "Received"
                                ? "default"
                                : p.status === "Cancelled"
                                ? "destructive"
                                : p.status === "Draft"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.status === "Submitted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReceivePOId(p.id)}
                            >
                              <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
                              Receive
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Funds & budgets tab ────────────────────────────────────── */}
          <TabsContent value="budgets" className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setBudgetFundOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New fund
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {budgetList.map((b) => {
                const pct = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
                const remaining = b.allocated - b.spent - b.encumbered;
                return (
                  <Card key={b.fund}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="font-serif text-lg">{b.fund}</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTransferFund(b.fund)}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                          Transfer
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="font-serif text-2xl font-semibold">{fmt(b.spent)}</span>
                        <span className="text-xs text-muted-foreground">of {fmt(b.allocated)}</span>
                      </div>
                      <Progress value={pct} className="mt-2" />
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Spent</div>
                          <div className="mono">{pct.toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Encumbered</div>
                          <div className="mono">{fmt(b.encumbered)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Remaining</div>
                          <div className="mono text-success">{fmt(remaining)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Vendors tab ───────────────────────────────────────────── */}
          <TabsContent value="vendors" className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setVendorDialog({ open: true })}>
                <Plus className="h-4 w-4 mr-2" /> Add vendor
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Active POs</TableHead>
                      <TableHead className="text-right">Total spend</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorList.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{v.contact}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{v.email}</TableCell>
                        <TableCell className="text-right">{v.activeOrders}</TableCell>
                        <TableCell className="text-right mono">{fmt(v.totalSpent)}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setVendorDialog({ open: true, vendor: v })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Invoices tab ──────────────────────────────────────────── */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mono">Invoice ID</TableHead>
                      <TableHead className="mono">PO #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Invoice date</TableHead>
                      <TableHead>Received date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceList.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="mono text-xs">{inv.id}</TableCell>
                        <TableCell className="mono text-xs">{inv.poId}</TableCell>
                        <TableCell>{inv.vendor}</TableCell>
                        <TableCell className="text-right mono">{fmt(inv.amount)}</TableCell>
                        <TableCell className="mono text-xs">{inv.invoiceDate}</TableCell>
                        <TableCell className="mono text-xs">{inv.receivedDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inv.status === "Paid"
                                ? "default"
                                : inv.status === "Approved"
                                ? "secondary"
                                : inv.status === "Disputed"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {inv.status === "Pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveInvoice(inv.id)}
                              >
                                Approve
                              </Button>
                            )}
                            {inv.status === "Approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkPaid(inv.id)}
                              >
                                Mark paid
                              </Button>
                            )}
                            {(inv.status === "Pending" || inv.status === "Approved") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDisputeInvoiceId(inv.id)}
                              >
                                Dispute
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <NewPODialog
        open={newPOOpen}
        onClose={() => setNewPOOpen(false)}
        vendors={vendorList}
        budgets={budgetList}
        onSubmit={handleNewPOSubmit}
      />

      {receivePO && (
        <ReceiveItemsDialog
          po={receivePO}
          lineItems={receiveLIs}
          onToggle={(idx) => handleToggleLineItem(receivePOId!, idx)}
          onMarkFullyReceived={handleMarkFullyReceived}
          onClose={() => setReceivePOId(null)}
        />
      )}

      <VendorDialog
        open={vendorDialog.open}
        vendor={vendorDialog.vendor}
        onClose={() => setVendorDialog({ open: false })}
        onSubmit={handleVendorSubmit}
      />

      <BudgetFundDialog
        open={budgetFundOpen}
        onClose={() => setBudgetFundOpen(false)}
        onSubmit={handleBudgetFundSubmit}
      />

      <TransferDialog
        open={!!transferFund}
        sourceFund={transferFund}
        budgets={budgetList}
        onClose={() => setTransferFund(null)}
        onSubmit={handleTransfer}
      />

      <DisputeDialog
        open={!!disputeInvoiceId}
        invoiceId={disputeInvoiceId}
        onClose={() => setDisputeInvoiceId(null)}
        onSubmit={handleDisputeSubmit}
      />
    </PageShell>
  );
}
