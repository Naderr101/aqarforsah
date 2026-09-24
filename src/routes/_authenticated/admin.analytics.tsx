import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: Page });

type T = "profiles" | "exit_opportunities" | "leads" | "new_units" | "project_opportunities" | "analytics_events";
async function c(table: T, f?: (q: any) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (f) q = f(q);
  return (await q).count ?? 0;
}
const top = (xs: string[], n = 8) => Object.entries(xs.filter(Boolean).reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, n);

function Page() {
  const q = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const [users, submitted, published, views, searches, leads, won, units, opps] = await Promise.all([
        c("profiles"), c("exit_opportunities", (x) => x.neq("status", "draft")), c("exit_opportunities", (x) => x.eq("status", "published")),
        c("analytics_events", (x) => x.eq("kind", "view")), c("analytics_events", (x) => x.eq("kind", "search")),
        c("leads"), c("leads", (x) => x.eq("status", "WON")), c("new_units", (x) => x.eq("status", "PUBLISHED")), c("project_opportunities", (x) => x.eq("status", "PUBLISHED")),
      ]);
      const [s, l] = await Promise.all([
        supabase.from("analytics_events").select("ref").eq("kind", "search").order("created_at", { ascending: false }).limit(1000),
        supabase.from("leads").select("section,opportunity_ref,status").order("created_at", { ascending: false }).limit(1000),
      ]);
      return { users, submitted, published, views, searches, leads, won, units, opps, topSearches: top((s.data ?? []).map((r) => r.ref.trim())), leadsBySection: top((l.data ?? []).map((r) => r.section)), topRefs: top((l.data ?? []).map((r) => r.opportunity_ref)) };
    },
  });
  if (q.isLoading) return <Loader2 className="mx-auto animate-spin" />;
  if (q.isError || !q.data) return <p className="text-destructive">تعذر تحميل التحليلات.</p>;
  const d = q.data;
  const funnel: Array<[string, number]> = [["التسجيل", d.users], ["مشاهدة فرص", d.views], ["اهتمام", d.leads], ["تم البيع", d.won]];
  const max = Math.max(1, ...funnel.map((f) => f[1]));
  const SEC: Record<string, string> = { exit: "فرص الخروج", "new-unit": "الوحدات الجديدة", project: "فرص المشاريع" };
  return (
    <AdminPage title="التحليلات والطلب">
      <p className="mb-4 text-xs text-muted-foreground">كل الأرقام من بيانات حقيقية مسجلة. تتبع المشاهدات والبحث بدأ من تاريخ تفعيله.</p>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {([["المستخدمين", d.users], ["طلبات خروج مقدمة", d.submitted], ["فرص خروج منشورة", d.published], ["وحدات جديدة منشورة", d.units], ["فرص مشاريع منشورة", d.opps], ["مشاهدات", d.views], ["عمليات بحث", d.searches], ["اهتمامات", d.leads], ["تم البيع", d.won]] as const).map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-black text-primary">{v}</p></div>
        ))}
      </div>
      <section className="mt-6 rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-black text-primary">المسار</h2>
        {funnel.map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-sm"><span>{k}</span><span className="font-bold">{v}</span></div><div className="h-2 rounded bg-secondary"><div className="h-2 rounded bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div></div>)}
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {([["أكتر عمليات بحث", d.topSearches, (x: string) => x], ["الاهتمام حسب القسم", d.leadsBySection, (x: string) => SEC[x] ?? x], ["أكتر فرص عليها طلب", d.topRefs, (x: string) => x]] as const).map(([t, rows, fmt]) => (
          <section key={t} className="rounded-lg border bg-card p-5"><h2 className="mb-3 font-black text-primary">{t}</h2>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">مفيش بيانات كفاية لسه.</p> : rows.map(([k, v]) => <div key={k} className="flex justify-between border-b py-1.5 text-sm last:border-0"><span className="truncate">{fmt(k)}</span><span className="font-bold">{v}</span></div>)}
          </section>
        ))}
      </div>
    </AdminPage>
  );
}
