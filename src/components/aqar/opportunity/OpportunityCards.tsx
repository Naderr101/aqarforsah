import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bath, BedDouble, Building2, CalendarClock, Heart, Layers, MapPin, Maximize2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import propertyStrip from "@/assets/property-strip.jpg";
import { formatMoney, formatNumber } from "@/lib/exit-finance";
import type { ExitOpportunity, NewUnitOpportunity, ProjectOpportunity } from "@/types/opportunity";
import { ExitFinancialBreakdown } from "./ExitFinancialBreakdown";
import { VerificationStatusBadge } from "./VerificationStatusBadge";

function CardImage({ alt, position, tag, tone }: { alt: string; position: string; tag: string; tone: string }) {
  return (
    <div className="relative h-40 overflow-hidden">
      <img src={propertyStrip} alt={alt} loading="lazy" width={1920} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: position }} />
      <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-primary-foreground ${tone}`}>{tag}</span>
      <Button variant="ghost" size="icon" aria-label="حفظ الفرصة" className="absolute left-2 top-2 bg-background/85 text-primary hover:bg-background"><Heart /></Button>
    </div>
  );
}

function Specs({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">{children}</div>;
}

export function ExitOpportunityCard({ o }: { o: ExitOpportunity }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <CardImage alt={o.title} position={o.imagePosition} tag="فرصة خروج" tone="badge-green" />
      <div className="flex flex-1 flex-col p-4">
        <Link to="/exit-opportunities/$slug" params={{ slug: o.slug }} className="truncate text-base font-extrabold text-primary hover:text-brand-blue">{o.project}</Link>
        <p className="mt-0.5 text-xs text-muted-foreground">{o.developer} · {o.unitType}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{o.location}</p>
        <Specs>
          <span className="flex items-center gap-1"><Maximize2 className="size-3.5" />{formatNumber(o.area)} م²</span>
          {o.bedrooms !== undefined && <span className="flex items-center gap-1"><BedDouble className="size-3.5" />{formatNumber(o.bedrooms)} غرف</span>}
          {o.delivery && <span className="flex items-center gap-1"><CalendarClock className="size-3.5" />{o.delivery}</span>}
        </Specs>
        <div className="mt-3"><ExitFinancialBreakdown opportunity={o} variant="compact" /></div>
        <div className="mt-3"><VerificationStatusBadge status={o.verification.paidAmount} label="المبلغ المدفوع" /></div>
        <Button asChild className="mt-4 w-full"><Link to="/exit-opportunities/$slug" params={{ slug: o.slug }}>شوف الفرصة <ArrowLeft /></Link></Button>
      </div>
    </article>
  );
}

export function NewUnitCard({ o }: { o: NewUnitOpportunity }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <CardImage alt={o.title} position={o.imagePosition} tag="وحدة جديدة" tone="badge-pink" />
      <div className="flex flex-1 flex-col p-4">
        <Link to="/new-units/$slug" params={{ slug: o.slug }} className="truncate text-base font-extrabold text-primary hover:text-brand-blue">{o.project}</Link>
        <p className="mt-0.5 text-xs text-muted-foreground">{o.developer} · {o.unitType}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{o.location}</p>
        <Specs>
          <span className="flex items-center gap-1"><Maximize2 className="size-3.5" />{formatNumber(o.area)} م²</span>
          {o.bedrooms !== undefined && <span className="flex items-center gap-1"><BedDouble className="size-3.5" />{formatNumber(o.bedrooms)}</span>}
          {o.bathrooms !== undefined && <span className="flex items-center gap-1"><Bath className="size-3.5" />{formatNumber(o.bathrooms)}</span>}
        </Specs>
        <div className="mt-3 rounded-md bg-secondary p-3">
          <small className="text-[11px] font-bold text-muted-foreground">سعر الوحدة</small>
          <p className="text-lg font-black text-primary">{formatMoney(o.unitPrice)}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-2 text-[11px] text-muted-foreground">
            <span>مقدم<strong className="block text-xs text-foreground">{formatMoney(o.downPayment)}</strong></span>
            <span>تقسيط<strong className="block text-xs text-foreground">{formatNumber(o.installmentYears)} سنوات</strong></span>
            <span>استلام<strong className="block text-xs text-foreground">{o.delivery}</strong></span>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-brand-green">{o.availability}</p>
        <Button asChild variant="outline" className="mt-4 w-full"><Link to="/new-units/$slug" params={{ slug: o.slug }}>تفاصيل الوحدة <ArrowLeft /></Link></Button>
      </div>
    </article>
  );
}

export function ProjectOpportunityCard({ o }: { o: ProjectOpportunity }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <CardImage alt={o.title} position={o.imagePosition} tag={o.opportunityType} tone="badge-blue" />
      <div className="flex flex-1 flex-col p-4">
        <Link to="/project-opportunities/$slug" params={{ slug: o.slug }} className="line-clamp-2 text-base font-extrabold text-primary hover:text-brand-blue">{o.title}</Link>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{o.location}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border p-2"><dt className="flex items-center gap-1 text-muted-foreground"><Maximize2 className="size-3" />المساحة</dt><dd className="font-bold">{formatNumber(o.projectSize)} م²</dd></div>
          <div className="rounded-md border p-2"><dt className="flex items-center gap-1 text-muted-foreground"><Layers className="size-3" />حالة التطوير</dt><dd className="font-bold">{o.developmentStatus}</dd></div>
        </dl>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="size-3" />{o.owner}</p>
        <div className="mt-3 rounded-md bg-secondary p-3">
          <small className="text-[11px] font-bold text-muted-foreground">قيمة الاستثمار</small>
          <p className="text-lg font-black text-primary">{formatMoney(o.investmentValue)}</p>
        </div>
        <Button asChild variant="outline" className="mt-4 w-full"><Link to="/project-opportunities/$slug" params={{ slug: o.slug }}>تفاصيل الفرصة <ArrowLeft /></Link></Button>
      </div>
    </article>
  );
}
