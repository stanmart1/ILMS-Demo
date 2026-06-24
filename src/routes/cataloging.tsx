import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bibRecords, sampleMarc } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/cataloging")({
  head: () => ({ meta: [{ title: "Cataloging — Athenaeum" }] }),
  component: Cataloging;
});

const z3950Targets = [
  { id: "loc", name: "Library of Congress", host: "lx2.loc.gov:210/LCDB" },
  { id: "bnf", name: "Bibliothèque nationale de France", host: "z3950.bnf.fr:2211/TOUT-UTF8" },
  { id: "bl", name: "British Library", host: "z3950cat.bl.uk:9909/BLAC" },
  { id: "dnb", name: "Deutsche Nationalbibliothek", host: "z3950.dnb.de:2100/dnb" },
];

function Cataloging() {
  const [query, setQuery] = useState("");
  const [marc, setMarc] = useState(sampleMarc);
  const [target, setTarget] = useState("loc");
  const filtered = bibRecords.filter((b) =>
    !query || [b.title, b.author, b.isbn, b.callNumber].some((f) => f.toLowerCase().includes(query.toLowerCase()))
  );
  const totalCopies = bibRecords.reduce((s, b) => s + b.copies, 0);

  return (
    <PageShell title="Cataloging" description="Bibliographic records, MARC21/UNIMARC editor, and Z39.50/SRU search.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bibliographic records" value={bibRecords.length} />
        <StatCard label="Physical copies" value={totalCopies} />
        <StatCard label="MARC21" value={bibRecords.filter((b) => b.format === "MARC21").length} accent="accent" />
        <StatCard label="UNIMARC" value={bibRecords.filter((b) => b.format === "UNIMARC").length} accent="accent" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="records">
          <TabsList>
            <TabsTrigger value="records">Catalog</TabsTrigger>
            <TabsTrigger value="editor">MARC editor</TabsTrigger>
            <TabsTrigger value="z3950">Z39.50 / SRU</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Search title, author, ISBN, call number…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button>Search</Button>
              <Button variant="outline">+ New record</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title / Author</TableHead>
                      <TableHead className="mono">ISBN</TableHead>
                      <TableHead className="mono">Call No.</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground">{b.author} · {b.publisher}, {b.year}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {b.subjects.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="mono text-xs">{b.isbn}</TableCell>
                        <TableCell className="mono text-xs">{b.callNumber}</TableCell>
                        <TableCell><Badge variant="secondary">{b.format}</Badge></TableCell>
                        <TableCell>
                          <span className={b.available === 0 ? "text-destructive font-medium" : "font-medium"}>
                            {b.available}/{b.copies}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">MARC21 record editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Format</Label>
                    <Select defaultValue="marc21">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marc21">MARC21</SelectItem>
                        <SelectItem value="unimarc">UNIMARC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Record type</Label>
                    <Select defaultValue="a">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">a — Language material</SelectItem>
                        <SelectItem value="e">e — Cartographic</SelectItem>
                        <SelectItem value="i">i — Non-musical sound</SelectItem>
                        <SelectItem value="m">m — Computer file</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Encoding level</Label>
                    <Select defaultValue="full">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="copy">Copy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>MARC fields</Label>
                  <Textarea value={marc} onChange={(e) => setMarc(e.target.value)} rows={16} className="mono text-xs" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Validate</Button>
                  <Button onClick={() => toast.success("Record saved to catalog")}>Save record</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="z3950" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-serif">Z39.50 / SRU search</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label>Target</Label>
                    <Select value={target} onValueChange={setTarget}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {z3950Targets.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground mono">{z3950Targets.find((t) => t.id === target)?.host}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Query (ISBN, title, author)</Label>
                    <Input placeholder="e.g. 9780143127741" />
                  </div>
                </div>
                <Button onClick={() => toast.success("3 records found", { description: "Connection to remote Z39.50 target succeeded" })}>
                  Search remote target
                </Button>
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Configured targets: {z3950Targets.length}. Use the Admin module to add SRU/Z39.50 servers, attribute sets and authentication.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
