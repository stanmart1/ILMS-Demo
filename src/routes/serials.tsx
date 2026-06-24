import { createFileRoute } from "@tanstack/react-router";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { subscriptions, serialIssues } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/serials")({
  head: () => ({ meta: [{ title: "Serials — Athenaeum" }] }),
  component: Serials,
});

function Serials() {
  const active = subscriptions.filter((s) => s.status === "Active").length;
  const lapsed = subscriptions.filter((s) => s.status === "Lapsed").length;
  const late = serialIssues.filter((i) => i.status === "Late" || i.status === "Claimed").length;

  return (
    <PageShell title="Serials" description="Periodicals, subscription tracking and issue check-in.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active subscriptions" value={active} accent="success" />
        <StatCard label="Lapsed" value={lapsed} accent="destructive" />
        <StatCard label="Late or claimed" value={late} accent="warning" />
        <StatCard label="Tracked titles" value={subscriptions.length} />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="subs">
          <TabsList>
            <TabsTrigger value="subs">Subscriptions</TabsTrigger>
            <TabsTrigger value="issues">Issue check-in</TabsTrigger>
          </TabsList>

          <TabsContent value="subs" className="mt-4">
            <Card>
              <CardContent className="p-0">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="mono text-xs">{s.issn}</TableCell>
                        <TableCell>{s.vendor}</TableCell>
                        <TableCell>{s.frequency}</TableCell>
                        <TableCell className="mono text-xs">{s.nextIssue}</TableCell>
                        <TableCell className="mono text-xs">{s.lastReceived}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "Active" ? "default" : s.status === "Lapsed" ? "destructive" : "secondary"}>{s.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">Expected & received issues</CardTitle></CardHeader>
              <CardContent className="p-0">
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
                    {serialIssues.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.title}</TableCell>
                        <TableCell>{i.issue}</TableCell>
                        <TableCell className="mono text-xs">{i.expected}</TableCell>
                        <TableCell className="mono text-xs">{i.received ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            i.status === "Received" ? "default" :
                            i.status === "Late" || i.status === "Claimed" ? "destructive" : "outline"
                          }>{i.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {i.status !== "Received" && (
                            <Button size="sm" variant="outline" onClick={() => toast.success(`${i.title} ${i.issue} checked in`)}>
                              Check in
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
        </Tabs>
      </div>
    </PageShell>
  );
}
