import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyAccess } from "@/lib/staff.functions";

export function useMyAccess() {
  const fn = useServerFn(getMyAccess);
  return useQuery({ queryKey: ["my-access"], queryFn: () => fn(), staleTime: 60_000 });
}

/** UI convenience only — every staff server function re-checks roles on the backend. */
export function StaffGate({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const q = useMyAccess();
  if (q.isLoading) return <div className="py-20 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  const ok = admin ? q.data?.admin : q.data?.staff;
  if (!ok) return <div className="py-20 text-center"><p className="font-bold">الصفحة دي لفريق عقار فرصة بس.</p><Button asChild className="mt-4"><Link to="/">الرئيسية</Link></Button></div>;
  return <>{children}</>;
}

export function StaffNav() {
  const q = useMyAccess();
  const cls = "rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary";
  const active = { className: "bg-primary text-primary-foreground hover:bg-primary" };
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      <Link to="/staff/verification" className={cls} activeProps={active} activeOptions={{ exact: true }}>طابور المراجعة</Link>
      {q.data?.admin && <Link to="/staff/users" className={cls} activeProps={active}>المستخدمين والصلاحيات</Link>}
      {q.data?.admin && <Link to="/staff/settings" className={cls} activeProps={active}>الإعدادات</Link>}
      {q.data?.admin && <Link to="/staff/audit" className={cls} activeProps={active}>سجل العمليات</Link>}
    </nav>
  );
}
