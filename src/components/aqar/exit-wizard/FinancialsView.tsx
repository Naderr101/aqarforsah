import { formatCents, toCents, type Currency } from "@/lib/money";

export type Financials = {
  verified_principal: number | string | null; exit_amount: number | string | null; remaining_balance: number | string | null;
  transaction_value: number | string | null; buyer_fee_rate: number | string | null; buyer_fee: number | string | null;
  market_value: number | string | null; market_value_date: string | null; estimated_saving: number | string | null; currency: string | null;
};

/** Display only — every figure comes from the backend financial engine. */
export const fmtDb = (v: number | string | null | undefined, cur: string | null = "EGP") =>
  v === null || v === undefined || v === "" ? "—" : formatCents(toCents(typeof v === "number" ? v.toFixed(2) : String(v)), (cur ?? "EGP") as Currency);

export function FinancialsView({ f }: { f: Financials | null }) {
  if (!f) return null;
  const cur = f.currency ?? "EGP";
  const rate = f.buyer_fee_rate != null ? `${(Number(f.buyer_fee_rate) * 100).toLocaleString("ar-EG", { maximumFractionDigits: 2 })}٪` : "";
  const rows: Array<[string, string, boolean?]> = [
    ["أصل الثمن الموثق", fmtDb(f.verified_principal, cur)],
    ["مبلغ الخروج", fmtDb(f.exit_amount, cur), true],
    ["المتبقي للمطور (موثق)", fmtDb(f.remaining_balance, cur)],
    ["قيمة الصفقة", fmtDb(f.transaction_value, cur)],
    [`رسوم المنصة على المشتري ${rate}`, fmtDb(f.buyer_fee, cur)],
    ["سعر السوق الحالي", f.market_value != null ? `${fmtDb(f.market_value, cur)}${f.market_value_date ? ` · ${new Date(f.market_value_date).toLocaleDateString("ar-EG")}` : ""}` : "لسه بنراجع بيانات سعر السوق"],
  ];
  return (
    <div className="grid gap-0 divide-y rounded-lg border">
      {rows.map(([k, v, strong]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm"><span className="text-muted-foreground">{k}</span><span className={strong ? "text-lg font-black text-primary" : "font-bold"}>{v}</span></div>
      ))}
      <div className="flex justify-between gap-4 bg-brand-green/10 px-4 py-3 text-sm">
        <span className="font-bold">التوفير التقديري</span>
        <span className="font-black">{f.estimated_saving != null ? fmtDb(f.estimated_saving, cur) : "لسه بنراجع بيانات سعر السوق"}</span>
      </div>
      <p className="px-4 py-2 text-[11px] leading-5 text-muted-foreground">التوفير تقديري ومش مضمون: سعر السوق − قيمة الصفقة − رسوم المنصة. رسوم البائع ٠٪. كل المدفوعات بتتم خارج المنصة.</p>
    </div>
  );
}
