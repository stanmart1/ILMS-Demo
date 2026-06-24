import { createFileRoute, Link } from "@tanstack/react-router";
import { bibRecords } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Bookmark, BookMarked } from "lucide-react";

export const Route = createFileRoute("/opac/$id")({
  head: () => ({ meta: [{ title: "Item detail — Athenaeum OPAC" }] }),
  component: OPACDetail,
});

// Mock holdings data for the detail page
const mockHoldings = [
  { branch: "Central", location: "Adult Fiction", callNumber: "", barcode: "31901-00045", itemType: "Book", status: "On loan", dueDate: "2026-07-08" },
  { branch: "Central", location: "Adult Fiction", callNumber: "", barcode: "31901-00046", itemType: "Book", status: "Available", dueDate: null },
  { branch: "Riverside", location: "Adult Fiction", callNumber: "", barcode: "31901-00047", itemType: "Book", status: "Available", dueDate: null },
  { branch: "North Hill", location: "Adult Fiction", callNumber: "", barcode: "31901-00048", itemType: "Book", status: "In transit", dueDate: null },
];

function OPACDetail() {
  const { id } = Route.useParams();
  const record = bibRecords.find((b) => b.id === id);

  if (!record) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Item not found</h1>
        <p className="mt-2 text-muted-foreground text-sm">This catalog record does not exist.</p>
        <Button asChild className="mt-6"><Link to="/opac">Back to catalog</Link></Button>
      </div>
    );
  }

  const holdings = mockHoldings.map((h) => ({ ...h, callNumber: record.callNumber }));
  const availableCount = holdings.filter((h) => h.status === "Available").length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/opac"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to catalog</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Title block */}
          <div>
            <div className="flex flex-wrap items-start gap-3">
              <Badge variant="secondary">{record.format}</Badge>
              {record.subjects.map((s) => (
                <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>
              ))}
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight">{record.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">by {record.author}</p>
            <p className="mt-1 text-sm text-muted-foreground">{record.publisher} · {record.year}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="mono text-muted-foreground">ISBN {record.isbn}</span>
              <span className="mono text-muted-foreground">Call no. {record.callNumber}</span>
            </div>
          </div>

          <Separator />

          {/* Description placeholder */}
          <div>
            <h2 className="font-serif text-lg font-semibold mb-2">Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No summary available for this record. To view full details, consult the physical item or search the Library of Congress catalog using ISBN {record.isbn}.
            </p>
          </div>

          <Separator />

          {/* Holdings */}
          <div>
            <h2 className="font-serif text-lg font-semibold mb-4">Holdings ({holdings.length} copies)</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Call no.</TableHead>
                        <TableHead className="mono">Barcode</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holdings.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{h.branch}</TableCell>
                          <TableCell>{h.location}</TableCell>
                          <TableCell className="mono text-xs">{h.callNumber}</TableCell>
                          <TableCell className="mono text-xs">{h.barcode}</TableCell>
                          <TableCell>{h.itemType}</TableCell>
                          <TableCell>
                            <Badge variant={h.status === "Available" ? "default" : h.status === "On loan" ? "destructive" : "outline"}>
                              {h.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="mono text-xs text-muted-foreground">{h.dueDate ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* MARC fields preview */}
          <div>
            <h2 className="font-serif text-lg font-semibold mb-2">Bibliographic details ({record.format})</h2>
            <div className="rounded-md bg-muted p-4 font-mono text-xs space-y-1 text-muted-foreground">
              <div><span className="text-foreground font-medium">020</span>  $a{record.isbn}</div>
              <div><span className="text-foreground font-medium">100</span>  1_ $a{record.author}</div>
              <div><span className="text-foreground font-medium">245</span>  14 $a{record.title}</div>
              <div><span className="text-foreground font-medium">260</span>  __ $a{record.publisher},$c{record.year}</div>
              <div><span className="text-foreground font-medium">092</span>  __ $a{record.callNumber}</div>
              {record.subjects.map((s, i) => (
                <div key={i}><span className="text-foreground font-medium">650</span>  _0 $a{s}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableCount > 0 ? (
                <div className="flex items-center gap-2 text-success">
                  <div className="h-2.5 w-2.5 rounded-full bg-success" />
                  <span className="font-medium text-sm">{availableCount} copy available</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  <span className="font-medium text-sm">All copies checked out</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{record.copies} total copies across all branches</p>
              <Separator />
              <div className="space-y-2">
                <Button className="w-full" onClick={() => toast.success(availableCount > 0 ? "Item reserved for pickup at Central" : "Hold placed — you are #1 in queue")}>
                  <Bookmark className="mr-1.5 h-4 w-4" />
                  {availableCount > 0 ? "Reserve for pickup" : "Place hold"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast.info("Added to reading list")}>
                  <BookMarked className="mr-1.5 h-4 w-4" />
                  Add to reading list
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">More like this</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bibRecords.filter((b) => b.id !== record.id && b.subjects.some((s) => record.subjects.includes(s))).slice(0, 3).map((b) => (
                <Link key={b.id} to="/opac/$id" params={{ id: b.id }} className="flex items-start gap-2 group">
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-secondary">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:underline leading-snug">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.author}</div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
