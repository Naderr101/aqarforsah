import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { StaffGate, StaffNav, useMyAccess } from "@/components/aqar/StaffGate";
import { listUsers, setAccountStatus, setRole } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/staff/users")({
  head: () => ({ meta: [{ title: "المستخدمين والصلاحيات | عقار فرصة" }, { name: "description", content: "إدارة الأدوار وحالات الحسابات." }, { property: "og:title", content: "المستخدمين والصلاحيات | عقار فرصة" }, { property: "og:description", content: "للإدارة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <main className="mx-auto max-w-6xl px-4 py-8"><h1 className="mb-4 text-2xl font-black text-primary">لوحة المراجعة</h1><StaffGate admin><StaffNav /><Users /></StaffGate></main>,
});

const roles = ["BUYER", "SELLER", "DEVELOPER", "SALES_AGENT", "VERIFICATION_AGENT", "ADMIN", "SUPER_ADMIN"] as const;
const roleLabel: Record<string, string> = { BUYER: "مشتري", SELLER: "بائع", DEVELOPER: "مطور", SALES_AGENT: "مبيعات", VERIFICATION_AGENT: "مراجع", ADMIN: "إدارة", SUPER_ADMIN: "إدارة عليا" };
const statuses = { PENDING: "بانتظار التفعيل", ACTIVE: "نشط", UNDER_REVIEW: "قيد المراجعة", SUSPENDED: "موقوف مؤقتاً", BLOCKED: "محظور" } as const;

function Users() {
  const fn = useServerFn(listUsers); const role = useServerFn(setRole); const status = useServerFn(setAccountStatus);
  const q = useQuery({ queryKey: ["staff-users"], queryFn: () => fn() });
  const me = useMyAccess().data;
  const qc = useQueryClient(); const [err, setErr] = useState("");
  const run = async (f: () => Promise<unknown>) => { setErr(""); try { await f(); await qc.invalidateQueries({ queryKey: ["staff-users"] }); } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); } };
  if (q.isLoading) return <div className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  if (q.isError) return <p className="text-sm text-destructive">تعذر التحميل.</p>;
  return (
    <>
      {err && <p className="mb-3 rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">{err}</p>}
      <div className="grid gap-3">
        {q.data!.map((u) => (
          <div key={u.id} className="rounded-lg border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-bold">{u.full_name || "بدون اسم"}</p><p className="text-xs text-muted-foreground" dir="ltr">{u.email} {u.phone}</p></div>
              <select className="h-9 rounded-md border px-2 text-sm" value={u.account_status} onChange={(e) => run(() => status({ data: { userId: u.id, status: e.target.value as keyof typeof statuses } }))}>
                {Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((r) => {
                const has = u.roles.includes(r);
                const locked = (r === "ADMIN" || r === "SUPER_ADMIN") && !me?.superAdmin;
                return <button key={r} type="button" disabled={locked} onClick={() => run(() => role({ data: { userId: u.id, role: r, grant: !has } }))} className={`rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40 ${has ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{roleLabel[r]}</button>;
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
