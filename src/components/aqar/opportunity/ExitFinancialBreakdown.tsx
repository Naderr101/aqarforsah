import { Info } from "lucide-react";
import { computeExitFinancials, formatMoney } from "@/lib/exit-finance";
import { platformConfig } from "@/config/platform";
import type { ExitOpportunity } from "@/types/opportunity";

type Props = { opportunity: ExitOpportunity; variant?: "compact" | "detailed" };

export function ExitFinancialBreakdown({ opportunity, variant = "detailed" }: Props) {
  const f = computeExitFinancials(opportunity);

  if (variant === "compact") {
    return (
      <div className="rounded-md bg-secondary p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <small className="text-[11px] font-bold text-muted-foreground">مبلغ الخروج</small>
            <p className="text-lg font-black leading-tight text-primary">{formatMoney(f.exitAmount)}</p>
          </div>
          <div className="border-r pr-3">
            <small className="text-[11px] font-bold text-muted-foreground">المتبقي للمطور</small>
            <p className="font-bold leading-tight text-foreground">{formatMoney(f.remainingDeveloperBalance)}</p>
          </div>
        </div>
        {f.estimatedSaving !== undefined && (
          <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
            التوفير التقديري: <strong className="text-brand-green">{formatMoney(f.estimatedSaving)}</strong>
          </p>
        )}
      </div>
    );
  }

  const feePct = (platformConfig.exitPlatformFeeRate * 100).toLocaleString("ar-EG");
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-card">
      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-primary p-5 text-primary-foreground">
          <p className="text-sm font-bold text-primary-foreground/75">مبلغ الخروج</p>
          <p className="mt-1 text-3xl font-black">{formatMoney(f.exitAmount)}</p>
          <p className="mt-2 text-xs leading-5 text-primary-foreground/70">
            المبلغ المدفوع فعلياً للمطور من أصل العقد — يُحدَّد بعد مراجعة المستندات وليس من البائع.
          </p>
        </div>
        <div className="bg-card p-5">
          <p className="text-sm font-bold text-muted-foreground">المتبقي للمطور</p>
          <p className="mt-1 text-3xl font-black text-foreground">{formatMoney(f.remainingDeveloperBalance)}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">يُستكمل سداده للمطور حسب جدول العقد.</p>
        </div>
      </div>
      <dl className="divide-y px-5">
        {f.verifiedPaidAmount !== undefined && (
          <Row label="المبلغ المدفوع الموثق" value={formatMoney(f.verifiedPaidAmount)} />
        )}
        <Row label="قيمة الصفقة" hint="مبلغ الخروج + المتبقي للمطور" value={formatMoney(f.transactionValue)} strong />
        <Row label="رسوم المنصة" hint={`${feePct}٪ من قيمة الصفقة`} value={formatMoney(f.platformFee)} />
        <Row
          label="سعر السوق الحالي"
          hint="حسب تقييم عقار فرصة"
          value={f.marketValue !== undefined ? formatMoney(f.marketValue) : "التقييم قيد الإعداد"}
        />
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-green/10 px-5 py-4">
        <span className="font-extrabold text-foreground">التوفير التقديري</span>
        <span className="text-2xl font-black text-brand-green">
          {f.estimatedSaving !== undefined ? formatMoney(f.estimatedSaving) : "غير متاح حالياً"}
        </span>
      </div>
      <p className="flex items-start gap-2 px-5 py-3 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        التوفير تقديري ويعتمد على البيانات المتاحة والتقييم الحالي.
      </p>
    </section>
  );
}

function Row({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt>
        <span className="text-sm font-bold text-foreground">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </dt>
      <dd className={strong ? "text-lg font-black text-primary" : "font-bold text-foreground"}>{value}</dd>
    </div>
  );
}
