import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHero } from "../PageHero";
import { DemoNotice } from "./DemoNotice";

const sections = [
  { to: "/exit-opportunities", label: "فرص الخروج" },
  { to: "/new-units", label: "الوحدات الجديدة" },
  { to: "/project-opportunities", label: "فرص المشاريع" },
] as const;

export function SectionTabs() {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-background p-1">
      {sections.map((s) => (
        <Link key={s.to} to={s.to} className="rounded-md px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary" activeProps={{ className: "bg-primary !text-primary-foreground" }}>{s.label}</Link>
      ))}
    </div>
  );
}

/** Shared shell; each section passes its own items, filters and card renderer. */
export function OpportunityListing<T extends { id: string; title: string; location: string; city: string }>({
  title, description, items, render, filters, q = "", heroExtra,
}: {
  title: string; description: string; items: T[]; render: (item: T) => ReactNode;
  filters?: ReactNode; q?: string; heroExtra?: ReactNode;
}) {
  const [query, setQuery] = useState(q);
  const shown = useMemo(() => items.filter((p) => !query || `${p.title} ${p.location} ${p.city}`.includes(query)), [items, query]);
  return (
    <>
      <PageHero title={title} description={description}><div className="grid gap-4"><SectionTabs />{heroExtra}</div></PageHero>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <DemoNotice />
        <div className="mt-6 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border bg-card p-5">
            <h2 className="flex items-center gap-2 font-extrabold text-primary"><SlidersHorizontal className="size-5" /> تصفية الفرص</h2>
            <label className="mt-5 block text-sm font-bold">المنطقة أو المشروع</label>
            <Input className="mt-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="مثال: القاهرة الجديدة" />
            {filters}
            <Button variant="outline" className="mt-5 w-full" onClick={() => setQuery("")}>إعادة الضبط</Button>
          </aside>
          <section>
            <p className="border-b pb-4 text-sm text-muted-foreground"><strong className="text-foreground">{shown.length}</strong> فرص متاحة</p>
            {shown.length ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((i) => <div key={i.id} className="contents">{render(i)}</div>)}</div>
            ) : (
              <div className="mt-10 rounded-lg border border-dashed py-16 text-center"><h3 className="font-bold">لا توجد فرص مطابقة</h3><p className="mt-2 text-sm text-muted-foreground">جرّب منطقة أو مشروع مختلف.</p></div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

/** Placeholder range filter — wired to real search later. */
export function RangeFilter({ label }: { label: string }) {
  return (
    <>
      <label className="mt-5 block text-sm font-bold">{label}</label>
      <div className="mt-2 grid grid-cols-2 gap-2"><Input placeholder="من" inputMode="numeric" /><Input placeholder="إلى" inputMode="numeric" /></div>
    </>
  );
}
