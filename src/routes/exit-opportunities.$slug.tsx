import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Bath, BedDouble, Building2, CalendarClock, FileText, Layers, MapPin, Maximize2, Scale, Share2, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import propertyStrip from "@/assets/property-strip.jpg";
import { exitOpportunities } from "@/data/opportunities";
import { ExitFinancialBreakdown } from "@/components/aqar/opportunity/ExitFinancialBreakdown";
import { VerificationStatusBadge } from "@/components/aqar/opportunity/VerificationStatusBadge";
import { InterestPanel } from "@/components/aqar/opportunity/InterestPanel";
import { ExitOpportunityCard } from "@/components/aqar/opportunity/OpportunityCards";
import { DemoNotice } from "@/components/aqar/opportunity/DemoNotice";
import { computeExitFinancials, formatMoney, formatNumber } from "@/lib/exit-finance";

export const Route = createFileRoute("/exit-opportunities/$slug")({
  loader: ({ params }) => {
    const o = exitOpportunities.find((x) => x.slug === params.slug);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.title} — فرصة خروج | عقار فرصة` : "الفرصة غير موجودة | عقار فرصة" },
    { name: "description", content: loaderData ? `مبلغ الخروج ${formatMoney(loaderData.exitAmount)} والمتبقي للمطور ${formatMoney(loaderData.remainingDeveloperBalance)}.` : "تفاصيل فرصة الخروج." },
    { property: "og:title", content: loaderData?.title ?? "فرصة خروج" },
    { property: "og:description", content: loaderData?.description ?? "تفاصيل فرصة الخروج." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  notFoundComponent: () => <main className="mx-auto max-w-7xl px-4 py-16 text-center"><h1 className="text-2xl font-black text-primary">الفرصة غير موجودة</h1><Button asChild className="mt-6"><Link to="/exit-opportunities">كل فرص الخروج</Link></Button></main>,
  component: Page,
});

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="mt-8"><h2 className="flex items-center gap-2 text-xl font-black text-primary">{icon}{title}</h2><div className="mt-4">{children}</div></section>;
}

function Page() {
  const o = Route.useLoaderData();
  const f = computeExitFinancials(o);
  const overview: Array<[string, string]> = [
    ["المشروع", o.project], ["المطور", o.developer], ["الموقع", o.location], ["نوع الوحدة", o.unitType],
    ["المساحة", `${formatNumber(o.area)} م²`],
    ...(o.bedrooms !== undefined ? [["غرف النوم", formatNumber(o.bedrooms)] as [string, string]] : []),
    ...(o.bathrooms !== undefined ? [["الحمامات", formatNumber(o.bathrooms)] as [string, string]] : []),
    ...(o.floor ? [["الدور", o.floor] as [string, string]] : []),
    ...(o.delivery ? [["الاستلام", o.delivery] as [string, string]] : []),
  ];
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-5 text-sm text-muted-foreground"><Link to="/exit-opportunities" className="hover:text-primary">فرص الخروج</Link> / {o.project}</div>
      {/* A — Gallery */}
      <section className="grid gap-3 overflow-hidden rounded-lg md:grid-cols-[2fr_1fr] md:grid-rows-2">
        <img src={propertyStrip} width={1920} height={768} alt={o.title} className="h-[280px] w-full object-cover md:row-span-2 md:h-[440px]" style={{ objectPosition: o.imagePosition }} />
        <img src={propertyStrip} width={1920} height={768} alt={`واجهة ${o.project}`} className="hidden h-full w-full object-cover md:block" style={{ objectPosition: "33% center" }} />
        <img src={propertyStrip} width={1920} height={768} alt={`موقع ${o.project}`} className="hidden h-full w-full object-cover md:block" style={{ objectPosition: "66% center" }} />
      </section>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <div className="min-w-0">
              <span className="badge-green rounded-full px-3 py-1 text-xs font-bold text-primary-foreground">فرصة خروج</span>
              <h1 className="mt-3 text-2xl font-black text-primary md:text-3xl">{o.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" />{o.location} · {o.developer}</p>
            </div>
            <div className="flex shrink-0 gap-1"><Button variant="outline" size="icon" aria-label="مشاركة"><Share2 /></Button><Button variant="outline" size="icon" aria-label="حفظ"><Heart /></Button></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Maximize2 className="size-4" />{formatNumber(o.area)} م²</span>
            {o.bedrooms !== undefined && <span className="flex items-center gap-1"><BedDouble className="size-4" />{formatNumber(o.bedrooms)} غرف</span>}
            {o.bathrooms !== undefined && <span className="flex items-center gap-1"><Bath className="size-4" />{formatNumber(o.bathrooms)} حمام</span>}
            {o.delivery && <span className="flex items-center gap-1"><CalendarClock className="size-4" />{o.delivery}</span>}
          </div>

          {/* C — Financial breakdown (lead section) */}
          <Section title="التفاصيل المالية" icon={<Scale className="size-5" />}><ExitFinancialBreakdown opportunity={o} /></Section>

          {/* B — Overview */}
          <Section title="بيانات الفرصة" icon={<Building2 className="size-5" />}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
              {overview.map(([k, v]) => <div key={k} className="bg-card p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-bold">{v}</dd></div>)}
            </dl>
            <p className="mt-4 leading-8 text-muted-foreground">{o.description}</p>
          </Section>

          {/* D — Contract */}
          <Section title="بيانات العقد والأقساط" icon={<FileText className="size-5" />}>
            <dl className="divide-y rounded-lg border bg-card px-4">
              <Row k="قيمة العقد الأصلية" v={formatMoney(o.contract.originalContractValue)} />
              <Row k="المبلغ المدفوع للمطور" v={`${formatMoney(o.exitAmount)}${o.verifiedPaidAmount !== undefined ? " (تمت المراجعة)" : " (قيد المراجعة)"}`} />
              <Row k="نظام السداد" v={o.contract.installmentPlan} />
              {o.monthlyInstallment !== undefined && <Row k="القسط الشهري التقريبي" v={formatMoney(o.monthlyInstallment)} />}
              {o.contract.nextInstallment && <Row k="القسط القادم" v={`${formatMoney(o.contract.nextInstallment.amount)} — ${o.contract.nextInstallment.dueDate}`} />}
              <Row k="المتبقي للمطور" v={formatMoney(f.remainingDeveloperBalance)} />
              <Row k="حالة العقد" v={o.contract.contractStatus} />
            </dl>
          </Section>

          {/* E — Verification */}
          <Section title="حالة التحقق" icon={<Layers className="size-5" />}>
            <div className="grid gap-2 rounded-lg border bg-card p-4 sm:grid-cols-2">
              <VItem k="المبلغ المدفوع" s={o.verification.paidAmount} />
              <VItem k="العقد" s={o.verification.contract} />
              <VItem k="بيانات الوحدة" s={o.verification.unitData} />
              <VItem k="حالة التنازل" s={o.verification.transfer} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">بيانات التحقق تظهر حسب حالة كل فرصة، والمستندات تخضع للمراجعة.</p>
          </Section>

          {/* F — Transfer */}
          <Section title="شروط التنازل" icon={<Scale className="size-5" />}>
            <div className="rounded-lg border bg-secondary p-4 text-sm leading-7 text-foreground/85">
              التنازل يخضع لشروط وموافقة المطور. قد يطلب المطور رسوم تنازل أو مستندات إضافية حسب سياسة المشروع. فلوس الوحدة بتتحرك بين الأطراف والمطور خارج المنصة — عقار فرصة بينظم ويوثق ويتابع الخطوات.
            </div>
          </Section>

          <div className="mt-8"><DemoNotice /></div>

          <h2 className="mt-10 text-xl font-black text-primary">فرص خروج أخرى</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">{exitOpportunities.filter((x) => x.id !== o.id).slice(0, 2).map((x) => <ExitOpportunityCard key={x.id} o={x} />)}</div>
        </article>

        {/* G — Interest */}
        <aside className="h-fit rounded-lg border bg-card p-6 shadow-card lg:sticky lg:top-24">
          <p className="text-sm font-bold text-muted-foreground">مبلغ الخروج</p>
          <strong className="mt-1 block text-3xl font-black text-primary">{formatMoney(f.exitAmount)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">+ المتبقي للمطور {formatMoney(f.remainingDeveloperBalance)}</p>
          <div className="my-5 border-t" />
          <p className="mb-3 font-extrabold">سجل اهتمامك بالفرصة</p>
          <InterestPanel opportunityId={o.id} section="exit" />
          <p className="mt-4 text-center text-xs text-muted-foreground">رقم الفرصة: {o.id}</p>
        </aside>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-left font-bold">{v}</dd></div>;
}
function VItem({ k, s }: { k: string; s: Parameters<typeof VerificationStatusBadge>[0]["status"] }) {
  return <div className="flex items-center justify-between gap-2 rounded-md bg-secondary/60 p-3 text-sm"><span className="font-bold">{k}</span><VerificationStatusBadge status={s} /></div>;
}
