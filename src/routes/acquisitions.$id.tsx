import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { purchaseOrders, invoices } from "@/lib/mock-data";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/acquisitions/$id")({
  head: () => ({ meta: [{ title: "Purchase order — Athenaeum" }] }),
  component: AcquisitionsDetail,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// ── Title pool for mock line items ────────────────────────────────────────────
const TITLE_POOL = [
  "Sapiens",
  "Educated",
  "Astrophysics for People in a Hurry",
  "The Midnight Library",
  "Thinking Fast and Slow",
  "The Sympathizer",
];

function AcquisitionsDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const po = purchaseOrders.find((p) => p.id === id);

  if (!po) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">
          Purchase order not found
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          This purchase order does not exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/acquisitions">Back to Acquisitions</Link>
        </Button>
      </div>
    );
  }

  // ── Status badge variant ───────────────────────────────────────────────────
  const statusVariant =
    po.status === "Received"
      ? "default"
      : po.status === "Cancelled"
        ? "destructive"
        : po.status === "Draft"
          ? "outline"
          : "secondary";

  // ── Mock line items ────────────────────────────────────────────────────────
  const mockLines = Array.from(
    { length: Math.min(po.items, 6) },
    (_, i) => ({
      lineNo: i + 1,
      title: TITLE_POOL[i] ?? `Title ${i + 1}`,
      qty: 1 + (i % 2),
      unitPrice: 15 + i * 3.5,
      fund: po.fund,
      received: po.status === "Received" ? true : i === 0,
    })
  );
  const lineTotal = mockLines.reduce(
    (sum, l) => sum + l.qty * l.unitPrice,
    0
  );

  // ── Invoices for this PO ───────────────────────────────────────────────────
  const poInvoices = invoices.filter((inv) => inv.poId === po.id);

  return (
    <PageShell title={`Purchase Order ${po.id}`}>
      {/* Back button */}
      <Button
        variant="ghost"
        className="-ml-2 mb-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate({ to: "/acquisitions" })}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Acquisitions
      </Button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold font-mono">
          {po.id}
        </h1>
        <Badge variant={statusVariant}>{po.status}</Badge>
        <span className="text-sm text-muted-foreground">{po.vendor}</span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">{po.fund}</span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="font-mono text-sm text-muted-foreground">
          {po.created}
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lines">
        <TabsList>
          <TabsTrigger value="lines">Line items</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* ── Line items tab ────────────────────────────────────────────── */}
        <TabsContent value="lines" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-right">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right w-14">Qty</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLines.map((line) => (
                    <TableRow key={line.lineNo}>
                      <TableCell className="text-right text-muted-foreground">
                        {line.lineNo}
                      </TableCell>
                      <TableCell className="font-medium">{line.title}</TableCell>
                      <TableCell className="text-right">{line.qty}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(line.qty * line.unitPrice)}
                      </TableCell>
                      <TableCell>{line.fund}</TableCell>
                      <TableCell>
                        {line.received ? (
                          <span className="flex items-center gap-1 text-success text-sm">
                            <Check className="h-3.5 w-3.5" />
                            Received
                          </span>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={4} className="text-right text-sm">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmt(lineTotal)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoices tab ──────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-4">
          {poInvoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No invoices linked to this order
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">Invoice ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Invoice date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">
                          {inv.id}
                        </TableCell>
                        <TableCell>{inv.vendor}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {fmt(inv.amount)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {inv.invoiceDate}
                        </TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
