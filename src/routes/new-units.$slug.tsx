import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import propertyStrip from "@/assets/property-strip.jpg";
import { newUnits } from "@/data/opportunities";
import { InterestPanel } from "@/components/aqar/opportunity/InterestPanel";
import { DemoNotice } from "@/components/aqar/opportunity/DemoNotice";
import { formatMoney, formatNumber } from "@/lib/exit-finance";

export const Route = createFileRoute("/new-units/$slug")({
  loader: ({ params }) => { const o = newUnits.find((x) => x.slug === params.slug); if (!o) throw notFound(); return o; },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.title} | الوحدات الجديدة | عقار فرصة` : "الوحدة غير موجودة | عقار فرصة" },
    { name: "description", content: loaderData?.description ?? "تفاصيل وحدة جديدة." },
    { property: "og:title", content: loaderData?.title ?? "وحدة جديدة" },
    { property: "og:description", content: loaderData?.description ?? "تفاصيل وحدة جديدة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  notFoundComponent: () => <main className="mx-auto max-w-7xl px-4 py-16 text-center"><h1 className="text-2xl font-black text-primary">الوحدة غير موجودة</h1><Button asChild className="mt-6"><Link to="/new-units">كل الوحدات الجديدة</Link></Button></main>,
  component: Page,
});

function Page() {
  const o = Route.useLoaderData();
  const rows: Array<[string, string]> = [
    ["المشروع", o.project], ["المطور", o.developer], ["نوع الوحدة", o.unitType], ["المساحة", `${formatNumber(o.area)} م²`],
    ...(o.bedrooms !== undefined ? [["غرف النوم", formatNumber(o.bedrooms)] as [string, string]] : []),
    ...(o.bathrooms !== undefined ? [["الحمامات", formatNumber(o.bathrooms)] as [string, string]] : []),
    ["الاستلام", o.delivery ?? "—"], ["الإتاحة", o.availability],
  ];
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-5 text-sm text-muted-foreground"><Link to="/new-units" className="hover:text-primary">الوحدات الجديدة</Link> / {o.project}</div>
      <img src={propertyStrip} width={1920} height={768} alt={o.title} className="h-[260px] w-full rounded-lg object-cover md:h-[400px]" style={{ objectPosition: o.imagePosition }} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0">
          <span className="badge-pink rounded-full px-3 py-1 text-xs font-bold text-primary-foreground">وحدة جديدة</span>
          <h1 className="mt-3 text-2xl font-black text-primary md:text-3xl">{o.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" />{o.location}</p>
          <h2 className="mt-8 text-xl font-black text-primary">خطة السداد</h2>
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border text-center">
            <div className="bg-card p-4"><p className="text-xs text-muted-foreground">المقدم</p><p className="mt-1 font-black">{formatMoney(o.downPayment)}</p></div>
            <div className="bg-card p-4"><p className="text-xs text-muted-foreground">مدة التقسيط</p><p className="mt-1 font-black">{formatNumber(o.installmentYears)} سنوات</p></div>
            <div className="bg-card p-4"><p className="text-xs text-muted-foreground">الاستلام</p><p className="mt-1 font-black">{o.delivery}</p></div>
          </div>
          <h2 className="mt-8 text-xl font-black text-primary">بيانات الوحدة</h2>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
            {rows.map(([k, v]) => <div key={k} className="bg-card p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-bold">{v}</dd></div>)}
          </dl>
          <p className="mt-4 leading-8 text-muted-foreground">{o.description}</p>
          <div className="mt-8"><DemoNotice /></div>
        </article>
        <aside className="h-fit rounded-lg border bg-card p-6 shadow-card lg:sticky lg:top-24">
          <p className="text-sm font-bold text-muted-foreground">سعر الوحدة</p>
          <strong className="mt-1 block text-3xl font-black text-primary">{formatMoney(o.unitPrice)}</strong>
          <div className="my-5 border-t" />
          <InterestPanel opportunityId={o.id} section="new-unit" cta="اطلب تفاصيل الوحدة" />
        </aside>
      </div>
    </main>
  );
}
