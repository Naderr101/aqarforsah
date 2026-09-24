import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function Field({ label, error, hint, children, optional }: { label: string; error?: string | undefined; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}{optional && <span className="mr-1 text-xs font-normal text-muted-foreground">(اختياري)</span>}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-bold text-destructive">{error}</span>}
    </label>
  );
}

type TextProps = { label: string; value: string; onChange: (v: string) => void; error?: string | undefined; hint?: string; optional?: boolean; type?: string; inputMode?: "numeric" | "tel" | "email" | "text"; placeholder?: string };
export function TextField({ label, value, onChange, error, hint, optional, type = "text", inputMode, placeholder }: TextProps) {
  return <Field label={label} error={error} {...(hint ? { hint } : {})} {...(optional ? { optional } : {})}><Input type={type} value={value} inputMode={inputMode} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} /></Field>;
}

export function AreaField({ label, value, onChange, optional, placeholder }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean; placeholder?: string }) {
  return <Field label={label} {...(optional ? { optional } : {})}><Textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={3} /></Field>;
}

export function SelectField<T extends string>({ label, value, onChange, options, error, optional }: { label: string; value: T; onChange: (v: T) => void; options: Array<[T, string]>; error?: string | undefined; optional?: boolean }) {
  return (
    <Field label={label} error={error} {...(optional ? { optional } : {})}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-invalid={!!error} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

export function ChoiceField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: Array<[T, string]> }) {
  return (
    <div>
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} className={`rounded-md border px-3 py-2 text-sm font-bold ${value === v ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}

export function ClaimedNotice() {
  return <p className="rounded-md border border-brand-yellow/60 bg-brand-yellow/15 px-4 py-3 text-sm font-bold leading-6">البيانات المدخلة مقدمة من البائع وتخضع للمراجعة والتوثيق.</p>;
}
