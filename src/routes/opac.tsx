import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/lib/auth";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  bibRecords,
  checkouts,
  holds,
  patrons,
  fines as allFines,
} from "@/lib/mock-data";
import type { Hold, Patron } from "@/lib/mock-data";
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
  LogOut,
  Plus,
  Trash2,
  X,
  ListPlus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/opac")({
  head: () => ({ meta: [{ title: "OPAC — Athenaeum Public Catalog" }] }),
  component: OPAC,
});

// ── Patron login schema ────────────────────────────────────────────────────
const loginSchema = z.object({
  cardNumber: z.string().min(1, "Card number is required"),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

// ── Reading list type ──────────────────────────────────────────────────────
type ReadingList = { id: string; name: string; items: string[] };

// ── PatronLoginDialog ──────────────────────────────────────────────────────
function PatronLoginDialog({
  open,
  onOpenChange,
  onLogin,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onLogin: (patron: Patron) => void;
}) {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { cardNumber: "", pin: "" },
  });

  function handleOpenChange(value: boolean) {
    if (!value) form.reset();
    onOpenChange(value);
  }

  function handleSubmit(values: LoginForm) {
    const patron = patrons.find((p) => p.cardNumber === values.cardNumber);
    if (!patron) {
      form.setError("cardNumber", { message: "Card number not found" });
      return;
    }
    if (values.pin !== "1234") {
      form.setError("pin", { message: "Incorrect PIN" });
      return;
    }
    onLogin(patron);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to your account</DialogTitle>
          <DialogDescription>
            Enter your library card number and PIN to access your account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. C-100245" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main OPAC component ────────────────────────────────────────────────────
function OPAC() {
  // Staff viewing the OPAC as a preview don't need a patron sign-in button.
  const { user: staffUser } = useAuth();

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

  // ── Auth ───────────────────────────────────────────────────────────────
  const [opacPatron, setOpacPatron] = useState<Patron | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // ── My Account sheet ───────────────────────────────────────────────────
  const [accountOpen, setAccountOpen] = useState(false);
  const [localHolds, setLocalHolds] = useState<Hold[]>([]);

  // ── My lists (Bookshelves) ─────────────────────────────────────────────
  const [lists, setLists] = useState<ReadingList[]>([
    { id: "l1", name: "Want to read", items: ["Sapiens", "Educated"] },
    { id: "l2", name: "Finished", items: ["The Sympathizer"] },
  ]);
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Sync holds when patron changes
  useEffect(() => {
    setLocalHolds(
      opacPatron ? holds.filter((h) => h.patron === opacPatron.name) : [],
    );
  }, [opacPatron]);

  // Derived patron data
  const myLoans = opacPatron
    ? checkouts.filter((c) => c.patron === opacPatron.name)
    : [];
  const myHistory = opacPatron
    ? checkouts.filter((c) => c.patron === opacPatron.name)
    : [];
  const myFines = opacPatron
    ? allFines.filter((f) => f.patronId === opacPatron.id)
    : [];
  const outstandingTotal = myFines
    .filter((f) => !f.paid)
    .reduce((sum, f) => sum + f.amount, 0);

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

  // ── List helpers ───────────────────────────────────────────────────────
  function addToList(listId: string, title: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId && !l.items.includes(title)
          ? { ...l, items: [...l.items, title] }
          : l,
      ),
    );
    const listName = lists.find((l) => l.id === listId)?.name ?? "list";
    toast.success(`"${title}" added to "${listName}"`);
  }

  function confirmNewList() {
    const name = newListName.trim();
    if (!name) return;
    setLists((prev) => [
      ...prev,
      { id: `l${Date.now()}`, name, items: [] },
    ]);
    setNewListName("");
    setAddingList(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Public catalog (OPAC)"
      description="What patrons see when they search the collection."
      actions={
        <>
          <Link to="/glossary">
            <Button variant="ghost" size="sm">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Glossary
            </Button>
          </Link>
          {/* Only show patron Sign In when not viewed by a logged-in staff member.
              On a public terminal the staffUser will be null, so the button appears. */}
          {!staffUser && (
            <Button
              variant="outline"
              onClick={() => {
                if (opacPatron) {
                  setAccountOpen(true);
                } else {
                  setLoginOpen(true);
                }
              }}
            >
              <User className="mr-1.5 h-4 w-4" />
              {opacPatron ? `My Account (${opacPatron.name})` : "Sign in"}
            </Button>
          )}
        </>
      }
    >
      {/* ── Patron login dialog ─────────────────────────────────────────── */}
      <PatronLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLogin={(patron) => {
          setOpacPatron(patron);
          toast.success(`Welcome back, ${patron.name}!`);
        }}
      />

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
                  {/* Add to list dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <ListPlus className="mr-1.5 h-3.5 w-3.5" />
                        Add to list
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {lists.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No lists — create one in My Account
                        </DropdownMenuItem>
                      ) : (
                        lists.map((list) => (
                          <DropdownMenuItem
                            key={list.id}
                            onClick={() => addToList(list.id, b.title)}
                          >
                            {list.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              {opacPatron ? opacPatron.name : "My Account"}
            </SheetTitle>
            <SheetDescription>
              {opacPatron ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono">{opacPatron.cardNumber}</span>
                  <span>·</span>
                  <Badge
                    variant={
                      opacPatron.status === "Active"
                        ? "default"
                        : opacPatron.status === "Suspended"
                          ? "destructive"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {opacPatron.status}
                  </Badge>
                  <span>·</span>
                  <span>{opacPatron.category}</span>
                </span>
              ) : (
                "Your loans and holds at Athenaeum Library."
              )}
            </SheetDescription>
          </SheetHeader>

          {/* Guard: not signed in */}
          {!opacPatron ? (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <User className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Sign in to view your account.
              </p>
              <Button
                onClick={() => {
                  setAccountOpen(false);
                  setLoginOpen(true);
                }}
              >
                Sign in
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* ── My Loans ──────────────────────────────────────────── */}
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

              {/* ── My Holds ──────────────────────────────────────────── */}
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

              <Separator />

              {/* ── My Fines ──────────────────────────────────────────── */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold">
                    My fines
                  </h3>
                  {outstandingTotal > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      Outstanding: ₦{outstandingTotal.toFixed(2)}
                    </Badge>
                  )}
                </div>
                {myFines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No outstanding fines.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myFines.map((fine) => (
                      <div
                        key={fine.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {fine.itemTitle}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {fine.date}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              {fine.type}
                            </Badge>
                            <span className="text-sm font-semibold">
                              ₦{fine.amount.toFixed(2)}
                            </span>
                            {fine.paid ? (
                              <Badge className="bg-success text-success-foreground text-[10px]">
                                Paid
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                Outstanding
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* ── Reading history ───────────────────────────────────── */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold">
                    Reading history
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => toast.info("Reading history cleared")}
                  >
                    Clear history
                  </Button>
                </div>
                {myHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reading history.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myHistory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {item.title}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                              {item.barcode}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Out: {item.checkedOut} · Due: {item.dueDate}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {item.status === "Overdue" ? (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                Overdue
                              </Badge>
                            ) : item.status === "Returned" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                Returned
                              </Badge>
                            ) : (
                              <Badge className="bg-success text-success-foreground text-[10px]">
                                On loan
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* ── My lists (Bookshelves) ────────────────────────────── */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold">
                    My lists
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setAddingList(true)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    New list
                  </Button>
                </div>

                {/* Inline new-list input */}
                {addingList && (
                  <div className="mb-3 flex gap-2">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name…"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmNewList();
                        if (e.key === "Escape") {
                          setNewListName("");
                          setAddingList(false);
                        }
                      }}
                    />
                    <Button size="sm" className="h-8" onClick={confirmNewList}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => {
                        setNewListName("");
                        setAddingList(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {lists.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No lists yet. Create one!
                    </p>
                  )}
                  {lists.map((list) => (
                    <Collapsible key={list.id} defaultOpen>
                      <div className="rounded-lg border border-border">
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/50">
                          <span>
                            {list.name}{" "}
                            <span className="font-normal text-muted-foreground">
                              ({list.items.length})
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLists((prev) =>
                                  prev.filter((l) => l.id !== list.id),
                                );
                                toast.info(`"${list.name}" deleted.`);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.stopPropagation();
                                  setLists((prev) =>
                                    prev.filter((l) => l.id !== list.id),
                                  );
                                  toast.info(`"${list.name}" deleted.`);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {list.items.length === 0 ? (
                            <p className="px-3 pb-3 pt-1 text-xs text-muted-foreground">
                              No items yet.
                            </p>
                          ) : (
                            <ul className="divide-y divide-border">
                              {list.items.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center justify-between px-3 py-1.5 text-sm"
                                >
                                  <span>{item}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setLists((prev) =>
                                        prev.map((l) =>
                                          l.id === list.id
                                            ? {
                                                ...l,
                                                items: l.items.filter(
                                                  (_, i) => i !== idx,
                                                ),
                                              }
                                            : l,
                                        ),
                                      )
                                    }
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </section>

              <Separator />

              {/* ── Sign out ──────────────────────────────────────────── */}
              <div className="pb-4">
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setOpacPatron(null);
                    setAccountOpen(false);
                    toast.info("You have been signed out.");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
