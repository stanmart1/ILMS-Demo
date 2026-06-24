import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bibRecords } from "@/lib/mock-data";
import { Search, BookOpen, Bookmark } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/opac")({
  head: () => ({ meta: [{ title: "OPAC — Athenaeum Public Catalog" }] }),
  component: OPAC,
});

function OPAC() {
  const [q, setQ] = useState("");
  const [field, setField] = useState("any");

  const matches = bibRecords.filter((b) => {
    if (!q) return true;
    const v = q.toLowerCase();
    if (field === "title") return b.title.toLowerCase().includes(v);
    if (field === "author") return b.author.toLowerCase().includes(v);
    if (field === "subject") return b.subjects.some((s) => s.toLowerCase().includes(v));
    if (field === "isbn") return b.isbn.includes(v);
    return [b.title, b.author, b.isbn, ...b.subjects].some((f) => f.toLowerCase().includes(v));
  });

  return (
    <PageShell title="Public catalog (OPAC)" description="What patrons see when they search the collection.">
      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="py-10">
          <h2 className="font-serif text-3xl font-semibold">Find your next read</h2>
          <p className="mt-1 text-sm text-primary-foreground/70">Search books, journals, audiobooks and digital resources.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="w-full sm:w-44 bg-background/10 border-primary-foreground/20 text-primary-foreground"><SelectValue /></SelectTrigger>
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
              placeholder="Try “sapiens”, “Camus”, or “astronomy”…"
              className="flex-1 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Search className="mr-1.5 h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <h3 className="font-serif text-sm font-semibold">Refine results</h3>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Format</div>
                  {["Book", "Audiobook", "eBook", "DVD"].map((f) => (
                    <label key={f} className="flex items-center gap-2 py-0.5"><input type="checkbox" defaultChecked={f === "Book"} className="accent-accent" /><span>{f}</span></label>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Availability</div>
                  <label className="flex items-center gap-2 py-0.5"><input type="checkbox" className="accent-accent" /><span>Available now</span></label>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Branch</div>
                  {["Central", "Riverside", "North Hill"].map((f) => (
                    <label key={f} className="flex items-center gap-2 py-0.5"><input type="checkbox" defaultChecked className="accent-accent" /><span>{f}</span></label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {matches.length} result{matches.length === 1 ? "" : "s"}{q && <> for <span className="font-medium text-foreground">“{q}”</span></>}
          </div>
          {matches.map((b) => (
            <Card key={b.id} className="transition-all hover:border-accent hover:shadow-md">
              <CardContent className="flex gap-4 py-4">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg font-semibold leading-snug">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">by {b.author} · {b.publisher}, {b.year}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {b.subjects.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="mono text-muted-foreground">ISBN {b.isbn}</span>
                    <span className="mono text-muted-foreground">{b.callNumber}</span>
                    {b.available > 0
                      ? <Badge className="bg-success text-success-foreground">{b.available} available</Badge>
                      : <Badge variant="destructive">Checked out</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant={b.available > 0 ? "default" : "outline"} onClick={() => toast.success(b.available > 0 ? "Reserved for pickup" : "Hold placed — you are next in queue")}>
                    <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                    {b.available > 0 ? "Reserve" : "Place hold"}
                  </Button>
                  <Button size="sm" variant="ghost">Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
