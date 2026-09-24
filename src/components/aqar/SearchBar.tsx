import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cities } from "@/data/opportunities";

const sections = [
  { to: "/exit-opportunities", label: "فرص الخروج" },
  { to: "/new-units", label: "الوحدات الجديدة" },
  { to: "/project-opportunities", label: "فرص المشاريع" },
] as const;
type SectionTo = (typeof sections)[number]["to"];

export function SearchBar() {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<SectionTo>("/exit-opportunities");
  const navigate = useNavigate();
  const go = (query: string) => navigate({ to: section, search: { q: query || undefined } });
  return (
    <div>
      <div className="mb-2 inline-flex flex-wrap gap-1 rounded-lg bg-background/90 p-1 shadow-sm">
        {sections.map((s) => (
          <button key={s.to} type="button" onClick={() => setSection(s.to)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${section === s.to ? "bg-primary text-primary-foreground" : "text-primary hover:bg-secondary"}`}>{s.label}</button>
        ))}
      </div>
      <div className="grid overflow-hidden rounded-xl border bg-background p-1 shadow-search md:grid-cols-[1fr_auto]">
        <label className="flex min-w-0 items-center gap-3 px-4">
          <MapPin className="size-5 shrink-0 text-primary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go(q)} className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="بتدور على فرصة فين؟ منطقة، مدينة أو مشروع" aria-label="بتدور على فرصة فين؟" />
        </label>
        <Button size="lg" onClick={() => go(q)} className="h-12 min-w-28 rounded-lg"><Search /> بحث</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {cities.slice(0, 5).map((c) => (
          <button key={c} type="button" onClick={() => { setQ(c); go(c); }} className="rounded-full border border-background/70 bg-background/90 px-4 py-2 text-xs font-bold text-primary shadow-sm hover:bg-background">{c}</button>
        ))}
      </div>
    </div>
  );
}
