import { createFileRoute } from "@tanstack/react-router";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { staffUsers, patrons } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — Athenaeum" }] }),
  component: Admin;
});

function Admin() {
  return (
    <PageShell title="Administration" description="System configuration, staff and patron management.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Staff users" value={staffUsers.length} />
        <StatCard label="Patrons" value={patrons.length} accent="accent" />
        <StatCard label="Active branches" value={3} accent="success" />
        <StatCard label="System uptime" value="99.98%" accent="success" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="staff">
          <TabsList>
            <TabsTrigger value="staff">Staff & roles</TabsTrigger>
            <TabsTrigger value="patrons">Patrons</TabsTrigger>
            <TabsTrigger value="settings">System settings</TabsTrigger>
            <TabsTrigger value="circ-rules">Circulation rules</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Staff users</CardTitle>
                <Button size="sm">+ Add user</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Last login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell><Badge variant={u.role === "Admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                        <TableCell>{u.branch}</TableCell>
                        <TableCell className="mono text-xs">{u.lastLogin}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patrons" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Patron records</CardTitle>
                <Button size="sm">+ Register patron</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mono">Card #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fines</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patrons.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="mono text-xs">{p.cardNumber}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "Active" ? "default" : p.status === "Suspended" ? "destructive" : "outline"}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className={`text-right mono ${p.fines > 0 ? "text-destructive" : ""}`}>${p.fines.toFixed(2)}</TableCell>
                        <TableCell className="mono text-xs">{p.joined}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="font-serif">Library identity</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Library name</Label><Input defaultValue="Athenaeum Public Library" /></div>
                  <div><Label>Default branch</Label>
                    <Select defaultValue="central">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="riverside">Riverside</SelectItem>
                        <SelectItem value="northhill">North Hill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Contact email</Label><Input defaultValue="info@athenaeum.lib" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-serif">Integrations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Z39.50 / SRU targets", desc: "External cataloging sources", on: true },
                    { name: "EDIFACT acquisitions", desc: "Electronic ordering with vendors", on: true },
                    { name: "OAuth2 patron sign-in", desc: "Single sign-on for OPAC", on: false },
                    { name: "Email notifications (SMTP)", desc: "Due date and hold alerts", on: true },
                    { name: "SIP2 self-checkout", desc: "Self-service kiosks", on: false },
                  ].map((i) => (
                    <div key={i.name} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm">{i.name}</div>
                        <div className="text-xs text-muted-foreground">{i.desc}</div>
                      </div>
                      <Switch defaultChecked={i.on} onCheckedChange={() => toast.success(`${i.name} updated`)} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="circ-rules" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">Circulation rules</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron category</TableHead>
                      <TableHead>Item type</TableHead>
                      <TableHead className="text-right">Loan (days)</TableHead>
                      <TableHead className="text-right">Renewals</TableHead>
                      <TableHead className="text-right">Fine / day</TableHead>
                      <TableHead className="text-right">Max checkouts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Adult", "Book", 28, 2, "$0.25", 30],
                      ["Adult", "DVD", 7, 1, "$1.00", 5],
                      ["Student", "Book", 28, 3, "$0.10", 50],
                      ["Juvenile", "Book", 28, 3, "$0.00", 20],
                      ["Senior", "Book", 42, 3, "$0.10", 30],
                      ["Staff", "Any", 90, 5, "$0.00", 100],
                    ].map((r, i) => (
                      <TableRow key={i}>
                        {r.map((v, j) => <TableCell key={j} className={j >= 2 ? "text-right mono" : ""}>{v as any}</TableCell>)}
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
