// Seller Exit Request — everything here is CLAIMED by the seller.
// The Exit Amount is never part of this shape: only Aqar Forsah sets it after verification.

export interface SellerInfo {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  city: string;
  preferredContact: "phone" | "whatsapp" | "email";
}

export interface UnitInfo {
  phaseId: string;
  buildingId: string;
  unitNumber: string;
  unitType: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  view: string;
  finishing: string;
  furnished: "furnished" | "semi" | "unfurnished" | "";
  deliveryDate: string;
}

export type InstallmentFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "";
export type MaintenanceStatus = "paid" | "not_due" | "partially_paid" | "unpaid" | "unknown" | "";

export interface ContractInfo {
  contractNumber: string;
  contractDate: string;
  originalValue: string;
  currency: "EGP" | "USD";
  installmentAmount: string;
  installmentFrequency: InstallmentFrequency;
  remainingInstallments: string;
  nextInstallmentDate: string;
  maintenanceStatus: MaintenanceStatus;
  transferNotes: string;
}

export const paymentCategories = ["PRINCIPAL", "MAINTENANCE", "TRANSFER_FEE", "ADMIN_FEE", "PENALTY", "INTEREST", "OTHER"] as const;
export type PaymentCategory = (typeof paymentCategories)[number];
export const paymentCategoryLabel: Record<PaymentCategory, string> = {
  PRINCIPAL: "أصل الثمن (قسط)", MAINTENANCE: "صيانة", TRANSFER_FEE: "رسوم تنازل", ADMIN_FEE: "مصاريف إدارية", PENALTY: "غرامة تأخير", INTEREST: "فوائد", OTHER: "أخرى",
};

export interface ClaimedPayment {
  id: string;
  kind: "installment" | "other_charge";
  category: PaymentCategory;
  date: string;
  amount: string;
  principal: string; // optional, if known
  reference: string;
}

export interface ClaimedPayments {
  downPayment: { amount: string; date: string; principal: string; reference: string };
  installments: ClaimedPayment[];
  claimedRemainingBalance: string;
}

export type DocumentKind = "contract" | "schedule" | "receipts" | "nationalId" | "other";
export interface DocumentFile { name: string; size: number }
export type Documents = Record<DocumentKind, DocumentFile[]> & { notes: string };

export interface TransferInfo {
  eligibility: "yes" | "no" | "unknown";
  developerApprovalRequired: "yes" | "no" | "unknown";
  terms: string;
  transferFee: string;
  adminFee: string;
  cancellationTerms: string;
  notes: string;
}

export interface ExitRequestDraft {
  seller: SellerInfo;
  developerId: string;
  projectId: string;
  unit: UnitInfo;
  contract: ContractInfo;
  payments: ClaimedPayments;
  documents: Documents;
  transfer: TransferInfo;
  updatedAt: string;
}

/** Only states the backend currently supports. */
export type ExitStatus = "draft" | "pending_review";
export const exitStatusLabel: Record<ExitStatus, string> = { draft: "مسودة", pending_review: "تم إرسال الطلب" };

export interface ExitDraftRecord {
  id: string;
  status: ExitStatus;
  currentStep: number;
  maxStep: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  draft: ExitRequestDraft;
}
