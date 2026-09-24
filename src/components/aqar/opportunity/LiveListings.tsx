import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtEGP, track } from "@/lib/public-data";
import { PROJECT_TYPES, label } from "@/components/admin/useOptions";

const UNIT_BADGE: Record<string, string> = { RESERVED: "محجوزة", SOLD: "مباعة" };

export function LiveNewUnits({ q }: { q?: string | undefined }) {
  useEffect(() => { if (q) track("search", "new-unit", q); }, [q]);
  const r = useQuery({
    queryKey: ["live-new-units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("new_units").select("id,title,city,unit_type,area,bedrooms,price,down_payment,currency,image_url,status,developers(name),projects(name)").order("sort_order").limit(60);
      if (error) throw error; return data ?? [];
    },
  });
  const list = (r.data ?? []).filter((u) => !q || `${u.title} ${u.city} ${u.projects?.name ?? ""}`.includes(q));
  if (r.isLoading) return <Loader2 className="mx-auto my-8 animate-spin" />;
  if (r.isError) return <p className="my-6 text-center text-sm text-destructive">تعذر تحميل الوحدات. حاول تاني.</p>;
  if (!list.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
      <h2 className="text-xl font-black text-primary">وحدات معتمدة من المطورين</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((u) => (
          <Link key={u.id} to="/new-units/live/$id" params={{ id: u.id }} className="overflow-hidden rounded-lg border bg-card shadow-card">
            {u.image_url ? <img src={u.image_url} alt={u.title} loading="lazy" className="h-44 w-full object-cover" /> : <div className="h-44 bg-secondary" />}
            <div className="p-4">
              <div className="flex items-center justify-between gap-2"><h3 className="font-extrabold">{u.title}</h3>{UNIT_BADGE[u.status] && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold">{UNIT_BADGE[u.status]}</span>}</div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{[u.projects?.name, u.developers?.name, u.city].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{[u.unit_type, u.area ? `${u.area} م²` : "", u.bedrooms ? `${u.bedrooms} غرف` : ""].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">سعر الوحدة</span><strong className="text-primary">{fmtEGP(u.price, u.currency)}</strong></div>
              {u.down_payment != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">المقدم</span><span className="font-bold">{fmtEGP(u.down_payment, u.currency)}</span></div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function LiveProjectOpps() {
  const r = useQuery({
    queryKey: ["live-project-opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_opportunities").select("id,title,opp_type,location,city,size_sqm,development_status,investment_value,currency,image_url,description").order("sort_order").limit(60);
      if (error) throw error; return data ?? [];
    },
  });
  if (r.isLoading) return <Loader2 className="mx-auto my-8 animate-spin" />;
  if (!r.data?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
      <h2 className="text-xl font-black text-primary">فرص مشاريع تمت مراجعتها</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {r.data.map((o) => (
          <article key={o.id} className="overflow-hidden rounded-lg border bg-card shadow-card">
            {o.image_url && <img src={o.image_url} alt={o.title} loading="lazy" className="h-44 w-full object-cover" />}
            <div className="p-4">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold">{label(PROJECT_TYPES, o.opp_type)}</span>
              <h3 className="mt-2 font-extrabold">{o.title}</h3>
              <p className="text-xs text-muted-foreground">{[o.location, o.city].filter(Boolean).join(" · ")}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {o.size_sqm != null && <div><dt className="text-xs text-muted-foreground">المساحة</dt><dd className="font-bold">{o.size_sqm} م²</dd></div>}
                {o.development_status && <div><dt className="text-xs text-muted-foreground">حالة التطوير</dt><dd className="font-bold">{o.development_status}</dd></div>}
                {o.investment_value != null && <div><dt className="text-xs text-muted-foreground">قيمة الاستثمار المطلوبة</dt><dd className="font-bold">{fmtEGP(o.investment_value, o.currency)}</dd></div>}
              </dl>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{o.description}</p>
              <details className="mt-3"><summary className="cursor-pointer text-sm font-bold text-primary">مهتم بالفرصة</summary><div className="mt-3"><InterestInline id={o.id} /></div></details>
              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">المعلومات مقدمة من صاحب الفرصة وتمت مراجعة مستنداتها. دي مش توصية استثمارية ولا فيه عائد مضمون.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import { InterestPanel } from "./InterestPanel";
function InterestInline({ id }: { id: string }) { return <InterestPanel opportunityId={id} section="project" cta="سجّل اهتمامك" />; }
