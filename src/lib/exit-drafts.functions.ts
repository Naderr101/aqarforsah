import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { MONEY_RE, normalizeMoney } from "./money";
import { firstInvalidStep, steps } from "./exit-validation";
import { paymentCategories, type ExitDraftRecord, type ExitRequestDraft, type ExitStatus } from "@/types/exit-request";

type Db = SupabaseClient<Database>;

// ---------- validation ----------
const money = z.string().max(24).transform(normalizeMoney).refine((v) => v === "" || MONEY_RE.test(v), "مبلغ غير صحيح");
const intStr = z.string().max(8).transform(normalizeMoney).refine((v) => v === "" || /^\d{1,6}$/.test(v), "رقم غير صحيح");
const txt = (n = 500) => z.string().max(n);
const date = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "تاريخ غير صحيح");
const file = z.object({ name: txt(255), size: z.number().int().nonnegative() }).strict();
const yn = z.enum(["yes", "no", "unknown"]);
const uuid = z.string().uuid();

const draftSchema = z.object({
  seller: z.object({ fullName: txt(120), phone: txt(20), email: txt(160), nationalId: txt(14), city: txt(80), preferredContact: z.enum(["phone", "whatsapp", "email"]) }).strict(),
  developerId: txt(80),
  projectId: txt(80),
  unit: z.object({ phaseId: txt(120), buildingId: txt(120), unitNumber: txt(40), unitType: txt(40), area: money, bedrooms: intStr, bathrooms: intStr, floor: txt(20), view: txt(80), finishing: txt(20), furnished: z.enum(["furnished", "semi", "unfurnished", ""]), deliveryDate: txt(10) }).strict(),
  contract: z.object({
    contractNumber: txt(60), contractDate: date, originalValue: money, currency: z.enum(["EGP", "USD"]), installmentAmount: money,
    installmentFrequency: z.enum(["monthly", "quarterly", "semiannual", "annual", ""]), remainingInstallments: intStr, nextInstallmentDate: date,
    maintenanceStatus: z.enum(["paid", "not_due", "partially_paid", "unpaid", "unknown", ""]), transferNotes: txt(2000),
  }).strict(),
  payments: z.object({
    downPayment: z.object({ amount: money, date, principal: money, reference: txt(120) }).strict(),
    installments: z.array(z.object({ id: txt(64), kind: z.enum(["installment", "other_charge"]), category: z.enum(paymentCategories), date, amount: money, principal: money, reference: txt(120) }).strict()).max(300),
    claimedRemainingBalance: money,
  }).strict(),
  documents: z.object({ contract: z.array(file).max(30), schedule: z.array(file).max(30), receipts: z.array(file).max(100), nationalId: z.array(file).max(10), other: z.array(file).max(30), notes: txt(2000) }).strict(),
  transfer: z.object({ eligibility: yn, developerApprovalRequired: yn, terms: txt(2000), transferFee: txt(40), adminFee: txt(40), cancellationTerms: txt(2000), notes: txt(2000) }).strict(),
  updatedAt: txt(40),
}).strict();

/** Exit Amount is platform-only. Reject any attempt to send it, under any key spelling. */
function rejectExitAmount(raw: unknown) {
  if (/"exit[_\s-]?amount[a-z_]*"\s*:/i.test(JSON.stringify(raw ?? null))) throw new Error("لا يمكن إرسال مبلغ الخروج — يُحدَّد بعد التوثيق فقط.");
}

const nn = (v: string) => (v === "" ? null : v);
const s = (v: unknown) => (v == null ? "" : String(v));
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

// ---------- load ----------
async function loadDraft(supabase: Db, userId: string, id: string): Promise<ExitDraftRecord> {
  const { data: e, error } = await supabase
    .from("exit_opportunities")
    .select("id,status,current_step,max_step,developer_id,project_id,unit_id,claimed_remaining_balance::text,transfer,documents,created_at,updated_at,submitted_at")
    .eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!e) throw new Error("NOT_FOUND"); // RLS hides other sellers' rows

  const [profile, unit, contract, payments] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    e.unit_id ? supabase.from("units").select("*,area::text").eq("id", e.unit_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("contracts").select("*,original_value::text,installment_amount::text").eq("exit_opportunity_id", id).maybeSingle(),
    supabase.from("payment_records").select("id,kind,category,paid_on,reference,sort_order,amount_claimed::text,principal_claimed::text").eq("exit_opportunity_id", id).order("sort_order"),
  ]);
  const p = profile.data, u = unit.data as Record<string, unknown> | null, c = contract.data as Record<string, unknown> | null;
  const rows = (payments.data ?? []) as Array<Record<string, unknown>>;
  const down = rows.find((r) => r["kind"] === "down_payment");
  const t = obj(e.transfer), docs = obj(e.documents);
  const list = (k: string) => (Array.isArray(docs[k]) ? (docs[k] as { name: string; size: number }[]) : []);

  const draft: ExitRequestDraft = {
    seller: { fullName: s(p?.full_name), phone: s(p?.phone), email: s(p?.email), nationalId: s(p?.national_id), city: s(p?.city), preferredContact: (p?.preferred_contact as "phone") || "phone" },
    developerId: s(e.developer_id), projectId: s(e.project_id),
    unit: {
      phaseId: s(u?.["phase_id"]), buildingId: s(u?.["building_id"]), unitNumber: s(u?.["unit_number"]), unitType: s(u?.["unit_type"]), area: s(u?.["area"]),
      bedrooms: s(u?.["bedrooms"]), bathrooms: s(u?.["bathrooms"]), floor: s(u?.["floor"]), view: s(u?.["view"]), finishing: s(u?.["finishing"]),
      furnished: s(u?.["furnished"]) as "", deliveryDate: s(u?.["delivery_date"]),
    },
    contract: {
      contractNumber: s(c?.["contract_number"]), contractDate: s(c?.["contract_date"]), originalValue: s(c?.["original_value"]), currency: (s(c?.["currency"]) || "EGP") as "EGP",
      installmentAmount: s(c?.["installment_amount"]), installmentFrequency: s(c?.["installment_frequency"]) as "", remainingInstallments: s(c?.["remaining_installments"]),
      nextInstallmentDate: s(c?.["next_installment_date"]), maintenanceStatus: s(c?.["maintenance_status"]) as "", transferNotes: s(c?.["assignment_notes"]),
    },
    payments: {
      downPayment: { amount: s(down?.["amount_claimed"]), date: s(down?.["paid_on"]), principal: s(down?.["principal_claimed"]), reference: s(down?.["reference"]) },
      installments: rows.filter((r) => r["kind"] !== "down_payment").map((r) => ({
        id: s(r["id"]), kind: r["kind"] as "installment", category: r["category"] as "PRINCIPAL", date: s(r["paid_on"]),
        amount: s(r["amount_claimed"]), principal: s(r["principal_claimed"]), reference: s(r["reference"]),
      })),
      claimedRemainingBalance: s(e.claimed_remaining_balance),
    },
    documents: { contract: list("contract"), schedule: list("schedule"), receipts: list("receipts"), nationalId: list("nationalId"), other: list("other"), notes: s(docs["notes"]) },
    transfer: {
      eligibility: (s(t["eligibility"]) || "unknown") as "unknown", developerApprovalRequired: (s(t["developerApprovalRequired"]) || "unknown") as "unknown",
      terms: s(t["terms"]), transferFee: s(t["transferFee"]), adminFee: s(t["adminFee"]), cancellationTerms: s(t["cancellationTerms"]), notes: s(t["notes"]),
    },
    updatedAt: e.updated_at,
  };
  return { id: e.id, status: e.status as ExitStatus, currentStep: e.current_step, maxStep: e.max_step, createdAt: e.created_at, updatedAt: e.updated_at, submittedAt: e.submitted_at, draft };
}

// ---------- server functions ----------
export const createExitDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = typeof (claims as Record<string, unknown>)["email"] === "string" ? String((claims as Record<string, unknown>)["email"]) : "";
    await supabase.from("profiles").upsert({ id: userId, email }, { onConflict: "id", ignoreDuplicates: true });
    const { data, error } = await supabase.from("exit_opportunities").insert({ seller_id: userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

export const getExitDraft = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => loadDraft(context.supabase, context.userId, data.id));

export const saveExitDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    rejectExitAmount(d);
    return z.object({ id: uuid, currentStep: z.number().int().min(0).max(steps.length - 1), maxStep: z.number().int().min(0).max(steps.length - 1), draft: draftSchema }).strict().parse(d);
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, draft: d } = data;
    const { data: e, error } = await supabase.from("exit_opportunities").select("id,status,unit_id").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!e) throw new Error("NOT_FOUND");
    if (e.status !== "draft") throw new Error("LOCKED");

    const sp = await supabase.from("profiles").upsert({
      id: userId, full_name: d.seller.fullName.trim(), phone: d.seller.phone.replace(/\s/g, ""), email: d.seller.email.trim(),
      national_id: d.seller.nationalId, city: d.seller.city, preferred_contact: d.seller.preferredContact,
    }, { onConflict: "id" });
    if (sp.error) throw new Error(sp.error.message);

    // Enforce Developer → Project → Phase → Building relationships from real rows.
    let developerId = d.developerId || null, projectId = d.projectId || null, phaseId = d.unit.phaseId || null, buildingId = d.unit.buildingId || null;
    if (developerId && !(await supabase.from("developers").select("id").eq("id", developerId).maybeSingle()).data) developerId = null;
    if (projectId) {
      const pr = (await supabase.from("projects").select("developer_id").eq("id", projectId).maybeSingle()).data;
      if (!pr || pr.developer_id !== developerId) projectId = null;
    }
    if (phaseId) {
      const ph = (await supabase.from("phases").select("project_id").eq("id", phaseId).maybeSingle()).data;
      if (!ph || ph.project_id !== projectId) phaseId = null;
    }
    if (buildingId) {
      const b = (await supabase.from("buildings").select("phase_id").eq("id", buildingId).maybeSingle()).data;
      if (!b || b.phase_id !== phaseId) buildingId = null;
    }

    let unitId: string | null = e.unit_id;
    if (projectId) {
      const u = d.unit;
      const unitRow = {
        project_id: projectId, phase_id: phaseId, building_id: buildingId, unit_number: u.unitNumber, unit_type: u.unitType,
        area: nn(u.area) as unknown as number | null, bedrooms: u.bedrooms ? Number(u.bedrooms) : null, bathrooms: u.bathrooms ? Number(u.bathrooms) : null,
        floor: u.floor, view: u.view, finishing: u.finishing, furnished: u.furnished, delivery_date: u.deliveryDate,
      };
      if (unitId) {
        const r = await supabase.from("units").update(unitRow).eq("id", unitId);
        if (r.error) throw new Error(r.error.message);
      } else {
        const r = await supabase.from("units").insert({ ...unitRow, owner_id: userId }).select("id").single();
        if (r.error) throw new Error(r.error.message);
        unitId = r.data.id;
      }
    }

    const up = await supabase.from("exit_opportunities").update({
      developer_id: developerId, project_id: projectId, unit_id: unitId, current_step: data.currentStep, max_step: data.maxStep,
      claimed_remaining_balance: nn(d.payments.claimedRemainingBalance) as unknown as number | null, claimed_remaining_currency: d.contract.currency,
      transfer: d.transfer, documents: d.documents,
    }).eq("id", id).select("updated_at").single();
    if (up.error) throw new Error(up.error.message);

    const c = d.contract;
    const cr = await supabase.from("contracts").upsert({
      exit_opportunity_id: id, owner_id: userId, contract_number: c.contractNumber.trim(), contract_date: nn(c.contractDate),
      original_value: nn(c.originalValue) as unknown as number | null, currency: c.currency, installment_amount: nn(c.installmentAmount) as unknown as number | null,
      installment_frequency: c.installmentFrequency, remaining_installments: c.remainingInstallments ? Number(c.remainingInstallments) : null,
      next_installment_date: nn(c.nextInstallmentDate), maintenance_status: c.maintenanceStatus, assignment_notes: c.transferNotes,
    }, { onConflict: "exit_opportunity_id" });
    if (cr.error) throw new Error(cr.error.message);

    // Replace claimed payment records (all stay CLAIMED — enforced in the database too).
    const del = await supabase.from("payment_records").delete().eq("exit_opportunity_id", id);
    if (del.error) throw new Error(del.error.message);
    type PayInsert = Database["public"]["Tables"]["payment_records"]["Insert"];
    const rows: PayInsert[] = [];
    const dp = d.payments.downPayment;
    if (dp.amount) rows.push({ exit_opportunity_id: id, owner_id: userId, kind: "down_payment", category: "PRINCIPAL", paid_on: nn(dp.date), amount_claimed: dp.amount as unknown as number, principal_claimed: nn(dp.principal) as unknown as number | null, currency: c.currency, reference: dp.reference, sort_order: 0 });
    d.payments.installments.forEach((p, i) => {
      if (!p.amount) return;
      rows.push({ exit_opportunity_id: id, owner_id: userId, kind: p.kind, category: p.category, paid_on: nn(p.date), amount_claimed: p.amount as unknown as number, principal_claimed: nn(p.principal) as unknown as number | null, currency: c.currency, reference: p.reference, sort_order: i + 1 });
    });
    if (rows.length) {
      const ins = await supabase.from("payment_records").insert(rows);
      if (ins.error) throw new Error(ins.error.message);
    }
    return { updatedAt: up.data.updated_at };
  });

export const submitExitDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => { rejectExitAmount(d); return z.object({ id: uuid }).strict().parse(d); })
  .handler(async ({ data, context }) => {
    const rec = await loadDraft(context.supabase, context.userId, data.id);
    if (rec.status !== "draft") throw new Error("LOCKED");
    const bad = firstInvalidStep(rec.draft);
    if (bad >= 0) return { ok: false as const, step: bad };
    const { error } = await context.supabase.from("exit_opportunities").update({ status: "pending_review" }).eq("id", data.id);
    if (error) {
      if (error.message.includes("SUBMIT_INCOMPLETE")) return { ok: false as const, step: 1 };
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const listMyExitRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exit_opportunities")
      .select("id,status,created_at,updated_at,submitted_at,projects(name),developers(name),units(unit_number,unit_type)")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id, status: r.status as ExitStatus, createdAt: r.created_at, updatedAt: r.updated_at, submittedAt: r.submitted_at,
      project: r.projects?.name ?? "", developer: r.developers?.name ?? "",
      unit: [r.units?.unit_type, r.units?.unit_number].filter(Boolean).join(" · "),
    }));
  });
