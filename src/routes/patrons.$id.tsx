import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { patrons, checkouts, holds, fines } from "@/lib/mock-data";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/patrons/$id")({
  head: () => ({ meta: [{ title: "Patron account — Athenaeum" }] }),
  component: PatronDetail,
});

function PatronDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const patron = patrons.find((p) => p.id === id);

  if (!patron) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Patron not found</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          This patron record does not exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/admin">Back to Administration</Link>
        </Button>
      </div>
    );
  }

  // ── Filtered data ──────────────────────────────────────────────────────────
  const patronCheckouts = checkouts.filter((c) => c.patron === patron.name);
  const patronHolds = holds.filter((h) => h.patron === patron.name);
  const patronFines = fines.filter((f) => f.patronId === patron.id);
  const outstandingFines = patronFines
    .filter((f) => !f.paid)
    .reduce((sum, f) => sum + f.amount, 0);
  const activeLoans = patronCheckouts.filter(
    (c) => c.status === "On loan" || c.status === "Overdue"
  ).length;

  // ── Status badge variant ───────────────────────────────────────────────────
  const statusVariant =
    patron.status === "Active"
      ? "default"
      : patron.status === "Suspended"
        ? "destructive"
        : "secondary";

  return (
    <PageShell title={patron.name}>
      {/* Back button */}
      <Button
        variant="ghost"
        className="-ml-2 mb-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate({ to: "/admin" })}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Administration
      </Button>

      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold">{patron.name}</h1>
        <span className="font-mono text-sm text-muted-foreground">
          {patron.cardNumber}
        </span>
        <Badge variant="outline">{patron.category}</Badge>
        <Badge variant={statusVariant}>{patron.status}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="holds">Holds</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        {/* ── Account tab ───────────────────────────────────────────────── */}
        <TabsContent value="account" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">
                  Personal details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full name</span>
                  <span className="font-medium">{patron.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{patron.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card number</span>
                  <span className="font-mono">{patron.cardNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-mono">{patron.joined}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{patron.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusVariant}>{patron.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Account summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">
                  Account summary
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <div className="font-serif text-2xl font-semibold">
                    {activeLoans}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Active loans
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <div className="font-serif text-2xl font-semibold">
                    {patronHolds.length}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Holds
                  </div>
                </div>
                <div
                  className={`rounded-lg p-3 text-center ${outstandingFines > 0 ? "bg-destructive/10" : "bg-muted/50"}`}
                >
                  <div
                    className={`font-serif text-2xl font-semibold ${outstandingFines > 0 ? "text-destructive" : ""}`}
                  >
                    ${outstandingFines.toFixed(2)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Outstanding fines
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Loans tab ─────────────────────────────────────────────────── */}
        <TabsContent value="loans" className="mt-4">
          {patronCheckouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No loans on record
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="font-mono">Barcode</TableHead>
                      <TableHead>Checked out</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Renewals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patronCheckouts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.barcode}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.checkedOut}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.dueDate}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === "On loan"
                                ? "secondary"
                                : c.status === "Overdue"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.renewals}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Holds tab ─────────────────────────────────────────────────── */}
        <TabsContent value="holds" className="mt-4">
          {patronHolds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No holds on record
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Placed date</TableHead>
                      <TableHead>Pickup branch</TableHead>
                      <TableHead className="text-right">Queue position</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patronHolds.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.title}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {h.placed}
                        </TableCell>
                        <TableCell>{h.pickupBranch}</TableCell>
                        <TableCell className="text-right">{h.position}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              h.status === "Ready for pickup"
                                ? "default"
                                : h.status === "In transit"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {h.status}
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

        {/* ── Fines tab ─────────────────────────────────────────────────── */}
        <TabsContent value="fines" className="mt-4">
          {patronFines.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Total outstanding:
              </span>
              <Badge
                variant={outstandingFines > 0 ? "destructive" : "secondary"}
              >
                ${outstandingFines.toFixed(2)}
              </Badge>
            </div>
          )}
          {patronFines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No fines on record
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patronFines.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          {f.itemTitle}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.type}</Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${!f.paid ? "text-destructive" : ""}`}
                        >
                          ${f.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.paid ? "default" : "secondary"}>
                            {f.paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {f.date}
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
