import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { checkouts as initialCheckouts, holds, patrons } from "@/lib/mock-data";
import { toast } from "sonner";
import { BookOpen, RotateCcw, RefreshCw, Bookmark } from "lucide-react";

export const Route = createFileRoute("/circulation")({
  head: () => ({ meta: [{ title: "Circulation — Athenaeum" }] }),
  component: Circulation,
});

function Circulation() {
  const [checkouts, setCheckouts] = useState(initialCheckouts);
  const [cardNumber, setCardNumber] = useState("");
  const [barcode, setBarcode] = useState("");

  const overdueCount = checkouts.filter((c) => c.status === "Overdue").length;
  const onLoanCount = checkouts.filter((c) => c.status === "On loan").length;

  const onCheckout = () => {
    if (!cardNumber || !barcode) return toast.error("Enter patron card and item barcode");
    const patron = patrons.find((p) => p.cardNumber === cardNumber);
    if (!patron) return toast.error("Patron not found");
    if (patron.status !== "Active") return toast.error(`Patron is ${patron.status.toLowerCase()}`);
    const due = new Date(); due.setDate(due.getDate() + 28);
    setCheckouts((prev) => [
      { id: `co${Date.now()}`, patron: patron.name, cardNumber, title: `Item ${barcode}`, barcode, checkedOut: new Date().toISOString().slice(0, 10), dueDate: due.toISOString().slice(0, 10), status: "On loan", renewals: 0 },
      ...prev,
    ]);
    toast.success(`Checked out to ${patron.name}`, { description: `Due ${due.toLocaleDateString()}` });
    setBarcode("");
  };

  const onReturn = (id: string) => {
    setCheckouts((prev) => prev.map((c) => c.id === id ? { ...c, status: "Returned" as const } : c));
    toast.success("Item returned");
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

  return (
    <PageShell title="Circulation desk" description="Checkouts, returns, renewals and holds management.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items on loan" value={onLoanCount} />
        <StatCard label="Overdue" value={overdueCount} accent="destructive" />
        <StatCard label="Holds in queue" value={holds.length} accent="accent" />
        <StatCard label="Returns today" value={checkouts.filter((c) => c.status === "Returned").length} accent="success" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="checkout">
          <TabsList>
            <TabsTrigger value="checkout"><BookOpen className="mr-1.5 h-4 w-4" />Check out</TabsTrigger>
            <TabsTrigger value="return"><RotateCcw className="mr-1.5 h-4 w-4" />Return / Renew</TabsTrigger>
            <TabsTrigger value="holds"><Bookmark className="mr-1.5 h-4 w-4" />Holds</TabsTrigger>
          </TabsList>

          <TabsContent value="checkout" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">New checkout</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="card">Patron card</Label>
                    <Input id="card" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="C-100245" className="mono" />
                  </div>
                  <div>
                    <Label htmlFor="bc">Item barcode</Label>
                    <Input id="bc" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="31901-00xxx" className="mono" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={onCheckout} className="w-full">Check out</Button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Loan period: 28 days · Max renewals: 2 · Try card <span className="mono">C-100245</span></p>
              </CardContent>
            </Card>
          </TabsContent>

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
                    {checkouts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.patron}</div>
                          <div className="text-xs text-muted-foreground mono">{c.cardNumber}</div>
                        </TableCell>
                        <TableCell>{c.title}</TableCell>
                        <TableCell className="mono text-xs">{c.barcode}</TableCell>
                        <TableCell className="mono text-xs">{c.dueDate}</TableCell>
                        <TableCell>{c.renewals}/2</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "Overdue" ? "destructive" : c.status === "Returned" ? "outline" : "secondary"}>{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" disabled={c.status === "Returned"} onClick={() => onRenew(c.id)}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" disabled={c.status === "Returned"} onClick={() => onReturn(c.id)}>Return</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holds" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">Holds & reserves</CardTitle></CardHeader>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holds.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.patron}</TableCell>
                        <TableCell>{h.title}</TableCell>
                        <TableCell className="mono text-xs">{h.placed}</TableCell>
                        <TableCell>{h.pickupBranch}</TableCell>
                        <TableCell>#{h.position}</TableCell>
                        <TableCell><Badge variant={h.status === "Ready for pickup" ? "default" : "outline"}>{h.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
