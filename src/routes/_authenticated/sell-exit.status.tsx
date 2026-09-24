import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/aqar/PageHero";
import { getExitDraft } from "@/lib/exit-drafts.functions";
import { claimedTotals } from "@/lib/exit-request-store";
import { useCatalog } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import { exitStatusLabel, type ExitDraftRecord } from "@/types/exit-request";

export const Route = createFileRoute("/_authenticated/sell-exit/status")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  head: () => ({ meta: [
    { title: "حالة طلب الخروج | عقار فرصة" },
    { name: "description", content: "تابع حالة طلب الخروج ومراجعة المدفوعات." },
    { property: "og:title", content: "حالة طلب الخروج | عقار فرصة" },
    { property: "og:description", content: "تابع مراجعة طلب الخروج." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { id } = Route.useSearch();
  const load = useServerFn(getExitDraft);
  const q = useQuery({ queryKey: ["exit-draft", id], queryFn: () => load({ data: { id: id! } }), enabled: !!id, retry: false });
  return (
    <>
      <PageHero title="حالة طلب الخروج" description="بنراجع العقد والمدفوعات، وبعد التوثيق بيتحسب مبلغ الخروج." />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {!id || q.isError ? (
          <div className="rounded-lg border border-dashed py-14 text-center"><p className="font-bold">الطلب مش موجود أو مش تابع لحسابك</p><Button asChild className="mt-4"><Link to="/dashboard/exit-requests">طلبات الخروج</Link></Button></div>
        ) : !q.data ? <div className="py-14 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div> : <RequestView r={q.data} />}
      </main>
    </>
  );
}

function RequestView({ r }: { r: ExitDraftRecord }) {
  const catalog = useCatalog().data;
  const d = r.draft; const cur = d.contract.currency;
  const proj = catalog?.projects.find((p) => p.id === d.projectId);
  const dev = catalog?.developers.find((x) => x.id === d.developerId);
  const t = claimedTotals(d);
  const flow = [
    { label: "مسودة", done: true },
    { label: "تم إرسال الطلب", done: r.status === "pending_review" },
    { label: "قيد المراجعة", done: false },
    { label: "تم التحقق", done: false },
  ];
  return (
    <div className="grid gap-5">
      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-xs text-muted-foreground">رقم الطلب {r.id.slice(0, 8).toUpperCase()}</p><h2 className="text-xl font-black text-primary">{proj?.name ?? "—"}{dev ? ` · ${dev.name}` : ""}</h2></div>
          <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-bold">{exitStatusLabel[r.status]}</span>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-4">
          {flow.map((s) => (
            <li key={s.label} className={`flex items-center gap-2 text-sm font-bold ${s.done ? "text-primary" : "text-muted-foreground"}`}>
              {s.done ? <CheckCircle2 className="size-5 text-brand-green" /> : <Circle className="size-5" />}{s.label}
            </li>
          ))}
        </ol>
        {r.status === "draft" && <Button asChild className="mt-5"><Link to="/sell-exit/new" search={{ id: r.id }}>كمّل تعبئة الطلب</Link></Button>}
        {r.status === "pending_review" && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">طلبك وصل وهيبدأ فريق عقار فرصة مراجعته. مش هتقدر تعدّل البيانات دلوقتي.</p>}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-card">
        <h3 className="border-b px-5 py-3 font-extrabold text-primary">المدخل منك مقابل الموثق</h3>
        <div className="grid grid-cols-3 border-b bg-secondary/50 px-5 py-2 text-xs font-bold text-muted-foreground"><span>البند</span><span>حسب البائع (غير موثق)</span><span>بعد التوثيق</span></div>
        <Cmp k="إجمالي المدفوع" a={formatCents(t.total, cur)} />
        <Cmp k="أصل الثمن المدفوع" a={formatCents(t.principal, cur)} />
        <Cmp k="المتبقي للمطور" a={formatCents(t.remaining, cur)} />
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-extrabold text-primary">مبلغ الخروج</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">لم يتم التوثيق بعد. مبلغ الخروج بيتحسب من أصل الثمن المدفوع بعد توثيقه من فريق عقار فرصة، ومش بيتحدد من البائع.</p>
      </section>

      <section className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card p-5">
        <div><h3 className="font-extrabold text-primary">نشر الفرصة</h3><p className="mt-1 text-xs text-muted-foreground">متاح بعد التوثيق وتأكيد مبلغ الخروج.</p></div>
        <Button disabled><Lock /> نشر الفرصة</Button>
      </section>

      <Button variant="ghost" asChild className="justify-self-start"><Link to="/dashboard/exit-requests">كل طلبات الخروج</Link></Button>
    </div>
  );
}

function Cmp({ k, a }: { k: string; a: string }) {
  return <div className="grid grid-cols-3 gap-2 border-b px-5 py-3 text-sm last:border-0"><span className="font-bold">{k}</span><span>{a}</span><span className="text-muted-foreground">قيد المراجعة</span></div>;
}
