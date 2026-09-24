import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OpportunitySection } from "@/types/opportunity";

// Platform-mediated interest. The seller's contact info is never shown.
// Submission will be connected to the Aqar Forsah follow-up workflow later.
export function InterestPanel({ opportunityId, section, cta = "مهتم بالفرصة" }: { opportunityId: string; section: OpportunitySection; cta?: string }) {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="rounded-md bg-brand-green/10 p-4 text-center">
        <CheckCircle2 className="mx-auto size-8 text-brand-green" />
        <p className="mt-2 font-extrabold">تم تسجيل اهتمامك</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">فريق عقار فرصة هيتواصل معاك بخصوص الفرصة رقم {opportunityId}.</p>
      </div>
    );
  return (
    <form data-section={section} onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid gap-2">
      <Input required placeholder="الاسم" aria-label="الاسم" />
      <Input required type="tel" inputMode="tel" placeholder="رقم الموبايل" aria-label="رقم الموبايل" />
      <Button size="lg" type="submit" className="mt-1 w-full">{cta}</Button>
      <p className="flex items-start gap-1.5 text-[11px] leading-5 text-muted-foreground">
        <Lock className="mt-0.5 size-3 shrink-0" />
        بيانات البائع لا تُعرض للعامة. عقار فرصة بيتابع معاك كل خطوة.
      </p>
    </form>
  );
}
