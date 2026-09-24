import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFlags } from "@/lib/public-data";

const OPEN = ["/admin", "/staff", "/login", "/reset-password", "/forgot-password"];

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const flags = useFlags();
  const on = !!flags.data?.["maintenance_mode"];
  const staff = useQuery({
    queryKey: ["maint-staff"], enabled: on,
    queryFn: async () => { const { data } = await supabase.auth.getUser(); if (!data.user) return false; return !!(await supabase.rpc("is_staff", { _user_id: data.user.id })).data; },
  });
  if (!on || OPEN.some((p) => path.startsWith(p)) || staff.data) return <>{children}</>;
  return <main className="grid min-h-[60vh] place-items-center px-4 text-center"><div><Wrench className="mx-auto size-10 text-brand-blue" /><h1 className="mt-4 text-2xl font-black text-primary">الموقع تحت الصيانة</h1><p className="mt-2 text-muted-foreground">بنعمل تحديثات وهنرجع قريب.</p></div></main>;
}
