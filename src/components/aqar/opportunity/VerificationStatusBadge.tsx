import { CircleDashed, FileWarning, Hourglass, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { VerificationStatus } from "@/types/opportunity";

const map: Record<VerificationStatus, { label: string; icon: typeof ShieldCheck; cls: string }> = {
  not_submitted: { label: "لم تُقدَّم بعد", icon: CircleDashed, cls: "bg-muted text-muted-foreground" },
  under_review: { label: "قيد المراجعة", icon: Hourglass, cls: "bg-brand-yellow/20 text-foreground" },
  reviewed: { label: "تمت مراجعة البيانات", icon: CheckCircle2, cls: "bg-brand-blue/10 text-brand-blue" },
  verified: { label: "موثق", icon: ShieldCheck, cls: "bg-brand-green/15 text-brand-green" },
  needs_documents: { label: "يحتاج مستندات إضافية", icon: FileWarning, cls: "bg-brand-pink/10 text-brand-pink" },
};

export function VerificationStatusBadge({ status, label }: { status: VerificationStatus; label?: string }) {
  const { label: text, icon: Icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      <Icon className="size-3.5" />
      {label ? `${label}: ${text}` : text}
    </span>
  );
}

export const verificationLabel = (s: VerificationStatus) => map[s].label;
