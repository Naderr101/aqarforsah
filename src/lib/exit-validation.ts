import type { ExitRequestDraft } from "@/types/exit-request";
import { isMoney } from "./money";

export const steps = [
  { id: "account", label: "الحساب" },
  { id: "seller", label: "بياناتك" },
  { id: "developer", label: "المطور" },
  { id: "project", label: "المشروع" },
  { id: "unit", label: "الوحدة" },
  { id: "contract", label: "العقد" },
  { id: "payments", label: "المدفوعات" },
  { id: "documents", label: "المستندات" },
  { id: "transfer", label: "التنازل" },
  { id: "review", label: "المراجعة" },
] as const;
export type StepId = (typeof steps)[number]["id"];
export type Errors = Record<string, string>;

const req = "مطلوب";
const optMoney = (v: string) => !v || isMoney(v);

export function validateStep(id: StepId, d: ExitRequestDraft): Errors {
  const e: Errors = {};
  switch (id) {
    case "seller":
      if (!d.seller.fullName.trim()) e["fullName"] = req;
      if (!/^\+?\d{10,14}$/.test(d.seller.phone.replace(/\s/g, ""))) e["phone"] = "رقم موبايل غير صحيح";
      if (d.seller.email && !/^\S+@\S+\.\S+$/.test(d.seller.email)) e["email"] = "بريد غير صحيح";
      if (d.seller.nationalId && !/^\d{14}$/.test(d.seller.nationalId)) e["nationalId"] = "الرقم القومي ١٤ رقم";
      break;
    case "developer": if (!d.developerId) e["developerId"] = "اختار المطور"; break;
    case "project": if (!d.projectId) e["projectId"] = "اختار المشروع"; break;
    case "unit":
      if (!d.unit.unitType) e["unitType"] = req;
      if (!d.unit.area || !isMoney(d.unit.area)) e["area"] = "أدخل المساحة بالأرقام";
      break;
    case "contract":
      if (!d.contract.contractNumber.trim()) e["contractNumber"] = "رقم العقد مطلوب";
      if (!d.contract.contractDate) e["contractDate"] = req;
      if (!d.contract.originalValue || !isMoney(d.contract.originalValue)) e["originalValue"] = "أدخل قيمة العقد بالأرقام";
      if (!optMoney(d.contract.installmentAmount)) e["installmentAmount"] = "مبلغ غير صحيح";
      if (!d.contract.installmentFrequency) e["installmentFrequency"] = req;
      break;
    case "payments":
      if (!d.payments.downPayment.amount || !isMoney(d.payments.downPayment.amount)) e["downAmount"] = "أدخل قيمة المقدم";
      if (!optMoney(d.payments.downPayment.principal)) e["downPrincipal"] = "مبلغ غير صحيح";
      d.payments.installments.forEach((p, i) => {
        if (!p.amount || !isMoney(p.amount)) e[`inst-${i}`] = "أدخل مبلغ الدفعة";
        if (!optMoney(p.principal)) e[`instp-${i}`] = "مبلغ غير صحيح";
      });
      if (!d.payments.claimedRemainingBalance || !isMoney(d.payments.claimedRemainingBalance)) e["remaining"] = "أدخل المتبقي حسب علمك";
      break;
    case "documents":
      if (!d.documents.contract.length) e["contract"] = "ارفع صورة العقد";
      if (!d.documents.receipts.length) e["receipts"] = "ارفع إيصالات السداد";
      break;
  }
  return e;
}

export function firstInvalidStep(d: ExitRequestDraft): number {
  return steps.findIndex((s) => Object.keys(validateStep(s.id, d)).length > 0);
}
