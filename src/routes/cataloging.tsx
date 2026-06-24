import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { bibRecords, sampleMarc } from "@/lib/mock-data";
import type { BibRecord } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Upload,
  Download,
  Plus,
  Eye,
  Printer,
} from "lucide-react";

export const Route = createFileRoute("/cataloging")({
  head: () => ({ meta: [{ title: "Cataloging — Athenaeum" }] }),
  component: Cataloging,
});

// ── Constants ────────────────────────────────────────────────────────────────

const z3950Targets = [
  { id: "loc", name: "Library of Congress", host: "lx2.loc.gov:210/LCDB" },
  {
    id: "bnf",
    name: "Bibliothèque nationale de France",
    host: "z3950.bnf.fr:2211/TOUT-UTF8",
  },
  { id: "bl", name: "British Library", host: "z3950cat.bl.uk:9909/BLAC" },
  {
    id: "dnb",
    name: "Deutsche Nationalbibliothek",
    host: "z3950.dnb.de:2100/dnb",
  },
];

const BRANCHES = ["Central", "Riverside", "North Hill"] as const;
type Branch = (typeof BRANCHES)[number];

const ITEM_TYPES = ["Book", "DVD", "Audiobook", "Reference", "Periodical"] as const;
type ItemTypeName = (typeof ITEM_TYPES)[number];

const ITEM_STATUSES = [
  "Available",
  "On loan",
  "In transit",
  "Missing",
  "Damaged",
] as const;
type ItemStatus = (typeof ITEM_STATUSES)[number];

// ── Types ────────────────────────────────────────────────────────────────────

type HoldingItem = {
  id: string;
  barcode: string;
  branch: Branch;
  location: string;
  itemType: ItemTypeName;
  status: ItemStatus;
};

type HoldingsMap = Record<string, HoldingItem[]>;

// ── Helpers ──────────────────────────────────────────────────────────────────

let barcodeSeq = 600;
function nextBarcode(): string {
  barcodeSeq += 1;
  return `31901-${String(barcodeSeq).padStart(5, "0")}`;
}

function buildInitialHoldings(records: BibRecord[]): HoldingsMap {
  const map: HoldingsMap = {};
  const branchCycle: Branch[] = ["Central", "Riverside", "North Hill"];
  records.forEach((r) => {
    map[r.id] = Array.from({ length: r.copies }, (_, i) => ({
      id: `${r.id}-item-${i}`,
      barcode: `31901-${String(i + 1).padStart(5, "0")}`,
      branch: branchCycle[i % branchCycle.length],
      location: r.subjects[0] ?? "General",
      itemType: "Book" as ItemTypeName,
      status: i < r.available ? "Available" : ("On loan" as ItemStatus),
    }));
  });
  return map;
}

// ── Mock Z39.50 results ──────────────────────────────────────────────────────

const mockZ3950Results = [
  {
    id: "z1",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    publisher: "Prentice Hall",
    year: 2008,
    isbn: "9780132350884",
    callNumber: "QA76.76.D47 M37",
    marc: `LDR 00000nam a2200000 i 4500
001 z1-mock
003 LoC
008 081201s2008    nyu           000 0 eng d
020 $a 9780132350884
100 1_ $a Martin, Robert C., $e author.
245 10 $a Clean Code : $b a handbook of agile software craftsmanship / $c Robert C. Martin.
264 _1 $a Upper Saddle River, NJ : $b Prentice Hall, $c 2008.
300 __ $a 431 pages ; $c 24 cm
650 _0 $a Agile software development.
650 _0 $a Computer programming.`,
  },
  {
    id: "z2",
    title: "The Pragmatic Programmer: Your Journey to Mastery",
    author: "David Thomas, Andrew Hunt",
    publisher: "Addison-Wesley",
    year: 2019,
    isbn: "9780135957059",
    callNumber: "QA76.6 .H86",
    marc: `LDR 00000nam a2200000 i 4500
001 z2-mock
003 LoC
008 190901s2019    mau           000 0 eng d
020 $a 9780135957059
100 1_ $a Thomas, David, $e author.
245 14 $a The pragmatic programmer : $b your journey to mastery / $c David Thomas, Andrew Hunt.
264 _1 $a Boston : $b Addison-Wesley, $c 2019.
300 __ $a 352 pages ; $c 24 cm
650 _0 $a Computer programming.`,
  },
  {
    id: "z3",
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    author: "Erich Gamma et al.",
    publisher: "Addison-Wesley",
    year: 1994,
    isbn: "9780201633610",
    callNumber: "QA76.64 .D47",
    marc: `LDR 00000nam a2200000 i 4500
001 z3-mock
003 LoC
008 940101s1994    mau           000 0 eng d
020 $a 9780201633610
100 1_ $a Gamma, Erich, $e author.
245 10 $a Design patterns : $b elements of reusable object-oriented software / $c Erich Gamma ... [et al.].
264 _1 $a Reading, Mass. : $b Addison-Wesley, $c 1994.
300 __ $a 395 pages : $b illustrations ; $c 24 cm
650 _0 $a Object-oriented programming (Computer science).
650 _0 $a Software patterns.`,
  },
];

// ── Zod schema for bib record form ──────────────────────────────────────────

const bibSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publisher: z.string().min(1, "Publisher is required"),
  year: z
    .number({ invalid_type_error: "Year must be a number" })
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 5),
  isbn: z.string().min(1, "ISBN is required"),
  callNumber: z.string().min(1, "Call number is required"),
  format: z.enum(["MARC21", "UNIMARC"]),
  subjects: z.string(),
  copies: z
    .number({ invalid_type_error: "Copies must be a number" })
    .int()
    .min(0),
});

type BibFormValues = z.infer<typeof bibSchema>;

// ── Authority types and inline mock data ─────────────────────────────────────

type Authority = {
  id: string;
  type: "Name" | "Subject" | "Corporate" | "Geographic";
  heading: string;
  variants: string[];
  linkedBibs: number;
  source: "LCNAF" | "LCSH" | "Local";
  lastUpdated: string;
};

const defaultAuthorities: Authority[] = [
  { id: "a1", type: "Name", heading: "Nguyen, Viet Thanh, 1971-", variants: ["Nguyen, V. T.", "Việt Thanh Nguyễn"], linkedBibs: 1, source: "LCNAF", lastUpdated: "2026-01-10" },
  { id: "a2", type: "Name", heading: "Harari, Yuval Noah", variants: ["Harari, Y. N."], linkedBibs: 1, source: "LCNAF", lastUpdated: "2026-02-14" },
  { id: "a3", type: "Subject", heading: "Vietnam War, 1961-1975 -- Fiction", variants: [], linkedBibs: 1, source: "LCSH", lastUpdated: "2025-11-20" },
  { id: "a4", type: "Subject", heading: "Cognitive psychology", variants: ["Psychology, Cognitive"], linkedBibs: 1, source: "LCSH", lastUpdated: "2025-09-05" },
  { id: "a5", type: "Subject", heading: "Human evolution", variants: ["Evolution (Biology)"], linkedBibs: 1, source: "LCSH", lastUpdated: "2026-03-01" },
  { id: "a6", type: "Geographic", heading: "France -- Paris", variants: ["Paris (France)"], linkedBibs: 0, source: "LCSH", lastUpdated: "2025-07-22" },
  { id: "a7", type: "Corporate", heading: "United Nations", variants: ["UN", "Nations Unies"], linkedBibs: 0, source: "LCNAF", lastUpdated: "2025-12-15" },
  { id: "a8", type: "Name", heading: "Kahneman, Daniel", variants: [], linkedBibs: 1, source: "LCNAF", lastUpdated: "2026-01-30" },
];

// ── Print item type ───────────────────────────────────────────────────────────

type PrintItem = {
  barcode: string;
  title: string;
  callNumber: string;
};

// ── Authority schema ──────────────────────────────────────────────────────────

const authoritySchema = z.object({
  type: z.enum(["Name", "Subject", "Corporate", "Geographic"]),
  heading: z.string().min(1, "Heading is required"),
  variants: z.string(),
  source: z.enum(["LCNAF", "LCSH", "Local"]),
});

type AuthorityFormValues = z.infer<typeof authoritySchema>;

// ── Bib record dialog ────────────────────────────────────────────────────────

function BibRecordDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: BibRecord | null;
  onSave: (data: BibFormValues, id: string | null) => void;
}) {
  const form = useForm<BibFormValues>({
    resolver: zodResolver(bibSchema),
    defaultValues: editing
      ? {
          title: editing.title,
          author: editing.author,
          publisher: editing.publisher,
          year: editing.year,
          isbn: editing.isbn,
          callNumber: editing.callNumber,
          format: editing.format,
          subjects: editing.subjects.join(", "),
          copies: editing.copies,
        }
      : {
          title: "",
          author: "",
          publisher: "",
          year: new Date().getFullYear(),
          isbn: "",
          callNumber: "",
          format: "MARC21",
          subjects: "",
          copies: 1,
        },
  });

  // Reset form when dialog opens/editing changes
  const handleOpenChange = (v: boolean) => {
    if (!v) form.reset();
    onOpenChange(v);
  };

  function onSubmit(values: BibFormValues) {
    onSave(values, editing?.id ?? null);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editing ? "Edit bibliographic record" : "New bibliographic record"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of the work" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Last, First" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publisher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher</FormLabel>
                    <FormControl>
                      <Input placeholder="Publisher name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input placeholder="9780000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PS3614.G97 S96" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MARC21">MARC21</SelectItem>
                        <SelectItem value="UNIMARC">UNIMARC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="copies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Copies</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Subjects (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Fiction, History, Science…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editing ? "Save changes" : "Add record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── MARC import dialog ───────────────────────────────────────────────────────

function ImportMarcDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    // Mock: count records as 3 per import
    const mockCount = 3;
    toast.success(`${mockCount} records imported successfully`, {
      description: `From file: ${file.name}`,
    });
    onOpenChange(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Import MARC records</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a MARC file (.mrc, .marc, or .txt) to import bibliographic
            records.
          </p>
          <div>
            <Label htmlFor="marc-file">MARC file</Label>
            <Input
              id="marc-file"
              ref={fileRef}
              type="file"
              accept=".mrc,.marc,.txt"
              className="mt-1 cursor-pointer"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Print label dialog ────────────────────────────────────────────────────────

function PrintLabelDialog({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: PrintItem[];
}) {
  useEffect(() => {
    if (!open) return;
    const style = document.createElement("style");
    style.id = "print-label-style";
    style.textContent =
      "@media print { body > *:not(#print-area) { display: none !important; } }";
    document.head.appendChild(style);
    return () => {
      document.getElementById("print-label-style")?.remove();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {items.length === 1
              ? "Print item label"
              : `Print ${items.length} label${items.length !== 1 ? "s" : ""}`}
          </DialogTitle>
        </DialogHeader>

        <div
          id="print-area"
          className="max-h-[60vh] overflow-y-auto space-y-4 py-2"
        >
          {items.map((item) => (
            <div
              key={item.barcode}
              className="border border-border rounded w-40 mx-auto text-center bg-white shadow-sm"
            >
              {/* Call number — top */}
              <div className="bg-muted/60 px-2 py-1.5 border-b border-border">
                <p className="font-mono text-xs font-bold leading-tight break-all">
                  {item.callNumber}
                </p>
              </div>
              {/* Title — middle */}
              <div className="px-2 py-1.5 border-b border-border">
                <p className="text-xs leading-tight line-clamp-2 text-foreground">
                  {item.title}
                </p>
              </div>
              {/* Barcode — bottom */}
              <div className="px-2 py-1.5">
                <p className="font-mono text-xs tracking-widest text-foreground">
                  {item.barcode}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Authority dialog ──────────────────────────────────────────────────────────

function AuthorityDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Authority | null;
  onSave: (data: AuthorityFormValues, id: string | null) => void;
}) {
  const form = useForm<AuthorityFormValues>({
    resolver: zodResolver(authoritySchema),
    defaultValues: { type: "Name", heading: "", variants: "", source: "LCNAF" },
  });

  // Sync form values whenever the dialog opens or the editing target changes
  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              type: editing.type,
              heading: editing.heading,
              variants: editing.variants.join(", "),
              source: editing.source,
            }
          : { type: "Name", heading: "", variants: "", source: "LCNAF" }
      );
    }
  }, [open, editing, form]);

  const handleOpenChange = (v: boolean) => {
    if (!v)
      form.reset({ type: "Name", heading: "", variants: "", source: "LCNAF" });
    onOpenChange(v);
  };

  function onSubmit(values: AuthorityFormValues) {
    onSave(values, editing?.id ?? null);
    form.reset({ type: "Name", heading: "", variants: "", source: "LCNAF" });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editing ? "Edit authority" : "New authority"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Name">Name</SelectItem>
                        <SelectItem value="Subject">Subject</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Geographic">Geographic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LCNAF">LCNAF</SelectItem>
                        <SelectItem value="LCSH">LCSH</SelectItem>
                        <SelectItem value="Local">Local</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Heading</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Authorized form of the name or term"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variants"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      Variants (comma-separated, optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alternate forms, cross-references…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editing ? "Save changes" : "Create authority"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Authorities tab ───────────────────────────────────────────────────────────

const AUTHORITY_TYPE_FILTERS = [
  "All",
  "Name",
  "Subject",
  "Corporate",
  "Geographic",
] as const;
type AuthorityTypeFilter = (typeof AUTHORITY_TYPE_FILTERS)[number];

function AuthoritiesTab() {
  const [authorities, setAuthorities] =
    useState<Authority[]>(defaultAuthorities);
  const [authSearch, setAuthSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AuthorityTypeFilter>("All");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<Authority | null>(null);
  const [deleteAuthTarget, setDeleteAuthTarget] = useState<Authority | null>(
    null
  );

  const filteredAuths = authorities.filter((a) => {
    const q = authSearch.toLowerCase();
    const matchesSearch =
      !q ||
      a.heading.toLowerCase().includes(q) ||
      a.variants.some((v) => v.toLowerCase().includes(q));
    const matchesType = typeFilter === "All" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  function handleSaveAuth(data: AuthorityFormValues, id: string | null) {
    const variantList = data.variants
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const today = new Date().toISOString().split("T")[0];
    if (id) {
      setAuthorities((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                type: data.type,
                heading: data.heading,
                variants: variantList,
                source: data.source,
                lastUpdated: today,
              }
            : a
        )
      );
      toast.success("Authority updated");
    } else {
      const newAuth: Authority = {
        id: `a-${Date.now()}`,
        type: data.type,
        heading: data.heading,
        variants: variantList,
        linkedBibs: 0,
        source: data.source,
        lastUpdated: today,
      };
      setAuthorities((prev) => [...prev, newAuth]);
      toast.success("Authority created");
    }
  }

  function handleDeleteAuth() {
    if (!deleteAuthTarget) return;
    setAuthorities((prev) =>
      prev.filter((a) => a.id !== deleteAuthTarget.id)
    );
    toast.success("Authority deleted");
    setDeleteAuthTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* Search + type filter chips + new authority button */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          className="flex-1 min-w-[220px]"
          placeholder="Search heading or variants…"
          value={authSearch}
          onChange={(e) => setAuthSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {AUTHORITY_TYPE_FILTERS.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={typeFilter === t ? "default" : "outline"}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => {
            setEditingAuth(null);
            setAuthDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New authority
        </Button>
      </div>

      {/* Authorities table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Heading</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Linked bibs</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuths.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium max-w-[240px]">
                    {a.heading}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                    {a.variants.length > 0 ? (
                      a.variants.join(", ")
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </TableCell>
                  <TableCell>{a.linkedBibs}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.source}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.lastUpdated}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingAuth(a);
                          setAuthDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteAuthTarget(a)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAuths.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No authorities match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Authority dialog */}
      <AuthorityDialog
        open={authDialogOpen}
        onOpenChange={(v) => {
          setAuthDialogOpen(v);
          if (!v) setEditingAuth(null);
        }}
        editing={editingAuth}
        onSave={handleSaveAuth}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteAuthTarget}
        onOpenChange={(v) => !v && setDeleteAuthTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this authority?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteAuthTarget?.heading}</strong> will be permanently
              removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAuth}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Holdings tab ─────────────────────────────────────────────────────────────

function HoldingsTab({
  records,
  holdings,
  onHoldingsChange,
}: {
  records: BibRecord[];
  holdings: HoldingsMap;
  onHoldingsChange: (map: HoldingsMap) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printDialogItems, setPrintDialogItems] = useState<PrintItem[]>([]);

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleItemSelect(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }

  function addCopy(record: BibRecord) {
    const existing = holdings[record.id] ?? [];
    const newItem: HoldingItem = {
      id: `${record.id}-item-${Date.now()}`,
      barcode: nextBarcode(),
      branch: "Central",
      location: record.subjects[0] ?? "General",
      itemType: "Book",
      status: "Available",
    };
    onHoldingsChange({ ...holdings, [record.id]: [...existing, newItem] });
  }

  function deleteCopy(recordId: string, itemId: string) {
    if (!window.confirm("Delete this copy? This action cannot be undone."))
      return;
    const updated = (holdings[recordId] ?? []).filter((i) => i.id !== itemId);
    onHoldingsChange({ ...holdings, [recordId]: updated });
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  function updateItemField(
    recordId: string,
    itemId: string,
    field: keyof HoldingItem,
    value: string
  ) {
    const updated = (holdings[recordId] ?? []).map((i) =>
      i.id === itemId ? { ...i, [field]: value } : i
    );
    onHoldingsChange({ ...holdings, [recordId]: updated });
  }

  function openPrintSingle(record: BibRecord, item: HoldingItem) {
    setPrintDialogItems([
      {
        barcode: item.barcode,
        title: record.title,
        callNumber: record.callNumber,
      },
    ]);
    setPrintDialogOpen(true);
  }

  function openPrintSelected() {
    const items: PrintItem[] = [];
    records.forEach((record) => {
      (holdings[record.id] ?? []).forEach((item) => {
        if (selectedItems.has(item.id)) {
          items.push({
            barcode: item.barcode,
            title: record.title,
            callNumber: record.callNumber,
          });
        }
      });
    });
    setPrintDialogItems(items);
    setPrintDialogOpen(true);
  }

  return (
    <div className="space-y-3">
      {/* Print selected toolbar */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={selectedItems.size === 0}
          onClick={openPrintSelected}
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print selected
          {selectedItems.size > 0 ? ` (${selectedItems.size})` : ""}
        </Button>
      </div>

      {records.map((record) => {
        const items = holdings[record.id] ?? [];
        const isOpen = expandedIds.has(record.id);
        return (
          <Card key={record.id}>
            <Collapsible open={isOpen} onOpenChange={() => toggle(record.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer select-none py-3 hover:bg-muted/40 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {record.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate">
                          {record.author} · {record.callNumber}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {items.length} cop{items.length === 1 ? "y" : "ies"}
                    </Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-3 px-4">
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No physical copies. Add one below.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">
                              <span className="sr-only">Select</span>
                            </TableHead>
                            <TableHead className="font-mono text-xs">
                              Barcode
                            </TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Item type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-20" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  aria-label="Select item"
                                  className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                                  checked={selectedItems.has(item.id)}
                                  onChange={() => toggleItemSelect(item.id)}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {item.barcode}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.branch}
                                  onValueChange={(v) =>
                                    updateItemField(
                                      record.id,
                                      item.id,
                                      "branch",
                                      v
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-7 w-32 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BRANCHES.map((b) => (
                                      <SelectItem key={b} value={b}>
                                        {b}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="h-7 w-28 text-xs"
                                  value={item.location}
                                  onChange={(e) =>
                                    updateItemField(
                                      record.id,
                                      item.id,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.itemType}
                                  onValueChange={(v) =>
                                    updateItemField(
                                      record.id,
                                      item.id,
                                      "itemType",
                                      v
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ITEM_TYPES.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {t}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.status}
                                  onValueChange={(v) =>
                                    updateItemField(
                                      record.id,
                                      item.id,
                                      "status",
                                      v
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ITEM_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-0.5 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title="Print label"
                                    onClick={() =>
                                      openPrintSingle(record, item)
                                    }
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      deleteCopy(record.id, item.id)
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addCopy(record)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add copy
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      <PrintLabelDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        items={printDialogItems}
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function Cataloging() {
  // ── Catalog state ──
  const [records, setRecords] = useState<BibRecord[]>(bibRecords);
  const [query, setQuery] = useState("");

  // ── MARC editor ──
  const [marc, setMarc] = useState(sampleMarc);

  // ── Z39.50 ──
  const [target, setTarget] = useState("loc");
  const [z3950Query, setZ3950Query] = useState("");
  const [z3950Results, setZ3950Results] = useState<
    typeof mockZ3950Results | null
  >(null);

  // ── Active tab (for programmatic switching) ──
  const [activeTab, setActiveTab] = useState("records");

  // ── Bib record dialog ──
  const [bibDialogOpen, setBibDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BibRecord | null>(null);

  // ── Delete AlertDialog ──
  const [deleteTarget, setDeleteTarget] = useState<BibRecord | null>(null);

  // ── Import MARC dialog ──
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // ── Holdings ──
  const [holdings, setHoldings] = useState<HoldingsMap>(() =>
    buildInitialHoldings(bibRecords)
  );

  // ── Derived ──
  const filtered = records.filter(
    (b) =>
      !query ||
      [b.title, b.author, b.isbn, b.callNumber].some((f) =>
        f.toLowerCase().includes(query.toLowerCase())
      )
  );
  const totalCopies = records.reduce((s, b) => s + b.copies, 0);

  // ── Handlers ──

  function openNewRecord() {
    setEditingRecord(null);
    setBibDialogOpen(true);
  }

  function openEditRecord(record: BibRecord) {
    setEditingRecord(record);
    setBibDialogOpen(true);
  }

  function handleSaveRecord(data: BibFormValues, id: string | null) {
    const subjectList = data.subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (id) {
      // Edit existing
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                title: data.title,
                author: data.author,
                publisher: data.publisher,
                year: data.year,
                isbn: data.isbn,
                callNumber: data.callNumber,
                format: data.format,
                subjects: subjectList,
                copies: data.copies,
                available: Math.min(r.available, data.copies),
              }
            : r
        )
      );
      toast.success("Record updated");
    } else {
      // Create new
      const newId = `b-${Date.now()}`;
      const newRecord: BibRecord = {
        id: newId,
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        year: data.year,
        isbn: data.isbn,
        callNumber: data.callNumber,
        format: data.format,
        subjects: subjectList,
        copies: data.copies,
        available: data.copies,
      };
      setRecords((prev) => [...prev, newRecord]);
      // Initialise holdings for the new record
      setHoldings((prev) => ({
        ...prev,
        [newId]: Array.from({ length: data.copies }, (_, i) => ({
          id: `${newId}-item-${i}`,
          barcode: nextBarcode(),
          branch: "Central" as Branch,
          location: subjectList[0] ?? "General",
          itemType: "Book" as ItemTypeName,
          status: "Available" as ItemStatus,
        })),
      }));
      toast.success("Record added to catalog");
    }
  }

  function handleDeleteRecord() {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setHoldings((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
    toast.success("Record deleted");
    setDeleteTarget(null);
  }

  function handleExportMarc() {
    toast.success(`Exporting ${records.length} records as MARC21…`, {
      description: "Download will begin shortly.",
    });
    // Mock Blob download
    const blob = new Blob(
      [records.map((r) => `=LDR  00000nam  2200000   4500\n=245 10$a${r.title}\n=100 1_$a${r.author}\n`).join("\n---\n")],
      { type: "application/octet-stream" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog-export.mrc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleZ3950Search() {
    toast.success("3 records found", {
      description: "Connection to remote Z39.50 target succeeded",
    });
    setZ3950Results(mockZ3950Results);
  }

  function importToEditor(marcText: string) {
    setMarc(marcText);
    setActiveTab("editor");
    toast.success("Record imported to MARC editor");
  }

  return (
    <PageShell
      title="Cataloging"
      description="Bibliographic records, MARC21/UNIMARC editor, and Z39.50/SRU search."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bibliographic records" value={records.length} />
        <StatCard label="Physical copies" value={totalCopies} />
        <StatCard
          label="MARC21"
          value={records.filter((b) => b.format === "MARC21").length}
          accent="accent"
        />
        <StatCard
          label="UNIMARC"
          value={records.filter((b) => b.format === "UNIMARC").length}
          accent="accent"
        />
      </div>

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="records">Catalog</TabsTrigger>
            <TabsTrigger value="editor">MARC editor</TabsTrigger>
            <TabsTrigger value="z3950">Z39.50 / SRU</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="authorities">Authorities</TabsTrigger>
          </TabsList>

          {/* ── Catalog tab ── */}
          <TabsContent value="records" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1 min-w-[200px]"
                placeholder="Search title, author, ISBN, call number…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button onClick={openNewRecord}>
                <Plus className="mr-1.5 h-4 w-4" />
                New record
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Import MARC
              </Button>
              <Button variant="outline" onClick={handleExportMarc}>
                <Download className="mr-1.5 h-4 w-4" />
                Export MARC
              </Button>
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
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer"
                        onClick={() => openEditRecord(b)}
                      >
                        <TableCell>
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.author} · {b.publisher}, {b.year}
                          </div>
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
                        </TableCell>
                        <TableCell className="mono text-xs">{b.isbn}</TableCell>
                        <TableCell className="mono text-xs">
                          {b.callNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{b.format}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              b.available === 0
                                ? "text-destructive font-medium"
                                : "font-medium"
                            }
                          >
                            {b.available}/{b.copies}
                          </span>
                        </TableCell>
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="pr-3"
                        >
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View"
                              asChild
                            >
                              <Link to="/cataloging/$id" params={{ id: b.id }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditRecord(b)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(b)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          No records match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MARC editor tab ── */}
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marc21">MARC21</SelectItem>
                        <SelectItem value="unimarc">UNIMARC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Record type</Label>
                    <Select defaultValue="a">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                  <Textarea
                    value={marc}
                    onChange={(e) => setMarc(e.target.value)}
                    rows={16}
                    className="mono text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Validate</Button>
                  <Button
                    onClick={() => toast.success("Record saved to catalog")}
                  >
                    Save record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Z39.50 tab ── */}
          <TabsContent value="z3950" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Z39.50 / SRU search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label>Target</Label>
                    <Select value={target} onValueChange={setTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {z3950Targets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground mono">
                      {z3950Targets.find((t) => t.id === target)?.host}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Query (ISBN, title, author)</Label>
                    <Input
                      placeholder="e.g. 9780143127741"
                      value={z3950Query}
                      onChange={(e) => setZ3950Query(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleZ3950Search}>
                  Search remote target
                </Button>

                {z3950Results && (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title / Author</TableHead>
                          <TableHead className="mono text-xs">ISBN</TableHead>
                          <TableHead className="mono text-xs">
                            Call No.
                          </TableHead>
                          <TableHead className="w-36" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {z3950Results.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="font-medium text-sm">
                                {r.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {r.author} · {r.publisher}, {r.year}
                              </div>
                            </TableCell>
                            <TableCell className="mono text-xs">
                              {r.isbn}
                            </TableCell>
                            <TableCell className="mono text-xs">
                              {r.callNumber}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => importToEditor(r.marc)}
                              >
                                Import to editor
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Configured targets: {z3950Targets.length}. Use the Admin
                  module to add SRU/Z39.50 servers, attribute sets and
                  authentication.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Holdings tab ── */}
          <TabsContent value="holdings" className="mt-4">
            <HoldingsTab
              records={records}
              holdings={holdings}
              onHoldingsChange={setHoldings}
            />
          </TabsContent>

          {/* ── Authorities tab ── */}
          <TabsContent value="authorities" className="mt-4">
            <AuthoritiesTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Bib record dialog ── */}
      <BibRecordDialog
        open={bibDialogOpen}
        onOpenChange={(v) => {
          setBibDialogOpen(v);
          if (!v) setEditingRecord(null);
        }}
        editing={editingRecord}
        onSave={handleSaveRecord}
      />

      {/* ── Delete AlertDialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record and all its copies?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title}</strong> and all associated
              physical copies will be permanently removed. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteRecord}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Import MARC dialog ── */}
      <ImportMarcDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </PageShell>
  );
}
