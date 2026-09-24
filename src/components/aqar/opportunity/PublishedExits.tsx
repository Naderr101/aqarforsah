import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDb, type Financials } from "@/components/aqar/exit-wizard/FinancialsView";

/** Real, verified & published exit opportunities (no seller data exposed). */
export function PublishedExits() {
  const q = useQuery({
    queryKey: ["published-exits"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_exit_listings");
      if (error) throw error;
      const rows = data ?? [];
      const fins = await Promise.all(rows.map((r) => supabase.rpc("exit_financials", { _id: r.id })));
      return rows.map((r, i) => ({ ...r, fin: ((fins[i]!.data as unknown as Financials[] | null) ?? [])[0] ?? null }));
    },
  });
  if (!q.data?.length) return null;
  return (
    <section className="mt-4 w-full">
      <h2 className="text-lg font-black text-primary">فرص خروج تمت مراجعتها</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.map((o) => (
          <article key={o.id} className="rounded-lg border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{o.developer} · {o.location}</p>
            <h3 className="font-extrabold">{o.project}</h3>
            <p className="text-xs text-muted-foreground">{o.unit_type}{o.area ? ` · ${o.area} م²` : ""}{o.bedrooms ? ` · ${o.bedrooms} غرف` : ""}</p>
            <dl className="mt-3 grid gap-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">مبلغ الخروج</dt><dd className="font-black text-primary">{fmtDb(o.fin?.exit_amount, o.fin?.currency ?? "EGP")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">المتبقي للمطور</dt><dd className="font-bold">{fmtDb(o.fin?.remaining_balance, o.fin?.currency ?? "EGP")}</dd></div>
              <div className="flex justify-between rounded bg-brand-green/10 px-2 py-1"><dt>التوفير التقديري</dt><dd className="font-bold">{o.fin?.estimated_saving != null ? fmtDb(o.fin.estimated_saving, o.fin.currency) : "لسه بنراجع بيانات سعر السوق"}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
