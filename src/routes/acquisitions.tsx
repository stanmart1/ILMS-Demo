import { createFileRoute } from "@tanstack/react-router";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { purchaseOrders, vendors, budgets } from "@/lib/mock-data";

export const Route = createFileRoute("/acquisitions")({
  head: () => ({ meta: [{ title: "Acquisitions — Athenaeum" }] }),
  component: Acquisitions;
});

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Acquisitions() {
  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalEncumbered = budgets.reduce((s, b) => s + b.encumbered, 0);
  const openPOs = purchaseOrders.filter((p) => p.status === "Submitted" || p.status === "Draft").length;

  return (
    <PageShell
      title="Acquisitions"
      description="Purchase orders, fund management and vendor relations."
      actions={<Button>+ New purchase order</Button>}
    >
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
          </TabsList>

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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="mono text-xs">{p.id}</TableCell>
                        <TableCell>{p.vendor}</TableCell>
                        <TableCell>{p.fund}</TableCell>
                        <TableCell className="text-right">{p.items}</TableCell>
                        <TableCell className="text-right mono">{fmt(p.total)}</TableCell>
                        <TableCell className="mono text-xs">{p.created}</TableCell>
                        <TableCell>
                          <Badge variant={
                            p.status === "Received" ? "default" :
                            p.status === "Cancelled" ? "destructive" :
                            p.status === "Draft" ? "outline" : "secondary"
                          }>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {budgets.map((b) => {
                const pct = (b.spent / b.allocated) * 100;
                const remaining = b.allocated - b.spent - b.encumbered;
                return (
                  <Card key={b.fund}>
                    <CardHeader className="pb-3">
                      <CardTitle className="font-serif text-lg">{b.fund}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="font-serif text-2xl font-semibold">{fmt(b.spent)}</span>
                        <span className="text-xs text-muted-foreground">of {fmt(b.allocated)}</span>
                      </div>
                      <Progress value={pct} className="mt-2" />
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div><div className="text-muted-foreground">Spent</div><div className="mono">{pct.toFixed(0)}%</div></div>
                        <div><div className="text-muted-foreground">Encumbered</div><div className="mono">{fmt(b.encumbered)}</div></div>
                        <div><div className="text-muted-foreground">Remaining</div><div className="mono text-success">{fmt(remaining)}</div></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="mt-4">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{v.contact}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{v.email}</TableCell>
                        <TableCell className="text-right">{v.activeOrders}</TableCell>
                        <TableCell className="text-right mono">{fmt(v.totalSpent)}</TableCell>
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
