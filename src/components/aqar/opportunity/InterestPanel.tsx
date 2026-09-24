import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/lib/site-content";
import type { OpportunitySection } from "@/types/opportunity";

const FALLBACK = [
  { field_key: "name", label: "الاسم", required: true },
  { field_key: "phone", label: "رقم الموبايل", required: true },
];

// Platform-mediated interest. The seller's contact info is never shown; submissions go to the CRM.
export function InterestPanel({ opportunityId, section, cta }: { opportunityId: string; section: OpportunitySection; cta?: string }) {
  const t = useSiteContent();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const fields = useQuery({
    queryKey: ["form-fields", "interest"],
    queryFn: async () => (await supabase.from("form_fields").select("field_key,label,required,visible,sort_order").eq("form", "interest").order("sort_order")).data ?? [],
    staleTime: 60_000,
  });
  const list = (fields.data?.length ? fields.data.filter((f) => f.visible || f.field_key === "name" || f.field_key === "phone") : FALLBACK)
    .map((f) => ({ ...f, required: f.required || f.field_key === "name" || f.field_key === "phone" }));

  async function submit() {
    const name = (vals["name"] ?? "").trim(), phone = (vals["phone"] ?? "").replace(/[^\d+]/g, "");
    if (name.length < 2 || phone.length < 6) { toast.error("اكتب الاسم ورقم موبايل صحيح"); return; }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: name.slice(0, 100), phone: phone.slice(0, 20), email: (vals["email"] ?? "").trim().slice(0, 200),
      message: (vals["message"] ?? "").slice(0, 2000), section, opportunity_ref: opportunityId,
    });
    setBusy(false);
    if (error) { toast.error("تعذر الإرسال، حاول تاني."); return; }
    setSent(true);
  }

  if (sent)
    return (
      <div className="rounded-md bg-brand-green/10 p-4 text-center">
        <CheckCircle2 className="mx-auto size-8 text-brand-green" />
        <p className="mt-2 font-extrabold">{t("interest.success")}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">فريق عقار فرصة هيتواصل معاك بخصوص الفرصة رقم {opportunityId}.</p>
      </div>
    );
  return (
    <form data-section={section} onSubmit={(e) => { e.preventDefault(); void submit(); }} className="grid gap-2">
      {list.map((f) => f.field_key === "message"
        ? <Textarea key={f.field_key} required={f.required} placeholder={f.label} aria-label={f.label} maxLength={2000} value={vals[f.field_key] ?? ""} onChange={(e) => setVals({ ...vals, [f.field_key]: e.target.value })} />
        : <Input key={f.field_key} required={f.required} type={f.field_key === "phone" ? "tel" : f.field_key === "email" ? "email" : "text"} inputMode={f.field_key === "phone" ? "tel" : undefined} placeholder={f.label} aria-label={f.label} value={vals[f.field_key] ?? ""} onChange={(e) => setVals({ ...vals, [f.field_key]: e.target.value })} />)}
      <Button size="lg" type="submit" disabled={busy} className="mt-1 w-full">{busy ? <Loader2 className="animate-spin" /> : cta ?? t("interest.cta")}</Button>
      <p className="flex items-start gap-1.5 text-[11px] leading-5 text-muted-foreground">
        <Lock className="mt-0.5 size-3 shrink-0" />
        بيانات البائع لا تُعرض للعامة. عقار فرصة بيتابع معاك كل خطوة.
      </p>
    </form>
  );
}
