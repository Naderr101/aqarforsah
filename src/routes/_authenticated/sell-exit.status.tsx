import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/aqar/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { confirmExitAmount, getExitDraft, publishExit, submitExitDraft } from "@/lib/exit-drafts.functions";
import { claimedTotals } from "@/lib/exit-request-store";
import { useCatalog } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import { DocumentsManager } from "@/components/aqar/exit-wizard/DocumentsManager";
import { FinancialsView, fmtDb, type Financials } from "@/components/aqar/exit-wizard/FinancialsView";
import { checkStatusLabel, checkTypeLabel, exitStatusLabel, paymentCategoryLabel, paymentVerificationLabel, type CheckStatus, type CheckType, type ExitDraftRecord, type PaymentCategory, type PaymentVerification } from "@/types/exit-request";

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

const order = ["draft", "pending_review", "under_verification", "verified", "published"] as const;

function RequestView({ r }: { r: ExitDraftRecord }) {
  const qc = useQueryClient();
  const catalog = useCatalog().data;
  const d = r.draft; const cur = d.contract.currency;
  const proj = catalog?.projects.find((p) => p.id === d.projectId);
  const dev = catalog?.developers.find((x) => x.id === d.developerId);
  const t = claimedTotals(d);
  const [docs, setDocs] = useState(d.documents);
  const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  const confirm = useServerFn(confirmExitAmount); const publish = useServerFn(publishExit); const resubmit = useServerFn(submitExitDraft);

  const extra = useQuery({
    queryKey: ["exit-case-seller", r.id, r.status],
    queryFn: async () => {
      const [checks, pays, fin, opp] = await Promise.all([
        supabase.from("exit_verification_checks").select("check_type,status,notes,reviewed_at").eq("exit_opportunity_id", r.id).order("check_type"),
        supabase.from("payment_records").select("id,kind,category,amount_claimed,principal_claimed,verification_status,verified_amount,verified_principal,verified_category,verification_notes").eq("exit_opportunity_id", r.id).order("sort_order"),
        supabase.rpc("exit_financials", { _id: r.id }),
        supabase.from("exit_opportunities").select("rejection_reason,exit_amount_confirmed_at,published_at").eq("id", r.id).maybeSingle(),
      ]);
      return { checks: checks.data ?? [], pays: pays.data ?? [], fin: ((fin.data as unknown as Financials[] | null) ?? [])[0] ?? null, opp: opp.data };
    },
  });

  const act = async (k: string, fn: () => Promise<unknown>) => {
    setBusy(k); setErr("");
    try { await fn(); await qc.invalidateQueries({ queryKey: ["exit-draft", r.id] }); await qc.invalidateQueries({ queryKey: ["exit-case-seller", r.id] }); await qc.invalidateQueries({ queryKey: ["my-exit-requests"] }); }
    catch (e) { setErr(e instanceof Error && e.message.length < 100 ? e.message : "تعذر تنفيذ الطلب."); }
    finally { setBusy(""); }
  };
  const idx = order.indexOf(r.status as (typeof order)[number]);
  const confirmedAt = extra.data?.opp?.exit_amount_confirmed_at;
  const allPassed = (extra.data?.checks.length ?? 0) >= 8 && extra.data!.checks.every((c) => c.status === "PASSED");

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-xs text-muted-foreground">رقم الطلب {r.id.slice(0, 8).toUpperCase()}</p><h2 className="text-xl font-black text-primary">{proj?.name ?? "—"}{dev ? ` · ${dev.name}` : ""}</h2></div>
          <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-bold">{exitStatusLabel[r.status]}</span>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-5">
          {order.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 text-xs font-bold ${idx >= i ? "text-primary" : "text-muted-foreground"}`}>
              {idx >= i ? <CheckCircle2 className="size-4 text-brand-green" /> : <Circle className="size-4" />}{exitStatusLabel[s]}
            </li>
          ))}
        </ol>
        {err && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">{err}</p>}
        {r.status === "draft" && <Button asChild className="mt-5"><Link to="/sell-exit/new" search={{ id: r.id }}>كمّل تعبئة الطلب</Link></Button>}
        {r.status === "pending_review" && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">طلبك وصل وهيبدأ فريق عقار فرصة مراجعته.</p>}
        {r.status === "under_verification" && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">فريق المراجعة بيراجع المستندات والمدفوعات دلوقتي.</p>}
        {r.status === "rejected" && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">تم رفض الطلب. السبب: {extra.data?.opp?.rejection_reason || "—"}</p>}
        {r.status === "published" && <p className="mt-4 rounded-md bg-brand-green/10 p-3 text-sm font-bold">الفرصة منشورة دلوقتي في فرص الخروج.</p>}
      </section>

      {r.status === "documents_required" && (
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h3 className="font-extrabold text-primary">مطلوب مستندات إضافية</h3>
          <p className="mt-1 text-sm text-muted-foreground">ارفع المستندات المطلوبة أو استبدل المرفوض، وبعدين ابعت الطلب تاني.</p>
          <div className="mt-4"><DocumentsManager oppId={r.id} docs={docs} onChange={setDocs} mode="replace" /></div>
          <Button className="mt-4" disabled={!!busy} onClick={() => act("resubmit", async () => { const x = await resubmit({ data: { id: r.id } }); if (!x.ok) throw new Error("لسه في مستندات ناقصة (العقد وإيصالات السداد)."); })}>
            {busy === "resubmit" ? <Loader2 className="animate-spin" /> : <Send />} إعادة إرسال للمراجعة
          </Button>
        </section>
      )}

      {extra.data && extra.data.checks.length > 0 && (
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h3 className="font-extrabold text-primary">فحوصات التحقق</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {extra.data.checks.map((c) => (
              <li key={c.check_type} className="rounded-md border p-3 text-sm">
                <div className="flex justify-between gap-2"><span className="font-bold">{checkTypeLabel[c.check_type as CheckType]}</span><span className={`text-xs font-bold ${c.status === "PASSED" ? "text-brand-green" : c.status === "PENDING" ? "text-muted-foreground" : "text-destructive"}`}>{checkStatusLabel[c.status as CheckStatus]}</span></div>
                {c.notes && <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border bg-card shadow-card">
        <h3 className="border-b px-5 py-3 font-extrabold text-primary">المدخل منك مقابل الموثق</h3>
        <div className="grid grid-cols-3 border-b bg-secondary/50 px-5 py-2 text-xs font-bold text-muted-foreground"><span>البند</span><span>حسب البائع (غير موثق)</span><span>بعد التوثيق</span></div>
        <Cmp k="إجمالي المدفوع" a={formatCents(t.total, cur)} b="—" />
        <Cmp k="أصل الثمن المدفوع" a={formatCents(t.principal, cur)} b={extra.data?.fin?.exit_amount != null ? fmtDb(extra.data.fin.verified_principal, cur) : "قيد المراجعة"} />
        <Cmp k="المتبقي للمطور" a={formatCents(t.remaining, cur)} b={extra.data?.fin?.remaining_balance != null ? fmtDb(extra.data.fin.remaining_balance, cur) : "قيد المراجعة"} />
        {extra.data?.pays.some((p) => p.verification_status !== "CLAIMED") && (
          <div className="border-t px-5 py-3">
            <p className="mb-2 text-xs font-bold text-muted-foreground">تفاصيل مراجعة الدفعات</p>
            <ul className="grid gap-1.5 text-xs">
              {extra.data.pays.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 rounded bg-secondary/50 px-3 py-2">
                  <span>{paymentCategoryLabel[(p.verified_category ?? p.category) as PaymentCategory]} · {fmtDb(p.amount_claimed, cur)}</span>
                  <span className="font-bold">{paymentVerificationLabel[p.verification_status as PaymentVerification]}{p.verified_amount != null ? ` · ${fmtDb(p.verified_amount, cur)}` : ""}</span>
                  {p.verification_notes && <span className="w-full text-muted-foreground">{p.verification_notes}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-extrabold text-primary">مبلغ الخروج</h3>
        {(r.status === "verified" || r.status === "published") && extra.data?.fin ? (
          <div className="mt-3 grid gap-4">
            <FinancialsView f={extra.data.fin} />
            <p className="text-xs text-muted-foreground">مبلغ الخروج = أصل الثمن المدفوع بعد التوثيق. تقدر تأكده، لكن مش ممكن تعدّله.</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={!!confirmedAt || !!busy} onClick={() => act("confirm", () => confirm({ data: { id: r.id } }))}>
                {busy === "confirm" && <Loader2 className="animate-spin" />}{confirmedAt ? "تم تأكيد مبلغ الخروج" : "تأكيد مبلغ الخروج"}
              </Button>
              {r.status === "verified" && (
                <Button variant="outline" disabled={!confirmedAt || !allPassed || !!busy} onClick={() => act("publish", () => publish({ data: { id: r.id } }))}>
                  {busy === "publish" && <Loader2 className="animate-spin" />}نشر الفرصة
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-7 text-muted-foreground">لم يتم التوثيق بعد. مبلغ الخروج بيتحسب من أصل الثمن المدفوع بعد توثيقه من فريق عقار فرصة، ومش بيتحدد من البائع.</p>
        )}
      </section>

      <Button variant="ghost" asChild className="justify-self-start"><Link to="/dashboard/exit-requests">كل طلبات الخروج</Link></Button>
    </div>
  );
}

function Cmp({ k, a, b }: { k: string; a: string; b: string }) {
  return <div className="grid grid-cols-3 gap-2 border-b px-5 py-3 text-sm last:border-0"><span className="font-bold">{k}</span><span>{a}</span><span className="text-muted-foreground">{b}</span></div>;
}
