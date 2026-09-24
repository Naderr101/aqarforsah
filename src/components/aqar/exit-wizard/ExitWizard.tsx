import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, CloudOff, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCatalog, type Catalog } from "@/lib/catalog";
import { claimedTotals, useServerDraft, type SaveState } from "@/lib/exit-request-store";
import { submitExitDraft } from "@/lib/exit-drafts.functions";
import { formatCents, formatMoneyStr } from "@/lib/money";
import { documentKindLabel, documentKinds, paymentCategories, paymentCategoryLabel, type ClaimedPayment, type ExitRequestDraft } from "@/types/exit-request";
import { DocumentsManager } from "./DocumentsManager";
import { AreaField, ChoiceField, ClaimedNotice, SelectField, TextField } from "./fields";
import { steps, validateStep, type Errors, type StepId } from "./steps";

type Upd = <K extends keyof ExitRequestDraft>(k: K, v: ExitRequestDraft[K]) => void;
type StepProps = { d: ExitRequestDraft; update: Upd; errors: Errors; catalog: Catalog; oppId: string };

export function ExitWizard({ id }: { id: string }) {
  const { query, record, draft, step: i, maxStep, goStep, update, saveState, flush } = useServerDraft(id);
  const catalogQ = useCatalog();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitFn = useServerFn(submitExitDraft);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (query.isError) return <div className="py-20 text-center"><p className="font-bold">الطلب ده مش موجود أو مش تابع لحسابك.</p><Button asChild className="mt-4"><Link to="/dashboard/exit-requests">طلبات الخروج</Link></Button></div>;
  if (!record || !draft || !catalogQ.data) return <div className="py-20 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />جاري تحميل المسودة…</div>;
  if (record.status !== "draft") return <div className="py-20 text-center"><p className="font-bold">تم إرسال الطلب للمراجعة ولا يمكن تعديله.</p><Button asChild className="mt-4"><Link to="/sell-exit/status" search={{ id }}>متابعة حالة الطلب</Link></Button></div>;

  const catalog = catalogQ.data;
  const step = steps[i]!;
  const go = (to: number) => { setErrors({}); goStep(to); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => {
    const e = validateStep(step.id, draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    go(Math.min(i + 1, steps.length - 1));
  };
  const jumpTo = (sid: StepId) => go(steps.findIndex((s) => s.id === sid));
  const submit = async () => {
    for (const s of steps) { const e = validateStep(s.id, draft); if (Object.keys(e).length) { setErrors(e); goStep(steps.indexOf(s)); return; } }
    setSubmitting(true); setSubmitError("");
    try {
      await flush();
      const r = await submitFn({ data: { id } });
      if (!r.ok) { go(r.step); setSubmitError("في بيانات ناقصة — راجع الخطوة دي."); return; }
      await qc.invalidateQueries({ queryKey: ["exit-draft", id] });
      await qc.invalidateQueries({ queryKey: ["my-exit-requests"] });
      navigate({ to: "/sell-exit/status", search: { id } });
    } catch { setSubmitError("تعذر إرسال الطلب. حاول تاني."); }
    finally { setSubmitting(false); }
  };
  const props: StepProps = { d: draft, update, errors, catalog, oppId: id };

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper current={i} max={maxStep} onJump={go} />
      <section className="mt-6 rounded-lg border bg-card p-5 shadow-card md:p-7">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-muted-foreground">الخطوة {(i + 1).toLocaleString("ar-EG")} من {steps.length.toLocaleString("ar-EG")}</p>
          <SaveBadge state={saveState} />
        </div>
        <h2 className="mt-1 text-2xl font-black text-primary">{titles[step.id]}</h2>
        {submitError && <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">{submitError}</p>}
        <div className="mt-6 grid gap-5">
          {step.id === "account" && <AccountStep />}
          {step.id === "seller" && <SellerStep {...props} />}
          {step.id === "developer" && <DeveloperStep {...props} />}
          {step.id === "project" && <ProjectStep {...props} />}
          {step.id === "unit" && <UnitStep {...props} />}
          {step.id === "contract" && <ContractStep {...props} />}
          {step.id === "payments" && <PaymentsStep {...props} />}
          {step.id === "documents" && <DocumentsStep {...props} />}
          {step.id === "transfer" && <TransferStep {...props} />}
          {step.id === "review" && <ReviewStep d={draft} catalog={catalog} onEdit={jumpTo} />}
        </div>
      </section>
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
        <Button variant="outline" onClick={() => go(i - 1)} disabled={i === 0}><ArrowRight /> السابق</Button>
        <span className="hidden text-[11px] text-muted-foreground sm:block">المسودة بتتحفظ تلقائياً في حسابك</span>
        {step.id === "review"
          ? <Button size="lg" onClick={submit} disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : <Check />} إرسال الطلب للمراجعة</Button>
          : <Button size="lg" onClick={next}>متابعة <ArrowLeft /></Button>}
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "saving") return <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Loader2 className="size-3 animate-spin" /> جاري الحفظ…</span>;
  if (state === "saved") return <span className="flex items-center gap-1 text-[11px] text-brand-green"><Check className="size-3" /> تم الحفظ</span>;
  if (state === "error") return <span className="flex items-center gap-1 text-[11px] font-bold text-destructive"><CloudOff className="size-3" /> تعذر الحفظ — هنحاول تاني</span>;
  return null;
}

const titles: Record<StepId, string> = {
  account: "الحساب", seller: "بيانات البائع", developer: "اختار المطور", project: "اختار المشروع", unit: "بيانات الوحدة",
  contract: "بيانات العقد", payments: "المدفوعات (حسب البائع)", documents: "المستندات", transfer: "بيانات التنازل", review: "راجع طلبك",
};

function Stepper({ current, max, onJump }: { current: number; max: number; onJump: (i: number) => void }) {
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${((current + 1) / steps.length) * 100}%` }} /></div>
      <ol className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {steps.map((s, idx) => {
          const reachable = idx <= max;
          return (
            <li key={s.id}>
              <button type="button" disabled={!reachable} onClick={() => onJump(idx)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${idx === current ? "bg-primary text-primary-foreground" : reachable ? "bg-secondary text-primary" : "text-muted-foreground"}`}>
                <span className="grid size-4 place-items-center rounded-full text-[10px]">{idx < current ? <Check className="size-3" /> : (idx + 1).toLocaleString("ar-EG")}</span>{s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AccountStep() {
  const [email, setEmail] = useState("");
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);
  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border p-4">
        <span className="grid size-10 place-items-center rounded-full bg-secondary text-brand-blue"><UserRound className="size-5" /></span>
        <div><p className="text-xs text-muted-foreground">مسجل الدخول باسم</p><p className="font-bold" dir="ltr">{email || "…"}</p></div>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">الطلب ده مرتبط بحسابك. تقدر تقفل الصفحة وترجع تكمل في أي وقت من "طلبات الخروج" في حسابك.</p>
    </>
  );
}

function SellerStep({ d, update, errors }: StepProps) {
  const s = d.seller; const set = (k: keyof typeof s, v: string) => update("seller", { ...s, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="الاسم بالكامل" value={s.fullName} onChange={(v) => set("fullName", v)} error={errors["fullName"]} />
      <TextField label="رقم الموبايل" type="tel" inputMode="tel" value={s.phone} onChange={(v) => set("phone", v)} error={errors["phone"]} placeholder="01xxxxxxxxx" />
      <TextField label="البريد الإلكتروني" optional type="email" inputMode="email" value={s.email} onChange={(v) => set("email", v)} error={errors["email"]} />
      <TextField label="الرقم القومي" optional inputMode="numeric" value={s.nationalId} onChange={(v) => set("nationalId", v)} error={errors["nationalId"]} />
      <TextField label="المدينة" optional value={s.city} onChange={(v) => set("city", v)} />
      <SelectField label="وسيلة التواصل المفضلة" value={s.preferredContact} onChange={(v) => set("preferredContact", v)} options={[["phone", "مكالمة"], ["whatsapp", "واتساب"], ["email", "بريد إلكتروني"]]} />
      <p className="text-xs text-muted-foreground sm:col-span-2">بياناتك مش بتظهر للمشترين. فريق عقار فرصة هو اللي بيتواصل معاك.</p>
    </div>
  );
}

function SearchList({ items, value, onPick, error, placeholder }: { items: { id: string; name: string; sub?: string }[]; value: string; onPick: (id: string) => void; error?: string | undefined; placeholder: string }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => items.filter((x) => !q || x.name.includes(q) || x.sub?.includes(q)), [items, q]);
  return (
    <div>
      <div className="relative"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pr-9" /></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {shown.map((x) => (
          <button key={x.id} type="button" onClick={() => onPick(x.id)} className={`flex items-center justify-between rounded-md border p-3 text-right ${value === x.id ? "border-primary bg-secondary" : "hover:bg-secondary/60"}`}>
            <span><span className="block font-bold">{x.name}</span>{x.sub && <span className="text-xs text-muted-foreground">{x.sub}</span>}</span>
            {value === x.id && <Check className="size-4 text-primary" />}
          </button>
        ))}
        {!shown.length && <p className="text-sm text-muted-foreground">مفيش نتائج. تقدر تكتب اسم تاني.</p>}
      </div>
      {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
    </div>
  );
}

function DeveloperStep({ d, update, errors, catalog }: StepProps) {
  const items = catalog.developers.map((x) => ({ id: x.id, name: x.name, sub: `${catalog.projects.filter((p) => p.developer_id === x.id).length.toLocaleString("ar-EG")} مشروعات` }));
  return <SearchList placeholder="ابحث باسم المطور" items={items} value={d.developerId} error={errors["developerId"]}
    onPick={(pid) => { if (pid !== d.developerId) { update("projectId", ""); update("unit", { ...d.unit, phaseId: "", buildingId: "" }); } update("developerId", pid); }} />;
}

function ProjectStep({ d, update, errors, catalog }: StepProps) {
  const dev = catalog.developers.find((x) => x.id === d.developerId);
  if (!dev) return <p className="text-sm text-muted-foreground">اختار المطور الأول.</p>;
  const items = catalog.projects.filter((p) => p.developer_id === dev.id).map((p) => ({ id: p.id, name: p.name, sub: p.location }));
  return <><p className="text-sm text-muted-foreground">مشروعات {dev.name}</p><SearchList placeholder="ابحث باسم المشروع" items={items} value={d.projectId} error={errors["projectId"]}
    onPick={(pid) => { if (pid !== d.projectId) update("unit", { ...d.unit, phaseId: "", buildingId: "" }); update("projectId", pid); }} /></>;
}

function UnitStep({ d, update, errors, catalog }: StepProps) {
  const u = d.unit; const set = (k: keyof typeof u, v: string) => update("unit", { ...u, [k]: v });
  const phases = catalog.phases.filter((p) => p.project_id === d.projectId);
  const buildings = catalog.buildings.filter((b) => b.phase_id === u.phaseId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField label="المرحلة" optional value={u.phaseId} onChange={(v) => update("unit", { ...u, phaseId: v, buildingId: "" })} options={[["", phases.length ? "اختار المرحلة" : "لا توجد مراحل"], ...phases.map((p) => [p.id, p.name] as [string, string])]} />
      <SelectField label="المبنى" optional value={u.buildingId} onChange={(v) => set("buildingId", v)} options={[["", u.phaseId ? "اختار المبنى" : "اختار المرحلة الأول"], ...buildings.map((b) => [b.id, b.name] as [string, string])]} />
      <TextField label="رقم الوحدة" optional value={u.unitNumber} onChange={(v) => set("unitNumber", v)} />
      <SelectField label="نوع الوحدة" value={u.unitType} onChange={(v) => set("unitType", v)} error={errors["unitType"]} options={[["", "اختار"], ["شقة", "شقة"], ["دوبلكس", "دوبلكس"], ["فيلا", "فيلا"], ["تاون هاوس", "تاون هاوس"], ["توين هاوس", "توين هاوس"], ["شاليه", "شاليه"], ["مكتب إداري", "مكتب إداري"], ["محل تجاري", "محل تجاري"]]} />
      <TextField label="المساحة (م²)" inputMode="numeric" value={u.area} onChange={(v) => set("area", v)} error={errors["area"]} />
      <TextField label="غرف النوم" optional inputMode="numeric" value={u.bedrooms} onChange={(v) => set("bedrooms", v)} />
      <TextField label="الحمامات" optional inputMode="numeric" value={u.bathrooms} onChange={(v) => set("bathrooms", v)} />
      <TextField label="الدور" optional value={u.floor} onChange={(v) => set("floor", v)} />
      <TextField label="الإطلالة" optional value={u.view} onChange={(v) => set("view", v)} placeholder="حديقة، لاجون، شارع…" />
      <SelectField label="التشطيب" optional value={u.finishing} onChange={(v) => set("finishing", v)} options={[["", "غير محدد"], ["core", "بدون تشطيب"], ["semi", "نصف تشطيب"], ["full", "تشطيب كامل"], ["ac", "تشطيب كامل بالتكييفات"]]} />
      <SelectField label="الفرش" optional value={u.furnished} onChange={(v) => set("furnished", v)} options={[["", "غير محدد"], ["unfurnished", "غير مفروشة"], ["semi", "مفروشة جزئياً"], ["furnished", "مفروشة"]]} />
      <TextField label="موعد الاستلام" optional type="month" value={u.deliveryDate} onChange={(v) => set("deliveryDate", v)} />
    </div>
  );
}

function ContractStep({ d, update, errors }: StepProps) {
  const c = d.contract; const set = (k: keyof typeof c, v: string) => update("contract", { ...c, [k]: v } as typeof c);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="رقم العقد" value={c.contractNumber} onChange={(v) => set("contractNumber", v)} error={errors["contractNumber"]} />
      <TextField label="تاريخ العقد" type="date" value={c.contractDate} onChange={(v) => set("contractDate", v)} error={errors["contractDate"]} />
      <TextField label="قيمة العقد الأصلية" inputMode="numeric" value={c.originalValue} onChange={(v) => set("originalValue", v)} error={errors["originalValue"]} />
      <SelectField label="العملة" value={c.currency} onChange={(v) => set("currency", v)} options={[["EGP", "جنيه مصري"], ["USD", "دولار أمريكي"]]} />
      <TextField label="قيمة القسط" optional inputMode="numeric" value={c.installmentAmount} onChange={(v) => set("installmentAmount", v)} error={errors["installmentAmount"]} />
      <SelectField label="دورية القسط" value={c.installmentFrequency} onChange={(v) => set("installmentFrequency", v)} error={errors["installmentFrequency"]} options={[["", "اختار"], ["monthly", "شهري"], ["quarterly", "ربع سنوي"], ["semiannual", "نصف سنوي"], ["annual", "سنوي"]]} />
      <TextField label="عدد الأقساط المتبقية" optional inputMode="numeric" value={c.remainingInstallments} onChange={(v) => set("remainingInstallments", v)} />
      <TextField label="تاريخ القسط القادم" optional type="date" value={c.nextInstallmentDate} onChange={(v) => set("nextInstallmentDate", v)} />
      <SelectField label="حالة الصيانة" optional value={c.maintenanceStatus} onChange={(v) => set("maintenanceStatus", v)} options={[["", "غير محدد"], ["paid", "مدفوعة"], ["partially_paid", "مدفوعة جزئياً"], ["unpaid", "غير مدفوعة"], ["not_due", "لم تستحق بعد"], ["unknown", "مش عارف"]]} />
      <div className="sm:col-span-2"><AreaField label="ملاحظات عن قابلية التنازل في العقد" optional value={c.transferNotes} onChange={(v) => set("transferNotes", v)} placeholder="مثلاً: بند التنازل رقم… أو شرط سداد نسبة معينة" /></div>
    </div>
  );
}

function PaymentsStep({ d, update, errors }: StepProps) {
  const p = d.payments; const cur = d.contract.currency;
  const setDown = (k: keyof typeof p.downPayment, v: string) => update("payments", { ...p, downPayment: { ...p.downPayment, [k]: v } });
  const setInst = (idx: number, patch: Partial<ClaimedPayment>) => update("payments", { ...p, installments: p.installments.map((x, j) => (j === idx ? { ...x, ...patch } : x)) });
  const add = (kind: ClaimedPayment["kind"]) => update("payments", { ...p, installments: [...p.installments, { id: crypto.randomUUID(), kind, category: kind === "installment" ? "PRINCIPAL" : "MAINTENANCE", date: "", amount: "", principal: "", reference: "" }] });
  const remove = (idx: number) => update("payments", { ...p, installments: p.installments.filter((_, j) => j !== idx) });
  const t = claimedTotals(d);
  return (
    <>
      <ClaimedNotice />
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 font-extrabold text-primary">المقدم</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="المبلغ" inputMode="numeric" value={p.downPayment.amount} onChange={(v) => setDown("amount", v)} error={errors["downAmount"]} />
          <TextField label="التاريخ" optional type="date" value={p.downPayment.date} onChange={(v) => setDown("date", v)} />
          <TextField label="الجزء من أصل الثمن (لو معروف)" optional inputMode="numeric" value={p.downPayment.principal} onChange={(v) => setDown("principal", v)} error={errors["downPrincipal"]} />
          <TextField label="رقم الإيصال / المرجع" optional value={p.downPayment.reference} onChange={(v) => setDown("reference", v)} />
        </div>
      </fieldset>
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 font-extrabold text-primary">الأقساط والمدفوعات الأخرى</legend>
        {!p.installments.length && <p className="text-sm text-muted-foreground">لسه مضفتش دفعات.</p>}
        <div className="grid gap-4">
          {p.installments.map((x, idx) => (
            <div key={x.id} className="rounded-md bg-secondary/60 p-3">
              <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">{x.kind === "installment" ? "قسط" : "مصروف آخر"} {(idx + 1).toLocaleString("ar-EG")}</span><Button variant="ghost" size="icon" onClick={() => remove(idx)} aria-label="حذف الدفعة"><Trash2 /></Button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="المبلغ" inputMode="numeric" value={x.amount} onChange={(v) => setInst(idx, { amount: v })} error={errors[`inst-${idx}`]} />
                <TextField label="التاريخ" optional type="date" value={x.date} onChange={(v) => setInst(idx, { date: v })} />
                <TextField label="الجزء من أصل الثمن (لو معروف)" optional inputMode="numeric" value={x.principal} onChange={(v) => setInst(idx, { principal: v })} error={errors[`instp-${idx}`]} />
                <TextField label="رقم الإيصال / المرجع" optional value={x.reference} onChange={(v) => setInst(idx, { reference: v })} />
                <SelectField label="تصنيف الدفعة" value={x.category} onChange={(v) => setInst(idx, { category: v })} options={paymentCategories.map((c) => [c, paymentCategoryLabel[c]] as [typeof c, string])} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => add("installment")}><Plus /> إضافة قسط</Button>
          <Button variant="ghost" onClick={() => add("other_charge")}><Plus /> مصروف آخر (صيانة، رسوم…)</Button>
        </div>
      </fieldset>
      <TextField label="المتبقي للمطور (حسب علمك)" inputMode="numeric" value={p.claimedRemainingBalance} onChange={(v) => update("payments", { ...p, claimedRemainingBalance: v })} error={errors["remaining"]} />
      <div className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-3">
        <div><p className="text-xs font-bold text-muted-foreground">إجمالي المدفوع (حسب البائع)</p><p className="mt-1 text-lg font-black">{formatCents(t.total, cur)}</p></div>
        <div><p className="text-xs font-bold text-muted-foreground">أصل الثمن المدفوع (حسب البائع)</p><p className="mt-1 text-lg font-black">{formatCents(t.principal, cur)}</p></div>
        <div><p className="text-xs font-bold text-muted-foreground">المتبقي للمطور (حسب البائع)</p><p className="mt-1 text-lg font-black">{formatCents(t.remaining, cur)}</p></div>
        <p className="text-xs leading-5 text-muted-foreground sm:col-span-3">أرقام مقدمة من البائع وغير موثقة. مش كل دفعة بتدخل في مبلغ الخروج — الصيانة والرسوم والغرامات والفوائد مش بتتحسب من أصل الثمن. مبلغ الخروج بيتحدد بعد التوثيق فقط.</p>
      </div>
    </>
  );
}

function DocumentsStep({ d, update, errors, oppId }: StepProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground">المستندات بتتراجع من فريق عقار فرصة ومش بتظهر للمشترين.</p>
      <DocumentsManager oppId={oppId} docs={d.documents} onChange={(v) => update("documents", v)} errors={errors} mode="draft" />
      <AreaField label="ملاحظات للمراجعة" optional value={d.documents.notes} onChange={(v) => update("documents", { ...d.documents, notes: v })} />
    </>
  );
}

function TransferStep({ d, update }: StepProps) {
  const t = d.transfer; const set = (k: keyof typeof t, v: string) => update("transfer", { ...t, [k]: v } as typeof t);
  const yn: Array<["yes" | "no" | "unknown", string]> = [["yes", "نعم"], ["no", "لا"], ["unknown", "مش عارف"]];
  return (
    <>
      <p className="rounded-md bg-secondary p-3 text-sm font-bold">التنازل يخضع لشروط وموافقة المطور.</p>
      <ChoiceField label="هل الوحدة قابلة للتنازل؟" value={t.eligibility} onChange={(v) => set("eligibility", v)} options={yn} />
      <ChoiceField label="هل التنازل محتاج موافقة المطور؟" value={t.developerApprovalRequired} onChange={(v) => set("developerApprovalRequired", v)} options={yn} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="رسوم التنازل" optional hint="سيبها فاضية لو مش معروفة" value={t.transferFee} onChange={(v) => set("transferFee", v)} />
        <TextField label="مصاريف إدارية" optional hint="سيبها فاضية لو مش معروفة" value={t.adminFee} onChange={(v) => set("adminFee", v)} />
      </div>
      <AreaField label="شروط التنازل" optional value={t.terms} onChange={(v) => set("terms", v)} />
      <AreaField label="شروط الإلغاء" optional value={t.cancellationTerms} onChange={(v) => set("cancellationTerms", v)} />
      <AreaField label="ملاحظات إضافية" optional value={t.notes} onChange={(v) => set("notes", v)} />
    </>
  );
}

const label = (v: string, map?: Record<string, string>) => (v ? (map?.[v] ?? v) : "—");
const freq: Record<string, string> = { monthly: "شهري", quarterly: "ربع سنوي", semiannual: "نصف سنوي", annual: "سنوي" };
const ynMap: Record<string, string> = { yes: "نعم", no: "لا", unknown: "غير معروف" };

function ReviewStep({ d, catalog, onEdit }: { d: ExitRequestDraft; catalog: Catalog; onEdit: (id: StepId) => void }) {
  const dev = catalog.developers.find((x) => x.id === d.developerId);
  const proj = catalog.projects.find((x) => x.id === d.projectId);
  const phase = catalog.phases.find((x) => x.id === d.unit.phaseId);
  const bld = catalog.buildings.find((x) => x.id === d.unit.buildingId);
  const cur = d.contract.currency;
  const money = (v: string) => formatMoneyStr(v, cur);
  const t = claimedTotals(d);
  const blocks: Array<[StepId, string, Array<[string, string]>]> = [
    ["seller", "البائع", [["الاسم", label(d.seller.fullName)], ["الموبايل", label(d.seller.phone)], ["البريد", label(d.seller.email)]]],
    ["developer", "المطور", [["المطور", dev?.name ?? "—"]]],
    ["project", "المشروع", [["المشروع", proj ? `${proj.name} — ${proj.location}` : "—"]]],
    ["unit", "الوحدة", [["النوع", label(d.unit.unitType)], ["المساحة", d.unit.area ? `${d.unit.area} م²` : "—"], ["المرحلة / المبنى / الوحدة", [phase?.name, bld?.name, d.unit.unitNumber].filter(Boolean).join(" / ") || "—"], ["الغرف / الحمامات", `${label(d.unit.bedrooms)} / ${label(d.unit.bathrooms)}`], ["الاستلام", label(d.unit.deliveryDate)]]],
    ["contract", "العقد", [["رقم العقد", label(d.contract.contractNumber)], ["تاريخ العقد", label(d.contract.contractDate)], ["قيمة العقد", money(d.contract.originalValue)], ["القسط", `${money(d.contract.installmentAmount)} · ${label(d.contract.installmentFrequency, freq)}`], ["القسط القادم", label(d.contract.nextInstallmentDate)]]],
    ["payments", "المدفوعات (حسب البائع — غير موثقة)", [["المقدم", money(d.payments.downPayment.amount)], ["عدد الدفعات الأخرى", d.payments.installments.length.toLocaleString("ar-EG")], ["إجمالي المدفوع", formatCents(t.total, cur)], ["أصل الثمن المدفوع", formatCents(t.principal, cur)], ["المتبقي للمطور", money(d.payments.claimedRemainingBalance)]]],
    ["documents", "المستندات", documentKinds.map((k) => [documentKindLabel[k], d.documents[k].length ? `${d.documents[k].length.toLocaleString("ar-EG")} ملف` : "—"] as [string, string])],
    ["transfer", "التنازل", [["قابلة للتنازل", ynMap[d.transfer.eligibility]!], ["موافقة المطور", ynMap[d.transfer.developerApprovalRequired]!], ["رسوم التنازل", d.transfer.transferFee || "غير معروفة"]]],
  ];
  return (
    <>
      <ClaimedNotice />
      {blocks.map(([sid, title, rows]) => (
        <div key={sid} className="rounded-lg border">
          <div className="flex items-center justify-between border-b bg-secondary/50 px-4 py-2"><h3 className="font-extrabold text-primary">{title}</h3><Button variant="ghost" size="sm" onClick={() => onEdit(sid)}><Pencil /> تعديل</Button></div>
          <dl className="divide-y px-4">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-left font-bold">{v}</dd></div>)}</dl>
        </div>
      ))}
      <p className="rounded-md bg-secondary p-3 text-sm leading-6">سيتم تحديد مبلغ الخروج بعد مراجعة وتوثيق المدفوعات. بعد الإرسال مش هتقدر تعدّل الطلب، والفرصة مش بتتنشر في المرحلة دي.</p>
    </>
  );
}
