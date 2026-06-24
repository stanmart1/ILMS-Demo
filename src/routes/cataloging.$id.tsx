import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { bibRecords, checkouts } from "@/lib/mock-data";
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
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/cataloging/$id")({
  head: () => ({ meta: [{ title: "Catalog record — Athenaeum" }] }),
  component: CatalogingDetail,
});

// ── MARC field row type ───────────────────────────────────────────────────────
type MarcField = {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: string;
};

function CatalogingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const record = bibRecords.find((b) => b.id === id);

  if (!record) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Record not found</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          This bibliographic record does not exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/cataloging">Back to Cataloging</Link>
        </Button>
      </div>
    );
  }

  // ── Holdings rows ─────────────────────────────────────────────────────────
  const onLoanCount = record.copies - record.available;
  const holdingRows = Array.from({ length: record.copies }, (_, i) => ({
    barcode: `31901-${record.id}${i + 1}`.padEnd(12, "0"),
    branch: "Central",
    location: "General stacks",
    itemType: "Book",
    status: i < onLoanCount ? "On loan" : "Available",
  }));

  // ── Filter checkouts for this title ──────────────────────────────────────
  const activeCheckouts = checkouts.filter(
    (c) => c.title.toLowerCase() === record.title.toLowerCase()
  );

  // ── MARC fields ───────────────────────────────────────────────────────────
  const marcFields: MarcField[] = [
    { tag: "LDR", ind1: "", ind2: "", subfields: "00000nam a2200000 a 4500" },
    { tag: "001", ind1: "", ind2: "", subfields: record.id },
    { tag: "020", ind1: " ", ind2: " ", subfields: `$a ${record.isbn}` },
    { tag: "100", ind1: "1", ind2: " ", subfields: `$a ${record.author}` },
    { tag: "245", ind1: "1", ind2: "0", subfields: `$a ${record.title}` },
    {
      tag: "260",
      ind1: " ",
      ind2: " ",
      subfields: `$a [City] $b ${record.publisher} $c ${record.year}`,
    },
    { tag: "300", ind1: " ", ind2: " ", subfields: "$a pages ; 24 cm" },
    ...record.subjects.map((s) => ({
      tag: "650",
      ind1: " ",
      ind2: "0",
      subfields: `$a ${s}`,
    })),
  ];

  return (
    <PageShell title={record.title}>
      {/* Back button */}
      <Button
        variant="ghost"
        className="-ml-2 mb-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate({ to: "/cataloging" })}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Cataloging
      </Button>

      {/* Header block */}
      <div className="mb-6 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{record.format}</Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {record.callNumber}
          </span>
        </div>
        <h1 className="font-serif text-2xl font-semibold leading-snug">
          {record.title}
        </h1>
        <p className="text-muted-foreground">by {record.author}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="marc">MARC view</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bibliographic details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">
                  Bibliographic details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ISBN</span>
                  <span className="font-mono">{record.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publisher</span>
                  <span>{record.publisher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span>{record.year}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Subjects</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {record.subjects.map((s) => (
                      <Badge key={s} variant="outline" className="text-[11px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Copies</span>
                  <span>{record.copies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span
                    className={
                      record.available === 0
                        ? "text-destructive font-medium"
                        : "text-success font-medium"
                    }
                  >
                    {record.available}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Availability card */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {holdingRows.map((row, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          row.status === "Available"
                            ? "bg-success"
                            : "bg-orange-500"
                        }`}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.barcode}
                      </span>
                      <Badge
                        variant={
                          row.status === "Available" ? "default" : "secondary"
                        }
                        className="ml-auto text-[11px]"
                      >
                        {row.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => navigate({ to: "/cataloging" })}
                  >
                    Edit in Catalog
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      toast.success(
                        "Hold placed — check Circulation for confirmation"
                      )
                    }
                  >
                    Place hold
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Holdings tab ─────────────────────────────────────────────── */}
        <TabsContent value="holdings" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono">Barcode</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Item type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdingRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {row.barcode}
                      </TableCell>
                      <TableCell>{row.branch}</TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell>{row.itemType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "Available"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeCheckouts.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="bg-muted/40 py-1 text-xs text-muted-foreground font-medium"
                        >
                          Currently on loan (from Circulation)
                        </TableCell>
                      </TableRow>
                      {activeCheckouts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">
                            {c.barcode}
                          </TableCell>
                          <TableCell>Central</TableCell>
                          <TableCell>General stacks</TableCell>
                          <TableCell>Book</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{c.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MARC view tab ─────────────────────────────────────────────── */}
        <TabsContent value="marc" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 font-mono">Tag</TableHead>
                    <TableHead className="w-10 font-mono">Ind1</TableHead>
                    <TableHead className="w-10 font-mono">Ind2</TableHead>
                    <TableHead className="font-mono">Subfields</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marcFields.map((f, i) => (
                    <TableRow
                      key={i}
                      className={i % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <TableCell className="font-mono text-xs font-semibold">
                        {f.tag}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {f.ind1}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {f.ind2}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {f.subfields}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
