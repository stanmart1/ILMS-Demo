import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, BookOpen, X, Library, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import {
  GLOSSARY_TERMS,
  GLOSSARY_CATEGORIES,
  type GlossaryTerm,
  type GlossaryCategoryName,
} from "@/lib/glossary-data";

export const Route = createFileRoute("/glossary")({
  head: () => ({ meta: [{ title: "Library Glossary — Athenaeum" }] }),
  component: GlossaryPage,
});

// ── Category badge colour map ─────────────────────────────────────────────

const CATEGORY_COLOURS: Record<GlossaryCategoryName, string> = {
  "Catalog & Metadata":    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Circulation":           "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Patrons & Access":      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "Serials":               "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "Acquisitions":          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Systems & Technology":  "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
};

function CategoryBadge({ category }: { category: GlossaryCategoryName }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOURS[category]}`}>
      {category}
    </span>
  );
}

// ── Shared filter logic ───────────────────────────────────────────────────

function useFilteredTerms(query: string, activeCategory: GlossaryCategoryName | "All") {
  return useMemo(() => {
    const q = query.toLowerCase().trim();
    return GLOSSARY_TERMS
      .filter((t) => activeCategory === "All" || t.category === activeCategory)
      .filter((t) =>
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.alsoKnownAs?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [query, activeCategory]);
}

// ── GlossaryDialog (exported for use in __root.tsx) ───────────────────────

type GlossaryDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function GlossaryDialog({ open, onOpenChange }: GlossaryDialogProps) {
  const [query, setQuery] = useState("");
  const results = useFilteredTerms(query, "All");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setQuery(""); onOpenChange(v); }}>
      <DialogContent className="w-full max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="font-serif flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Library Glossary
          </DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search terms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No terms match "<span className="font-medium text-foreground">{query}</span>"
            </div>
          ) : (
            results.map((t) => (
              <div key={t.term} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{t.term}</span>
                  <CategoryBadge category={t.category} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{t.definition}</p>
                {t.alsoKnownAs && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">Also known as:</span> {t.alsoKnownAs}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {results.length} of {GLOSSARY_TERMS.length} terms
          </span>
          <Link to="/glossary" onClick={() => onOpenChange(false)}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Full glossary
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Full glossary page ────────────────────────────────────────────────────

function GlossaryContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GlossaryCategoryName | "All">("All");
  const filtered = useFilteredTerms(query, activeCategory);

  // Group alphabetically
  const grouped = useMemo(() => {
    const map: Record<string, GlossaryTerm[]> = {};
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Search + category filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms, definitions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(["All", ...GLOSSARY_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length === GLOSSARY_TERMS.length
          ? `${GLOSSARY_TERMS.length} terms across ${GLOSSARY_CATEGORIES.length} categories`
          : `${filtered.length} term${filtered.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Alphabetical groups */}
      {grouped.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            No terms match "<span className="font-medium text-foreground">{query}</span>"
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setQuery(""); setActiveCategory("All"); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([letter, terms]) => (
            <section key={letter} id={`letter-${letter}`}>
              <div className="sticky top-0 z-10 -mx-1 mb-3 px-1 py-1 backdrop-blur bg-background/80">
                <span className="font-serif text-2xl font-semibold text-primary">{letter}</span>
                <div className="mt-1 h-px bg-border" />
              </div>
              <div className="space-y-4">
                {terms.map((t) => (
                  <article
                    key={t.term}
                    id={t.term.replace(/\s+/g, "-").toLowerCase()}
                    className="rounded-lg border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h2 className="font-serif text-lg font-semibold">{t.term}</h2>
                      <CategoryBadge category={t.category} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.definition}</p>
                    {t.alsoKnownAs && (
                      <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                        <span className="font-medium text-foreground">Also known as:</span>{" "}
                        {t.alsoKnownAs}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GlossaryPage() {
  const { user } = useAuth();

  // Logged-in staff: render inside the existing sidebar layout via PageShell
  if (user) {
    return (
      <PageShell
        title="Library Glossary"
        description="Plain-English definitions of common library terms across all modules."
      >
        <GlossaryContent />
      </PageShell>
    );
  }

  // Public (not logged in): standalone layout with minimal header
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Library className="h-4 w-4" />
            </div>
            <span className="font-serif font-semibold">Athenaeum</span>
            <span className="hidden text-muted-foreground sm:inline">— Library Glossary</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/opac">
              <Button variant="ghost" size="sm">Search catalog</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Staff login</Button>
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Library Glossary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plain-English definitions of common library terms across all modules.
          </p>
        </div>
        <GlossaryContent />
      </div>
    </div>
  );
}
