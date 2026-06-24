import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { bibRecords, checkouts, holds } from "@/lib/mock-data";
import type { Hold } from "@/lib/mock-data";
import {
  DataPagination,
  usePagination,
} from "@/components/data-pagination";
import type { PaginationState } from "@/components/data-pagination";
import {
  Search,
  BookOpen,
  Bookmark,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/opac")({
  head: () => ({ meta: [{ title: "OPAC — Athenaeum Public Catalog" }] }),
  component: OPAC,
});

const PATRON_NAME = "Eleanor Voss";

function OPAC() {
  // ── Main search ────────────────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [field, setField] = useState("any");

  // ── Advanced search ────────────────────────────────────────────────────
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advAuthor, setAdvAuthor] = useState("");
  const [advSubject, setAdvSubject] = useState("");
  const [advYearFrom, setAdvYearFrom] = useState("");
  const [advYearTo, setAdvYearTo] = useState("");
  const [advLanguage, setAdvLanguage] = useState("any");
  const [advOperator, setAdvOperator] = useState("AND");

  // ── Sorting ────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("relevance");

  // ── Pagination ─────────────────────────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 5,
  });

  // ── My Account sheet ───────────────────────────────────────────────────
  const [accountOpen, setAccountOpen] = useState(false);
  const [localHolds, setLocalHolds] = useState<Hold[]>(
    holds.filter((h) => h.patron === PATRON_NAME),
  );
  const myLoans = checkouts.filter((c) => c.patron === PATRON_NAME);

  // Reset to page 1 whenever any filter or sort changes
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [q, field, advAuthor, advSubject, advYearFrom, advYearTo, advLanguage, advOperator, sortBy]);

  // ── Filter ─────────────────────────────────────────────────────────────
  const matches = bibRecords.filter((b) => {
    // Main query
    if (q) {
      const v = q.toLowerCase();
      let qMatch = false;
      if (field === "title") qMatch = b.title.toLowerCase().includes(v);
      else if (field === "author") qMatch = b.author.toLowerCase().includes(v);
      else if (field === "subject")
        qMatch = b.subjects.some((s) => s.toLowerCase().includes(v));
      else if (field === "isbn") qMatch = b.isbn.includes(v);
      else
        qMatch = [b.title, b.author, b.isbn, ...b.subjects].some((f) =>
          f.toLowerCase().includes(v),
        );
      if (!qMatch) return false;
    }

    // Advanced filters — collect individual results then combine with operator
    const advChecks: boolean[] = [];

    if (advAuthor)
      advChecks.push(
        b.author.toLowerCase().includes(advAuthor.toLowerCase()),
      );
    if (advSubject)
      advChecks.push(
        b.subjects.some((s) =>
          s.toLowerCase().includes(advSubject.toLowerCase()),
        ),
      );
    if (advYearFrom) advChecks.push(b.year >= Number(advYearFrom));
    if (advYearTo) advChecks.push(b.year <= Number(advYearTo));
    if (advLanguage !== "any") {
      const langMatch =
        advLanguage === "english"
          ? b.format === "MARC21"
          : advLanguage === "french"
            ? b.subjects.includes("French literature") ||
              b.publisher === "Gallimard"
            : advLanguage === "spanish"
              ? b.publisher === "Cátedra"
              : false; // german — no matches in demo data
      advChecks.push(langMatch);
    }

    if (advChecks.length === 0) return true;
    return advOperator === "AND"
      ? advChecks.every(Boolean)
      : advChecks.some(Boolean);
  });

  // ── Sort ───────────────────────────────────────────────────────────────
  const sorted = [...matches].sort((a, b) => {
    if (sortBy === "title-asc") return a.title.localeCompare(b.title);
    if (sortBy === "title-desc") return b.title.localeCompare(a.title);
    if (sortBy === "author-asc") return a.author.localeCompare(b.author);
    if (sortBy === "year-newest") return b.year - a.year;
    if (sortBy === "year-oldest") return a.year - b.year;
    return 0; // relevance — keep original order
  });

  // ── Paginate ───────────────────────────────────────────────────────────
  const { paged, total, totalPages, page } = usePagination(sorted, pagination);
  const startIdx = total === 0 ? 0 : (page - 1) * pagination.pageSize + 1;
  const endIdx = Math.min(page * pagination.pageSize, total);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Public catalog (OPAC)"
      description="What patrons see when they search the collection."
      actions={
        <Button variant="outline" onClick={() => setAccountOpen(true)}>
          <User className="mr-1.5 h-4 w-4" />
          My Account
        </Button>
      }
    >
      {/* ── Search hero ────────────────────────────────────────────────── */}
      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="py-10">
          <h2 className="font-serif text-3xl font-semibold">
            Find your next read
          </h2>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Search books, journals, audiobooks and digital resources.
          </p>

          {/* Main search row */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="w-full sm:w-44 bg-background/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any field</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
                <SelectItem value="isbn">ISBN</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try "sapiens", "Camus", or "astronomy"…'
              className="flex-1 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button
              variant="secondary"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setPagination((p) => ({ ...p, page: 1 }))}
            >
              <Search className="mr-1.5 h-4 w-4" />
              Search
            </Button>
          </div>

          {/* Advanced search toggle */}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => setAdvancedOpen((o) => !o)}
            >
              {advancedOpen ? (
                <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
              )}
              Advanced search
            </Button>

            {advancedOpen && (
              <div className="mt-4 grid gap-3 rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Author */}
                <div>
                  <label className="mb-1 block text-xs text-primary-foreground/70">
                    Author
                  </label>
                  <Input
                    value={advAuthor}
                    onChange={(e) => setAdvAuthor(e.target.value)}
                    placeholder="e.g. Harari"
                    className="bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                  />
                </div>

                {/* Subject keyword */}
                <div>
                  <label className="mb-1 block text-xs text-primary-foreground/70">
                    Subject keyword
                  </label>
                  <Input
                    value={advSubject}
                    onChange={(e) => setAdvSubject(e.target.value)}
                    placeholder="e.g. Fiction"
                    className="bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                  />
                </div>

                {/* Year from / to */}
                <div>
                  <label className="mb-1 block text-xs text-primary-foreground/70">
                    Year
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={advYearFrom}
                      onChange={(e) => setAdvYearFrom(e.target.value)}
                      placeholder="From"
                      className="bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                    />
                    <Input
                      type="number"
                      value={advYearTo}
                      onChange={(e) => setAdvYearTo(e.target.value)}
                      placeholder="To"
                      className="bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                    />
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="mb-1 block text-xs text-primary-foreground/70">
                    Publication language
                  </label>
                  <Select value={advLanguage} onValueChange={setAdvLanguage}>
                    <SelectTrigger className="bg-background/10 border-primary-foreground/20 text-primary-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any language</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Boolean operator */}
                <div>
                  <label className="mb-1 block text-xs text-primary-foreground/70">
                    Boolean operator
                  </label>
                  <Select value={advOperator} onValueChange={setAdvOperator}>
                    <SelectTrigger className="bg-background/10 border-primary-foreground/20 text-primary-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search button */}
                <div className="flex items-end">
                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setPagination((p) => ({ ...p, page: 1 }))}
                  >
                    <Search className="mr-1.5 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Main content grid ─────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* ── Facets sidebar ──────────────────────────────────────────────── */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <h3 className="font-serif text-sm font-semibold">
                Refine results
              </h3>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    Format
                  </div>
                  {["Book", "Audiobook", "eBook", "DVD"].map((f) => (
                    <label
                      key={f}
                      className="flex items-center gap-2 py-0.5"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={f === "Book"}
                        className="accent-accent"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    Availability
                  </div>
                  <label className="flex items-center gap-2 py-0.5">
                    <input type="checkbox" className="accent-accent" />
                    <span>Available now</span>
                  </label>
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    Branch
                  </div>
                  {["Central", "Riverside", "North Hill"].map((f) => (
                    <label
                      key={f}
                      className="flex items-center gap-2 py-0.5"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="accent-accent"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ── Results column ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Sort / count bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "No results"
                : `Showing ${startIdx}–${endIdx} of ${total} result${total === 1 ? "" : "s"}`}
              {q && (
                <>
                  {" "}
                  for{" "}
                  <span className="font-medium text-foreground">"{q}"</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="title-asc">Title A–Z</SelectItem>
                  <SelectItem value="title-desc">Title Z–A</SelectItem>
                  <SelectItem value="author-asc">Author A–Z</SelectItem>
                  <SelectItem value="year-newest">Year (newest)</SelectItem>
                  <SelectItem value="year-oldest">Year (oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result cards */}
          {paged.map((b) => (
            <Card
              key={b.id}
              className="transition-all hover:border-accent hover:shadow-md"
            >
              <CardContent className="flex gap-4 py-4">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg font-semibold leading-snug">
                    <Link
                      to="/opac/$id"
                      params={{ id: b.id }}
                      className="hover:text-accent hover:underline"
                    >
                      {b.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    by {b.author} · {b.publisher}, {b.year}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {b.subjects.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="mono text-muted-foreground">
                      ISBN {b.isbn}
                    </span>
                    <span className="mono text-muted-foreground">
                      {b.callNumber}
                    </span>
                    {b.available > 0 ? (
                      <Badge className="bg-success text-success-foreground">
                        {b.available} available
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Checked out</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={b.available > 0 ? "default" : "outline"}
                    onClick={() =>
                      toast.success(
                        b.available > 0
                          ? "Reserved for pickup"
                          : "Hold placed — you are next in queue",
                      )
                    }
                  >
                    <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                    {b.available > 0 ? "Reserve" : "Place hold"}
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/opac/$id" params={{ id: b.id }}>
                      Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {total > 0 && (
            <Card>
              <DataPagination
                page={page}
                pageSize={pagination.pageSize}
                total={total}
                totalPages={totalPages}
                onChange={setPagination}
                pageSizeOptions={[5, 10, 20]}
              />
            </Card>
          )}
        </div>
      </div>

      {/* ── My Account Sheet ──────────────────────────────────────────────── */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {PATRON_NAME}
            </SheetTitle>
            <SheetDescription>
              Your loans and holds at Athenaeum Library.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* My Loans */}
            <section>
              <h3 className="mb-3 font-serif text-base font-semibold">
                My loans
              </h3>
              {myLoans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active loans.
                </p>
              ) : (
                <div className="space-y-3">
                  {myLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{loan.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Due {loan.dueDate}
                          </p>
                          <div className="mt-1">
                            {loan.status === "Overdue" ? (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                Overdue
                              </Badge>
                            ) : (
                              <Badge className="bg-success text-success-foreground text-[10px]">
                                On loan
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() =>
                            toast.success(
                              `"${loan.title}" renewed — new due date in 28 days.`,
                            )
                          }
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Renew
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* My Holds */}
            <section>
              <h3 className="mb-3 font-serif text-base font-semibold">
                My holds
              </h3>
              {localHolds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active holds.
                </p>
              ) : (
                <div className="space-y-3">
                  {localHolds.map((hold) => (
                    <div
                      key={hold.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{hold.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {hold.pickupBranch} · Position {hold.position}
                          </p>
                          <div className="mt-1">
                            <Badge
                              variant={
                                hold.status === "Ready for pickup"
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                hold.status === "In transit"
                                  ? "border-warning text-warning"
                                  : undefined
                              }
                            >
                              {hold.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setLocalHolds((prev) =>
                              prev.filter((h) => h.id !== hold.id),
                            );
                            toast.info(
                              `Hold on "${hold.title}" cancelled.`,
                            );
                          }}
                        >
                          Cancel hold
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
