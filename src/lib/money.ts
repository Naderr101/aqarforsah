// Precise money helpers. Amounts travel as decimal strings and are summed as
// integer piastres (BigInt) — never as floating-point numbers.
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeMoney(v: string): string {
  return String(v ?? "")
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[٬,\s]/g, "");
}

export const MONEY_RE = /^\d{1,12}(\.\d{1,2})?$/;
export const isMoney = (v: string) => MONEY_RE.test(normalizeMoney(v));

export function toCents(v: string): bigint {
  const n = normalizeMoney(v);
  if (!MONEY_RE.test(n)) return 0n;
  const [i, f = ""] = n.split(".");
  return BigInt(i!) * 100n + BigInt((f + "00").slice(0, 2));
}

export type Currency = "EGP" | "USD";
export const currencyLabel = (c: Currency) => (c === "USD" ? "دولار" : "جنيه");

export function formatCents(c: bigint, currency: Currency = "EGP"): string {
  const neg = c < 0n;
  const a = neg ? -c : c;
  const whole = (a / 100n).toLocaleString("ar-EG");
  const frac = a % 100n;
  const f = frac ? `٫${Number(frac).toLocaleString("ar-EG", { minimumIntegerDigits: 2 })}` : "";
  return `${neg ? "-" : ""}${whole}${f} ${currencyLabel(currency)}`;
}

export const formatMoneyStr = (v: string, currency: Currency = "EGP") => (v && isMoney(v) ? formatCents(toCents(v), currency) : "—");
