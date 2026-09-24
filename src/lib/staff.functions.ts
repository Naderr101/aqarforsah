import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MONEY_RE, normalizeMoney } from "./money";

const uuid = z.string().uuid();
const money = z.string().max(24).transform(normalizeMoney).refine((v) => MONEY_RE.test(v), "مبلغ غير صحيح");
type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };

async function requireStaff(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("is_staff", { _user_id: ctx.userId });
  if (!data) throw new Error("FORBIDDEN");
}
async function requireAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("is_admin", { _user_id: ctx.userId });
  if (!data) throw new Error("FORBIDDEN");
}
const friendly = (m: string) => {
  const map: Record<string, string> = {
    CHECKS_INCOMPLETE: "كل الفحوصات الثمانية لازم تكون \"تم التحقق\" الأول.",
    FINANCIALS_INCOMPLETE: "احسب مبلغ الخروج وأدخل المتبقي الموثق للمطور الأول.",
    EXIT_AMOUNT_STALE: "مبلغ الخروج محتاج إعادة حساب بعد آخر تعديل في المدفوعات.",
    REASON_REQUIRED: "اكتب سبب الرفض.",
    STATUS_CHANGE_FORBIDDEN: "الانتقال ده غير مسموح من الحالة الحالية.",
    SELF_REVIEW_FORBIDDEN: "مش ممكن تراجع طلبك الشخصي.",
    VERIFIED_AMOUNT_REQUIRED: "أدخل المبلغ الموثق.",
    CANNOT_REMOVE_OWN_ADMIN: "مش ممكن تشيل صلاحية الإدارة من نفسك.",
    FORBIDDEN: "غير مسموح.",
  };
  const k = Object.keys(map).find((x) => m.includes(x));
  return k ? map[k]! : "تعذر تنفيذ العملية.";
};
const must = (r: { error: { message: string } | null }) => { if (r.error) throw new Error(friendly(r.error.message)); };

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.rpc("ensure_default_roles");
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    const staff = roles.some((r) => ["VERIFICATION_AGENT", "ADMIN", "SUPER_ADMIN"].includes(r));
    const admin = roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));
    return { roles, staff, admin, superAdmin: roles.includes("SUPER_ADMIN") };
  });

export const listVerificationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { data, error } = await context.supabase.from("exit_opportunities")
      .select("id,status,submitted_at,updated_at,seller_id,projects(name),developers(name),units(unit_type,unit_number)")
      .neq("status", "draft").neq("seller_id", context.userId).order("submitted_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ id: r.id, status: r.status, submittedAt: r.submitted_at, updatedAt: r.updated_at, project: r.projects?.name ?? "", developer: r.developers?.name ?? "", unit: [r.units?.unit_type, r.units?.unit_number].filter(Boolean).join(" · ") }));
  });

export const getCase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const sb = context.supabase;
    const { data: e, error } = await sb.from("exit_opportunities")
      .select("id,status,seller_id,submitted_at,updated_at,rejection_reason,staff_notes,transfer,documents,exit_amount::text,exit_amount_currency,verified_remaining_balance::text,claimed_remaining_balance::text,exit_amount_confirmed_at,published_at,projects(name,location),developers(name),units(*)")
      .eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!e) throw new Error("NOT_FOUND");
    const [profile, contract, payments, docs, checks, vals, fin] = await Promise.all([
      sb.from("profiles").select("full_name,phone,email,national_id,city,preferred_contact,account_status").eq("id", e.seller_id).maybeSingle(),
      sb.from("contracts").select("*,original_value::text,installment_amount::text").eq("exit_opportunity_id", data.id).maybeSingle(),
      sb.from("payment_records").select("id,kind,category,paid_on,reference,verification_status,verified_category,verification_notes,verified_at,amount_claimed::text,principal_claimed::text,verified_amount::text,verified_principal::text,currency").eq("exit_opportunity_id", data.id).order("sort_order"),
      sb.from("exit_documents").select("id,kind,file_name,status,version,superseded,review_notes,reviewed_at,created_at").eq("exit_opportunity_id", data.id).order("created_at"),
      sb.from("exit_verification_checks").select("id,check_type,status,notes,reviewer_id,reviewed_at,evidence_document_id").eq("exit_opportunity_id", data.id).order("check_type"),
      sb.from("market_valuations").select("id,value::text,currency,valuation_date,source,method,notes,status,created_at").eq("exit_opportunity_id", data.id).order("created_at", { ascending: false }),
      sb.rpc("exit_financials", { _id: data.id }),
    ]);
    return {
      opp: e, profile: profile.data, contract: contract.data as Record<string, unknown> | null, payments: payments.data ?? [], documents: docs.data ?? [],
      checks: checks.data ?? [], valuations: vals.data ?? [], financials: (fin.data as unknown as Record<string, number | string | null>[] | null)?.[0] ?? null,
    };
  });

export const transitionCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, to: z.enum(["under_verification", "documents_required", "verified", "rejected"]), reason: z.string().max(2000).default(""), notes: z.string().max(4000).optional() }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.from("exit_opportunities").update({
      status: data.to, ...(data.to === "rejected" ? { rejection_reason: data.reason } : {}), ...(data.notes !== undefined ? { staff_notes: data.notes } : {}),
    }).eq("id", data.id));
    return { ok: true };
  });

export const updateCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, status: z.enum(["PENDING", "PASSED", "FAILED", "NEEDS_INFO"]), notes: z.string().max(2000), evidenceDocumentId: uuid.nullable().optional() }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.from("exit_verification_checks").update({ status: data.status, notes: data.notes, ...(data.evidenceDocumentId !== undefined ? { evidence_document_id: data.evidenceDocumentId } : {}) }).eq("id", data.id));
    return { ok: true };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: uuid, status: z.enum(["VERIFIED", "ADJUSTED", "REJECTED", "CLAIMED"]), verifiedAmount: z.string().max(24), verifiedPrincipal: z.string().max(24),
    verifiedCategory: z.enum(["PRINCIPAL", "MAINTENANCE", "TRANSFER_FEE", "ADMIN_FEE", "PENALTY", "INTEREST", "OTHER"]), notes: z.string().max(2000),
  }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const amt = normalizeMoney(data.verifiedAmount), pr = normalizeMoney(data.verifiedPrincipal);
    if ((amt && !MONEY_RE.test(amt)) || (pr && !MONEY_RE.test(pr))) throw new Error("مبلغ غير صحيح");
    must(await context.supabase.from("payment_records").update({
      verification_status: data.status, verified_amount: (amt || null) as unknown as number | null, verified_principal: (pr || null) as unknown as number | null,
      verified_category: data.verifiedCategory, verification_notes: data.notes,
    }).eq("id", data.id));
    return { ok: true };
  });

export const reviewDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, status: z.enum(["PROCESSING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "REPLACEMENT_REQUIRED"]), notes: z.string().max(2000) }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.from("exit_documents").update({ status: data.status, review_notes: data.notes }).eq("id", data.id));
    return { ok: true };
  });

export const setVerifiedRemaining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, amount: money }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.from("exit_opportunities").update({ verified_remaining_balance: data.amount as unknown as number }).eq("id", data.id));
    return { ok: true };
  });

export const recalcExitAmount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.rpc("recalculate_exit_amount", { _id: data.id }));
    return { ok: true };
  });

export const addValuation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: uuid, value: money, currency: z.enum(["EGP", "USD"]), valuationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: z.enum(["DEVELOPER_PRICE", "VERIFIED_COMPARABLES", "PROFESSIONAL_VALUATION", "APPROVED_MARKET_DATA", "ADMIN_REVIEW"]),
    method: z.string().max(500), notes: z.string().max(2000), verify: z.boolean(),
  }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.from("market_valuations").insert({
      exit_opportunity_id: data.id, value: data.value as unknown as number, currency: data.currency, valuation_date: data.valuationDate,
      source: data.source, method: data.method, notes: data.notes, status: data.verify ? "VERIFIED" : "DRAFT",
    }));
    return { ok: true };
  });

export const setValuationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, status: z.enum(["VERIFIED", "SUPERSEDED"]) }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    must(await context.supabase.from("market_valuations").update({ status: data.status }).eq("id", data.id));
    return { ok: true };
  });

// ----- admin: users, roles, account status, audit -----
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const [p, r] = await Promise.all([
      context.supabase.from("profiles").select("id,full_name,email,phone,account_status,created_at").order("created_at", { ascending: false }).limit(500),
      context.supabase.from("user_roles").select("user_id,role"),
    ]);
    if (p.error) throw new Error(p.error.message);
    return (p.data ?? []).map((u) => ({ ...u, roles: (r.data ?? []).filter((x) => x.user_id === u.id).map((x) => x.role as string) }));
  });

export const setRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: uuid, role: z.enum(["BUYER", "SELLER", "DEVELOPER", "SALES_AGENT", "VERIFICATION_AGENT", "ADMIN", "SUPER_ADMIN"]), grant: z.boolean() }).strict().parse(d))
  .handler(async ({ data, context }) => {
    must(await context.supabase.rpc("set_user_role", { _user: data.userId, _role: data.role, _grant: data.grant }));
    return { ok: true };
  });

export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: uuid, status: z.enum(["PENDING", "ACTIVE", "UNDER_REVIEW", "SUSPENDED", "BLOCKED"]) }).strict().parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    must(await context.supabase.from("profiles").update({ account_status: data.status }).eq("id", data.userId));
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
