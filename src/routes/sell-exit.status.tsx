import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/aqar/PageHero";
import { claimedTotalPaid, listExitRequests, num } from "@/lib/exit-request-store";
import { findDeveloper, findProject } from "@/data/developers";
import { formatMoney } from "@/lib/exit-finance";
import type { ExitRequestStatus, SubmittedExitRequest } from "@/types/exit-request";

export const Route = createFileRoute("/sell-exit/status")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  head: () => ({ meta: [
    { title: "حالة طلب الخروج | عقار فرصة" },
    { name: "description", content: "تابع مراجعة طلب الخروج ومبلغ الخروج المحتسب بعد التوثيق." },
    { property: "og:title", content: "حالة طلب الخروج | عقار فرصة" },
    { property: "og:description", content: "تابع مراجعة طلب الخروج." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const statusLabel: Record<ExitRequestStatus, string> = {
  submitted: "تم إرسال الطلب", under_review: "قيد المراجعة", needs_documents: "مطلوب مستندات إضافية", verified: "تم التحقق", rejected: "مرفوض",
};
const flow: ExitRequestStatus[] = ["submitted", "under_review", "verified"];

function Page() {
  const { id } = Route.useSearch();
  const [reqs, setReqs] = useState<SubmittedExitRequest[] | null>(null);
  useEffect(() => setReqs(listExitRequests()), []);
  if (!reqs) return null;
  const r = reqs.find((x) => x.id === id) ?? reqs[0];

  return (
    <>
      <PageHero title="حالة طلب الخروج" description="بنراجع العقد والمدفوعات، وبعد التوثيق بنحسب مبلغ الخروج وتقدر تأكده." />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {!r ? (
          <div className="rounded-lg border border-dashed py-14 text-center"><p className="font-bold">مفيش طلبات لسه</p><Button asChild className="mt-4"><Link to="/sell-exit/new">ابدأ طلب الخروج</Link></Button></div>
        ) : <RequestView r={r} others={reqs.filter((x) => x.id !== r.id)} />}
      </main>
    </>
  );
}

function RequestView({ r, others }: { r: SubmittedExitRequest; others: SubmittedExitRequest[] }) {
  const d = r.draft;
  const proj = findProject(d.developerId, d.projectId);
  const idx = flow.indexOf(r.status);
  const v = r.verified;
  const canConfirm = r.status === "verified" && !!v;
  return (
    <div className="grid gap-5">
      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-xs text-muted-foreground">رقم الطلب {r.id}</p><h2 className="text-xl font-black text-primary">{proj?.name ?? "—"} · {findDeveloper(d.developerId)?.name}</h2></div>
          <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-bold">{statusLabel[r.status]}</span>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {flow.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 text-sm font-bold ${i <= idx ? "text-primary" : "text-muted-foreground"}`}>
              {i <= idx ? <CheckCircle2 className="size-5 text-brand-green" /> : <Circle className="size-5" />}{statusLabel[s]}
            </li>
          ))}
        </ol>
        {r.status === "needs_documents" && <p className="mt-4 rounded-md bg-brand-pink/10 p-3 text-sm font-bold text-brand-pink">مطلوب مستندات إضافية — فريقنا هيتواصل معاك بالتفاصيل.</p>}
        {r.status === "rejected" && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">تم رفض الطلب. فريقنا هيتواصل معاك بالسبب.</p>}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-card">
        <h3 className="border-b px-5 py-3 font-extrabold text-primary">المدخل منك مقابل الموثق</h3>
        <div className="grid grid-cols-3 border-b bg-secondary/50 px-5 py-2 text-xs font-bold text-muted-foreground"><span>البند</span><span>حسب البائع</span><span>بعد التوثيق</span></div>
        <Cmp k="إجمالي المدفوع" a={formatMoney(claimedTotalPaid(d))} b={v ? formatMoney(v.eligiblePrincipalPaid) : "قيد المراجعة"} />
        <Cmp k="المتبقي للمطور" a={d.payments.claimedRemainingBalance ? formatMoney(num(d.payments.claimedRemainingBalance)) : "—"} b={v ? formatMoney(v.remainingDeveloperBalance) : "قيد المراجعة"} />
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-extrabold text-primary">مبلغ الخروج المحتسب</h3>
        {canConfirm ? (
          <>
            <p className="mt-2 text-3xl font-black text-primary">{formatMoney(v.exitAmount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">= أصل الثمن المدفوع فعلياً بعد التوثيق. لا يمكن تعديله.</p>
            <Button className="mt-4" disabled={!!r.exitAmountConfirmedAt}>{r.exitAmountConfirmedAt ? "تم التأكيد" : "تأكيد مبلغ الخروج"}</Button>
          </>
        ) : (
          <p className="mt-2 text-sm leading-7 text-muted-foreground">سيتم تحديد مبلغ الخروج بعد مراجعة وتوثيق المدفوعات.</p>
        )}
      </section>

      <section className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card p-5">
        <div><h3 className="font-extrabold text-primary">نشر الفرصة</h3><p className="mt-1 text-xs text-muted-foreground">متاح بعد التوثيق وتأكيد مبلغ الخروج.</p></div>
        <Button disabled={!r.exitAmountConfirmedAt}><Lock /> نشر الفرصة</Button>
      </section>

      {others.length > 0 && (
        <section><h3 className="font-extrabold text-primary">طلبات أخرى</h3><div className="mt-2 grid gap-2">{others.map((o) => <Link key={o.id} to="/sell-exit/status" search={{ id: o.id }} className="flex justify-between rounded-md border bg-card p-3 text-sm hover:bg-secondary"><span>{o.id}</span><span className="text-muted-foreground">{statusLabel[o.status]}</span></Link>)}</div></section>
      )}
    </div>
  );
}

function Cmp({ k, a, b }: { k: string; a: string; b: string }) {
  return <div className="grid grid-cols-3 gap-2 border-b px-5 py-3 text-sm last:border-0"><span className="font-bold">{k}</span><span>{a}</span><span className="text-muted-foreground">{b}</span></div>;
}
