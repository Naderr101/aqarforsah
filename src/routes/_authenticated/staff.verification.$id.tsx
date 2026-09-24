import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StaffGate, StaffNav } from "@/components/aqar/StaffGate";
import { FinancialsView, fmtDb, type Financials } from "@/components/aqar/exit-wizard/FinancialsView";
import { getDocumentUrl } from "@/lib/documents.functions";
import { addValuation, getCase, recalcExitAmount, reviewDocument, setValuationStatus, setVerifiedRemaining, transitionCase, updateCheck, verifyPayment } from "@/lib/staff.functions";
import { checkStatusLabel, checkTypeLabel, documentStatusLabel, exitStatusLabel, paymentCategories, paymentCategoryLabel, paymentVerificationLabel, type CheckStatus, type CheckType, type DocumentStatus, type ExitStatus, type PaymentCategory, type PaymentVerification } from "@/types/exit-request";

export const Route = createFileRoute("/_authenticated/staff/verification/$id")({
  head: () => ({ meta: [{ title: "ملف مراجعة | عقار فرصة" }, { name: "description", content: "مراجعة طلب خروج." }, { property: "og:title", content: "ملف مراجعة | عقار فرصة" }, { property: "og:description", content: "لفريق المراجعة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <main className="mx-auto max-w-6xl px-4 py-8"><StaffGate><StaffNav /><Case /></StaffGate></main>,
});

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
const docKindLabel: Record<string, string> = { CONTRACT: "العقد", PAYMENT_SCHEDULE: "جدول السداد", RECEIPT: "إيصال سداد", NATIONAL_ID: "البطاقة", AUTHORIZATION: "توكيل", ASSIGNMENT: "تنازل", OTHER: "أخرى" };
const sourceLabel: Record<string, string> = { DEVELOPER_PRICE: "سعر المطور", VERIFIED_COMPARABLES: "مقارنات موثقة", PROFESSIONAL_VALUATION: "تقييم مهني", APPROVED_MARKET_DATA: "بيانات سوق معتمدة", ADMIN_REVIEW: "مراجعة الإدارة" };

function Case() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fn = useServerFn(getCase);
  const q = useQuery({ queryKey: ["case", id], queryFn: () => fn({ data: { id } }), retry: false });
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const transition = useServerFn(transitionCase); const recalc = useServerFn(recalcExitAmount); const setRem = useServerFn(setVerifiedRemaining);
  const openDoc = useServerFn(getDocumentUrl);
  const [reason, setReason] = useState(""); const [rem, setRemV] = useState("");

  const run = async (k: string, f: () => Promise<unknown>, ok = "تم الحفظ") => {
    setBusy(k); setMsg(null);
    try { await f(); setMsg({ ok: true, t: ok }); await qc.invalidateQueries({ queryKey: ["case", id] }); await qc.invalidateQueries({ queryKey: ["verification-queue"] }); }
    catch (e) { setMsg({ ok: false, t: e instanceof Error ? e.message : "تعذر التنفيذ" }); }
    finally { setBusy(""); }
  };

  if (q.isLoading) return <div className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  if (q.isError || !q.data) return <p className="text-sm text-destructive">الملف غير موجود.</p>;
  const { opp, profile, contract, payments, documents, checks, valuations, financials } = q.data;
  const status = opp.status as ExitStatus;
  const cur = (contract?.["currency"] as string) ?? "EGP";
  const unit = opp.units as Record<string, unknown> | null;
  const editable = ["under_verification", "documents_required", "verified", "published"].includes(status);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link to="/staff/verification" className="text-xs text-brand-blue">← الطابور</Link><h1 className="text-2xl font-black text-primary">{opp.projects?.name} · {opp.developers?.name}</h1></div>
        <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-sm font-bold">{exitStatusLabel[status]}</span>
      </div>
      {msg && <p className={`rounded-md p-3 text-sm font-bold ${msg.ok ? "bg-brand-green/10" : "bg-destructive/10 text-destructive"}`}>{msg.t}</p>}

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <h2 className="font-extrabold text-primary">إجراءات الحالة</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {status === "pending_review" && <Button disabled={!!busy} onClick={() => run("t", () => transition({ data: { id, to: "under_verification", reason: "" } }))}>بدء المراجعة</Button>}
          {status === "documents_required" && <Button variant="outline" disabled={!!busy} onClick={() => run("t", () => transition({ data: { id, to: "under_verification", reason: "" } }))}>رجوع للمراجعة</Button>}
          {status === "under_verification" && <>
            <Button variant="outline" disabled={!!busy} onClick={() => run("t", () => transition({ data: { id, to: "documents_required", reason: "" } }))}>طلب مستندات إضافية</Button>
            <Button disabled={!!busy} onClick={() => run("t", () => transition({ data: { id, to: "verified", reason: "" } }), "تم التحقق من الطلب")}>اعتماد: تم التحقق</Button>
          </>}
          {(status === "verified" || status === "published") && <Button variant="outline" disabled={!!busy} onClick={() => run("t", () => transition({ data: { id, to: "under_verification", reason: "" } }))}>إرجاع للمراجعة</Button>}
        </div>
        {["pending_review", "under_verification", "documents_required"].includes(status) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Input className="max-w-md" placeholder="سبب الرفض (مطلوب للرفض)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button variant="destructive" disabled={!!busy || !reason.trim()} onClick={() => run("t", () => transition({ data: { id, to: "rejected", reason } }))}>رفض الطلب</Button>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4 shadow-card text-sm">
          <h2 className="font-extrabold text-primary">البائع</h2>
          <dl className="mt-2 grid grid-cols-2 gap-1">
            {[["الاسم", profile?.full_name], ["الموبايل", profile?.phone], ["البريد", profile?.email], ["الرقم القومي", profile?.national_id], ["حالة الحساب", profile?.account_status]].map(([k, v]) => <div key={k as string} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-bold">{v || "—"}</dd></div>)}
          </dl>
        </section>
        <section className="rounded-lg border bg-card p-4 shadow-card text-sm">
          <h2 className="font-extrabold text-primary">الوحدة والعقد</h2>
          <dl className="mt-2 grid grid-cols-2 gap-1">
            {[["النوع / المساحة", `${unit?.["unit_type"] ?? "—"} · ${unit?.["area"] ?? "—"} م²`], ["رقم الوحدة", unit?.["unit_number"] as string], ["رقم العقد", contract?.["contract_number"]], ["تاريخ العقد", contract?.["contract_date"]], ["قيمة العقد", fmtDb(contract?.["original_value"] as string, cur)], ["المتبقي حسب البائع", fmtDb(opp.claimed_remaining_balance, cur)], ["ملاحظات التنازل", contract?.["assignment_notes"] as string]].map(([k, v]) => <div key={k as string} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-bold">{(v as string) || "—"}</dd></div>)}
          </dl>
        </section>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <h2 className="font-extrabold text-primary">المستندات</h2>
        <div className="mt-3 grid gap-2">
          {!documents.length && <p className="text-sm text-muted-foreground">لا توجد مستندات.</p>}
          {documents.map((d) => <DocRow key={d.id} d={d} editable={editable} onOpen={() => run("o", async () => { const { url } = await openDoc({ data: { id: d.id } }); window.open(url, "_blank", "noopener"); }, "تم فتح المستند")} onSaved={() => qc.invalidateQueries({ queryKey: ["case", id] })} />)}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <h2 className="font-extrabold text-primary">المدفوعات — المُدّعى مقابل الموثق</h2>
        <div className="mt-3 grid gap-3">
          {payments.map((p) => <PaymentRow key={p.id} p={p} cur={cur} editable={editable} onSaved={() => qc.invalidateQueries({ queryKey: ["case", id] })} />)}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <h2 className="font-extrabold text-primary">فحوصات التحقق</h2>
        {!checks.length ? <p className="mt-2 text-sm text-muted-foreground">الفحوصات بتتعمل تلقائياً أول ما تبدأ المراجعة.</p> : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">{checks.map((c) => <CheckRow key={c.id} c={c} docs={documents} editable={editable} onSaved={() => qc.invalidateQueries({ queryKey: ["case", id] })} />)}</div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <h2 className="font-extrabold text-primary">المبالغ الموثقة ومبلغ الخروج</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm"><span className="mb-1 block font-bold">المتبقي للمطور (موثق)</span><Input value={rem} onChange={(e) => setRemV(e.target.value)} placeholder={opp.verified_remaining_balance ?? "0"} inputMode="numeric" /></label>
          <Button variant="outline" disabled={!editable || !rem || !!busy} onClick={() => run("r", () => setRem({ data: { id, amount: rem } }))}>حفظ المتبقي</Button>
          <Button disabled={!editable || !!busy} onClick={() => run("c", () => recalc({ data: { id } }), "تم حساب مبلغ الخروج من أصل الثمن الموثق")}><Calculator /> احسب مبلغ الخروج</Button>
        </div>
        <div className="mt-4"><FinancialsView f={financials as unknown as Financials} /></div>
        <p className="mt-2 text-xs text-muted-foreground">تأكيد البائع: {opp.exit_amount_confirmed_at ? new Date(opp.exit_amount_confirmed_at).toLocaleString("ar-EG") : "لم يؤكد بعد"}</p>
      </section>

      <Valuations id={id} valuations={valuations} editable={editable} onSaved={() => qc.invalidateQueries({ queryKey: ["case", id] })} />
    </div>
  );
}

function DocRow({ d, editable, onOpen, onSaved }: { d: { id: string; kind: string; file_name: string; status: string; version: number; superseded: boolean; review_notes: string }; editable: boolean; onOpen: () => void; onSaved: () => void }) {
  const save = useServerFn(reviewDocument);
  const [st, setSt] = useState(d.status); const [notes, setNotes] = useState(d.review_notes); const [busy, setBusy] = useState(false);
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm ${d.superseded ? "opacity-50" : ""}`}>
      <span className="min-w-40 font-bold">{docKindLabel[d.kind]} <span className="font-normal text-muted-foreground">{d.file_name} · ن{d.version}{d.superseded ? " (مستبدل)" : ""}</span></span>
      <Button size="sm" variant="ghost" onClick={onOpen}><Eye /> عرض</Button>
      <select className={sel} value={st} disabled={!editable || d.superseded} onChange={(e) => setSt(e.target.value)}>{Object.entries(documentStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <Input className="max-w-xs" value={notes} disabled={!editable || d.superseded} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات" />
      <Button size="sm" disabled={!editable || d.superseded || busy} onClick={async () => { setBusy(true); try { await save({ data: { id: d.id, status: st as Exclude<DocumentStatus, "UPLOADED">, notes } }); onSaved(); } finally { setBusy(false); } }}>حفظ</Button>
    </div>
  );
}

function PaymentRow({ p, cur, editable, onSaved }: { p: Record<string, unknown>; cur: string; editable: boolean; onSaved: () => void }) {
  const save = useServerFn(verifyPayment);
  const [st, setSt] = useState((p["verification_status"] as string) ?? "CLAIMED");
  const [amt, setAmt] = useState((p["verified_amount"] as string) ?? (p["amount_claimed"] as string));
  const [pr, setPr] = useState((p["verified_principal"] as string) ?? ((p["principal_claimed"] as string) ?? ""));
  const [cat, setCat] = useState((p["verified_category"] as string) ?? (p["category"] as string));
  const [notes, setNotes] = useState((p["verification_notes"] as string) ?? "");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="font-bold">{p["kind"] === "down_payment" ? "المقدم" : paymentCategoryLabel[p["category"] as PaymentCategory]} · مُدّعى {fmtDb(p["amount_claimed"] as string, cur)}{p["principal_claimed"] ? ` (أصل ${fmtDb(p["principal_claimed"] as string, cur)})` : ""} · {(p["paid_on"] as string) || "بدون تاريخ"} · مرجع {(p["reference"] as string) || "—"}</p>
      <p className="text-xs text-muted-foreground">الحالة الحالية: {paymentVerificationLabel[p["verification_status"] as PaymentVerification]}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select className={sel} value={st} disabled={!editable} onChange={(e) => setSt(e.target.value)}>{Object.entries(paymentVerificationLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Input className="w-36" value={amt} disabled={!editable} onChange={(e) => setAmt(e.target.value)} placeholder="المبلغ الموثق" inputMode="numeric" />
        <Input className="w-36" value={pr} disabled={!editable} onChange={(e) => setPr(e.target.value)} placeholder="الأصل الموثق" inputMode="numeric" />
        <select className={sel} value={cat} disabled={!editable} onChange={(e) => setCat(e.target.value)}>{paymentCategories.map((c) => <option key={c} value={c}>{paymentCategoryLabel[c]}</option>)}</select>
        <Input className="max-w-xs" value={notes} disabled={!editable} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات المراجع" />
        <Button size="sm" disabled={!editable || busy} onClick={async () => { setBusy(true); setErr(""); try { await save({ data: { id: p["id"] as string, status: st as "VERIFIED", verifiedAmount: st === "REJECTED" || st === "CLAIMED" ? "" : amt, verifiedPrincipal: st === "REJECTED" || st === "CLAIMED" ? "" : pr, verifiedCategory: cat as PaymentCategory, notes } }); onSaved(); } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); } finally { setBusy(false); } }}>حفظ</Button>
      </div>
      {err && <p className="mt-1 text-xs font-bold text-destructive">{err}</p>}
    </div>
  );
}

function CheckRow({ c, docs, editable, onSaved }: { c: { id: string; check_type: string; status: string; notes: string; reviewed_at: string | null; evidence_document_id: string | null }; docs: Array<{ id: string; file_name: string; superseded: boolean }>; editable: boolean; onSaved: () => void }) {
  const save = useServerFn(updateCheck);
  const [st, setSt] = useState(c.status); const [notes, setNotes] = useState(c.notes); const [ev, setEv] = useState(c.evidence_document_id ?? "");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex justify-between"><span className="font-bold">{checkTypeLabel[c.check_type as CheckType]}</span><span className="text-xs text-muted-foreground">{c.reviewed_at ? new Date(c.reviewed_at).toLocaleString("ar-EG") : "لم تُراجع"}</span></div>
      <div className="mt-2 grid gap-2">
        <select className={sel} value={st} disabled={!editable} onChange={(e) => setSt(e.target.value)}>{Object.entries(checkStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className={sel} value={ev} disabled={!editable} onChange={(e) => setEv(e.target.value)}><option value="">بدون مستند داعم</option>{docs.filter((d) => !d.superseded).map((d) => <option key={d.id} value={d.id}>{d.file_name}</option>)}</select>
        <Textarea rows={2} value={notes} disabled={!editable} onChange={(e) => setNotes(e.target.value)} placeholder="السبب / الملاحظات" />
        <Button size="sm" disabled={!editable || busy} onClick={async () => { setBusy(true); setErr(""); try { await save({ data: { id: c.id, status: st as CheckStatus, notes, evidenceDocumentId: ev || null } }); onSaved(); } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); } finally { setBusy(false); } }}>حفظ الفحص</Button>
        {err && <p className="text-xs font-bold text-destructive">{err}</p>}
      </div>
    </div>
  );
}

function Valuations({ id, valuations, editable, onSaved }: { id: string; valuations: Array<Record<string, unknown>>; editable: boolean; onSaved: () => void }) {
  const add = useServerFn(addValuation); const setStatus = useServerFn(setValuationStatus);
  const [v, setV] = useState({ value: "", currency: "EGP" as "EGP" | "USD", valuationDate: new Date().toISOString().slice(0, 10), source: "VERIFIED_COMPARABLES" as const, method: "", notes: "", verify: true });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <section className="rounded-lg border bg-card p-4 shadow-card">
      <h2 className="font-extrabold text-primary">تقييم سعر السوق</h2>
      <ul className="mt-3 grid gap-2 text-sm">
        {!valuations.length && <li className="text-muted-foreground">لا يوجد تقييم بعد.</li>}
        {valuations.map((x) => (
          <li key={x["id"] as string} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
            <span><b>{fmtDb(x["value"] as string, x["currency"] as string)}</b> · {sourceLabel[x["source"] as string]} · {x["valuation_date"] as string}{x["method"] ? ` · ${x["method"]}` : ""}</span>
            <span className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${x["status"] === "VERIFIED" ? "bg-brand-green/15" : "bg-secondary"}`}>{x["status"] === "VERIFIED" ? "معتمد (الحالي)" : x["status"] === "DRAFT" ? "مسودة" : "سابق"}</span>
              {editable && x["status"] === "DRAFT" && <Button size="sm" variant="outline" onClick={async () => { await setStatus({ data: { id: x["id"] as string, status: "VERIFIED" } }); onSaved(); }}>اعتماد</Button>}
            </span>
          </li>
        ))}
      </ul>
      {editable && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Input placeholder="القيمة" inputMode="numeric" value={v.value} onChange={(e) => setV({ ...v, value: e.target.value })} />
          <select className={sel} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value as "EGP" })}><option value="EGP">جنيه</option><option value="USD">دولار</option></select>
          <Input type="date" value={v.valuationDate} onChange={(e) => setV({ ...v, valuationDate: e.target.value })} />
          <select className={sel} value={v.source} onChange={(e) => setV({ ...v, source: e.target.value as "VERIFIED_COMPARABLES" })}>{Object.entries(sourceLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <Input placeholder="طريقة التقييم" value={v.method} onChange={(e) => setV({ ...v, method: e.target.value })} />
          <Input placeholder="ملاحظات" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.verify} onChange={(e) => setV({ ...v, verify: e.target.checked })} /> اعتماد كتقييم حالي</label>
          <Button disabled={busy || !v.value} onClick={async () => { setBusy(true); setErr(""); try { await add({ data: { id, ...v } }); setV({ ...v, value: "", method: "", notes: "" }); onSaved(); } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); } finally { setBusy(false); } }}>إضافة تقييم</Button>
          {err && <p className="text-xs font-bold text-destructive sm:col-span-3">{err}</p>}
        </div>
      )}
    </section>
  );
}
