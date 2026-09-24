import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Contact, Home, Construction } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

async function count(table: "exit_opportunities" | "leads" | "new_units" | "project_opportunities", col?: string, val?: string) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (col && val) q = q.eq(col, val as never);
  return (await q).count ?? 0;
}

function Overview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [pending, review, published, leads, units, projects] = await Promise.all([
        count("exit_opportunities", "status", "pending_review"), count("exit_opportunities", "status", "under_verification"),
        count("exit_opportunities", "status", "published"), count("leads", "status", "NEW"), count("new_units"), count("project_opportunities"),
      ]);
      return { pending, review, published, leads, units, projects };
    },
  });
  const d = q.data;
  const cards = [
    { label: "طلبات خروج جديدة", v: d?.pending, icon: ClipboardCheck, to: "/staff/verification" },
    { label: "قيد المراجعة", v: d?.review, icon: ClipboardCheck, to: "/staff/verification" },
    { label: "فرص خروج منشورة", v: d?.published, icon: ClipboardCheck, to: "/staff/verification" },
    { label: "عملاء محتملين جدد", v: d?.leads, icon: Contact, to: "/admin/crm" },
    { label: "الوحدات الجديدة", v: d?.units, icon: Home, to: "/admin/new-units" },
    { label: "فرص المشاريع", v: d?.projects, icon: Construction, to: "/admin/project-opportunities" },
  ] as const;
  return (
    <AdminPage title="نظرة عامة">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="flex items-center gap-4 rounded-lg border bg-card p-5 hover:shadow-card">
            <span className="grid size-12 place-items-center rounded-full bg-secondary text-brand-blue"><c.icon /></span>
            <div><p className="text-sm text-muted-foreground">{c.label}</p><p className="text-2xl font-black text-primary">{c.v ?? "…"}</p></div>
          </Link>
        ))}
      </div>
    </AdminPage>
  );
}
