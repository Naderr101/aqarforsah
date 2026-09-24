import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { InterestPanel } from "@/components/aqar/opportunity/InterestPanel";
import { fmtEGP, track } from "@/lib/public-data";

export const Route = createFileRoute("/new-units/live/$id")({
  head: () => ({ meta: [
    { title: "تفاصيل وحدة جديدة | عقار فرصة" }, { name: "description", content: "سعر الوحدة والمقدم وخطة السداد مباشرة من المطور." },
    { property: "og:title", content: "تفاصيل وحدة جديدة | عقار فرصة" }, { property: "og:description", content: "وحدة جديدة معتمدة من المطور على عقار فرصة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  useEffect(() => track("view", "new-unit", id), [id]);
  const q = useQuery({
    queryKey: ["live-new-unit", id],
    queryFn: async () => (await supabase.from("new_units").select("*,developers(name),projects(name),phases(name),buildings(name)").eq("id", id).maybeSingle()).data,
  });
  if (q.isLoading) return <Loader2 className="mx-auto my-20 animate-spin" />;
  const o = q.data;
  if (!o) return <main className="mx-auto max-w-7xl px-4 py-16 text-center"><h1 className="text-2xl font-black text-primary">الوحدة غير متاحة</h1><Button asChild className="mt-6"><Link to="/new-units">كل الوحدات الجديدة</Link></Button></main>;
  const rows: Array<[string, string | number | null | undefined]> = [
    ["المطور", o.developers?.name], ["المشروع", o.projects?.name], ["المرحلة", o.phases?.name], ["المبنى", o.buildings?.name], ["كود الوحدة", o.unit_code],
    ["نوع الوحدة", o.unit_type], ["المساحة", o.area ? `${o.area} م²` : null], ["غرف النوم", o.bedrooms], ["الحمامات", o.bathrooms], ["الدور", o.floor],
    ["التشطيب", o.finishing], ["الاستلام", o.delivery], ["الإتاحة", o.availability],
  ];
  const sold = o.status === "SOLD", reserved = o.status === "RESERVED";
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-5 text-sm text-muted-foreground"><Link to="/new-units" className="hover:text-primary">الوحدات الجديدة</Link> / {o.title}</div>
      {o.image_url && <img src={o.image_url} alt={o.title} className="h-[260px] w-full rounded-lg object-cover md:h-[400px]" />}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0">
          <h1 className="text-2xl font-black text-primary md:text-3xl">{o.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" />{o.city}</p>
          <h2 className="mt-8 text-xl font-black text-primary">خطة السداد</h2>
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border text-center">
            <div className="bg-card p-4"><p className="text-xs text-muted-foreground">المقدم</p><p className="mt-1 font-black">{fmtEGP(o.down_payment, o.currency)}</p></div>
            <div className="bg-card p-4"><p className="text-xs text-muted-foreground">مدة التقسيط</p><p className="mt-1 font-black">{o.installment_years ? `${o.installment_years} سنوات` : "—"}</p></div>
            <div className="bg-card p-4"><p className="text-xs text-muted-foreground">الاستلام</p><p className="mt-1 font-black">{o.delivery || "—"}</p></div>
          </div>
          {o.installment_plan && <p className="mt-3 text-sm text-muted-foreground">{o.installment_plan}</p>}
          <h2 className="mt-8 text-xl font-black text-primary">بيانات الوحدة</h2>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
            {rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => <div key={k} className="bg-card p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-bold">{v}</dd></div>)}
          </dl>
          {o.description && <p className="mt-4 whitespace-pre-wrap leading-8 text-muted-foreground">{o.description}</p>}
        </article>
        <aside className="h-fit rounded-lg border bg-card p-6 shadow-card lg:sticky lg:top-24">
          <p className="text-sm font-bold text-muted-foreground">سعر الوحدة</p>
          <strong className="mt-1 block text-3xl font-black text-primary">{fmtEGP(o.price, o.currency)}</strong>
          <div className="my-5 border-t" />
          {sold ? <p className="text-center font-bold">الوحدة دي اتباعت.</p> : <>{reserved && <p className="mb-3 text-center text-sm font-bold">الوحدة محجوزة حالياً — سجّل اهتمامك ولو اتاحت هنكلمك.</p>}<InterestPanel opportunityId={o.id} section="new-unit" cta="اطلب تفاصيل الوحدة" /></>}
        </aside>
      </div>
    </main>
  );
}
