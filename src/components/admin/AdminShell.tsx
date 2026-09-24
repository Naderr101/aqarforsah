import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, LayoutDashboard, FileText, Image, Menu, MapPin, Building2, Home, Construction, ClipboardCheck, ListChecks, Users, Settings, ScrollText, Contact, BarChart3, Power, FileLock2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useMyAccess } from "@/components/aqar/StaffGate";

const IDLE_MS = 20 * 60 * 1000;

type Item = { to: string; label: string; icon: typeof Home; need: "admin" | "staff" | "sales" };
const ITEMS: Item[] = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard, need: "staff" },
  { to: "/admin/content", label: "محتوى الموقع", icon: FileText, need: "admin" },
  { to: "/admin/media", label: "الهوية والصور", icon: Image, need: "admin" },
  { to: "/admin/nav", label: "الأقسام والقوائم", icon: Menu, need: "admin" },
  { to: "/admin/cities", label: "المدن والمناطق", icon: MapPin, need: "admin" },
  { to: "/admin/catalog", label: "المطورين والمشاريع", icon: Building2, need: "admin" },
  { to: "/admin/new-units", label: "الوحدات الجديدة", icon: Home, need: "admin" },
  { to: "/admin/project-opportunities", label: "فرص المشاريع", icon: Construction, need: "admin" },
  { to: "/staff/verification", label: "فرص الخروج والمراجعة", icon: ClipboardCheck, need: "staff" },
  { to: "/admin/developer-access", label: "حسابات المطورين", icon: Building2, need: "admin" },
  { to: "/admin/forms", label: "النماذج", icon: ListChecks, need: "admin" },
  { to: "/admin/crm", label: "العملاء المحتملين", icon: Contact, need: "sales" },
  { to: "/admin/analytics", label: "التحليلات والطلب", icon: BarChart3, need: "admin" },
  { to: "/admin/controls", label: "المفاتيح والطوارئ", icon: Power, need: "admin" },
  { to: "/admin/policies", label: "السياسات والخصوصية", icon: FileLock2, need: "admin" },
  { to: "/staff/users", label: "المستخدمين", icon: Users, need: "admin" },
  { to: "/staff/settings", label: "الإعدادات", icon: Settings, need: "admin" },
  { to: "/staff/audit", label: "سجل العمليات", icon: ScrollText, need: "admin" },
];

function useAal() {
  return useQuery({
    queryKey: ["aal"],
    queryFn: async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const f = await supabase.auth.mfa.listFactors();
      return { current: data?.currentLevel ?? "aal1", hasTotp: (f.data?.totp ?? []).some((x) => x.status === "verified") };
    },
  });
}

function MfaGate({ hasTotp, onDone }: { hasTotp: boolean; onDone: () => void }) {
  const [qr, setQr] = useState<{ id: string; svg: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasTotp) return;
    (async () => {
      const old = await supabase.auth.mfa.listFactors();
      for (const f of old.data?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `aqar-${Date.now()}` });
      if (error) setErr("تعذر تجهيز التحقق بخطوتين."); else setQr({ id: data.id, svg: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, [hasTotp]);

  async function verify() {
    setBusy(true); setErr("");
    let factorId = qr?.id;
    if (!factorId) factorId = (await supabase.auth.mfa.listFactors()).data?.totp.find((f) => f.status === "verified")?.id;
    if (!factorId) { setBusy(false); return; }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) setErr("الكود غير صحيح أو انتهت صلاحيته."); else onDone();
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center shadow-card">
      <ShieldCheck className="mx-auto size-10 text-brand-blue" />
      <h1 className="mt-3 text-xl font-black text-primary">التحقق بخطوتين</h1>
      {!hasTotp ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">لوحة التحكم محمية. امسح الكود بتطبيق Google Authenticator أو Microsoft Authenticator، وبعدين اكتب الكود المكون من 6 أرقام.</p>
          {qr ? <><img src={qr.svg} alt="كود التحقق" className="mx-auto mt-4 size-44 rounded bg-background p-2" /><p className="mt-2 break-all font-mono text-[11px] text-muted-foreground" dir="ltr">{qr.secret}</p></> : <Loader2 className="mx-auto mt-6 animate-spin" />}
        </>
      ) : <p className="mt-2 text-sm text-muted-foreground">اكتب الكود من تطبيق التحقق عشان تفتح اللوحة.</p>}
      <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" dir="ltr" className="mt-4 text-center text-lg tracking-widest" />
      {err && <p className="mt-2 text-sm font-bold text-destructive">{err}</p>}
      <Button className="mt-4 w-full" disabled={busy || code.trim().length !== 6} onClick={verify}>{busy ? <Loader2 className="animate-spin" /> : "تأكيد"}</Button>
    </div>
  );
}

export function AdminShell() {
  const access = useMyAccess();
  const aal = useAal();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const roles = access.data?.roles ?? [];
  const isSales = roles.includes("SALES_AGENT");
  const allowed = !!(access.data?.staff || isSales);

  useEffect(() => {
    if (!allowed) return;
    let t: ReturnType<typeof setTimeout>;
    const reset = () => { clearTimeout(t); t = setTimeout(async () => { qc.clear(); await supabase.auth.signOut(); navigate({ to: "/login", search: { redirect: "/admin" }, replace: true }); }, IDLE_MS); };
    const ev = ["mousemove", "keydown", "click", "touchstart"] as const;
    ev.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(t); ev.forEach((e) => window.removeEventListener(e, reset)); };
  }, [allowed, qc, navigate]);

  if (access.isLoading || aal.isLoading) return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin" /></div>;
  if (!allowed) return <div className="py-24 text-center"><p className="font-bold">لوحة التحكم لفريق عقار فرصة بس.</p><Button asChild className="mt-4"><Link to="/">الرئيسية</Link></Button></div>;
  if (aal.data?.current !== "aal2") return <div className="px-4 py-16"><MfaGate hasTotp={!!aal.data?.hasTotp} onDone={() => { qc.invalidateQueries(); }} /></div>;

  const can = (n: Item["need"]) => n === "admin" ? access.data?.admin : n === "staff" ? access.data?.staff : (isSales || access.data?.admin);
  return (
    <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-lg border bg-card p-3 lg:sticky lg:top-24 lg:self-start">
        <p className="px-2 pb-2 text-xs font-black text-muted-foreground">لوحة التحكم</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {ITEMS.filter((i) => can(i.need)).map((i) => (
            <Link key={i.to} to={i.to} activeOptions={{ exact: i.to === "/admin" }} className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-foreground/80 hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>
              <i.icon className="size-4" />{i.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0"><Outlet /></main>
    </div>
  );
}

export function AdminPage({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black text-primary">{title}</h1>{actions}</div>{children}</section>;
}
