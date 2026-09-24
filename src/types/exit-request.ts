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

export type DocumentKind = "contract" | "schedule" | "receipts" | "nationalId" | "authorization" | "assignment" | "other";
export const documentKinds: DocumentKind[] = ["contract", "schedule", "receipts", "nationalId", "authorization", "assignment", "other"];
export const documentKindDb: Record<DocumentKind, string> = { contract: "CONTRACT", schedule: "PAYMENT_SCHEDULE", receipts: "RECEIPT", nationalId: "NATIONAL_ID", authorization: "AUTHORIZATION", assignment: "ASSIGNMENT", other: "OTHER" };
export const documentKindLabel: Record<DocumentKind, string> = { contract: "العقد", schedule: "جدول السداد", receipts: "إيصالات السداد", nationalId: "صورة البطاقة", authorization: "توكيل / تفويض", assignment: "مستندات التنازل", other: "مستندات أخرى" };
export type DocumentStatus = "UPLOADED" | "PROCESSING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "REPLACEMENT_REQUIRED";
export const documentStatusLabel: Record<DocumentStatus, string> = { UPLOADED: "تم الرفع", PROCESSING: "جاري المعالجة", UNDER_REVIEW: "قيد المراجعة", VERIFIED: "تمت المراجعة", REJECTED: "مرفوض", REPLACEMENT_REQUIRED: "مطلوب استبدال" };
export interface DocumentFile { id?: string | undefined; name: string; size: number; status?: DocumentStatus | undefined; version?: number | undefined; notes?: string | undefined }
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
export type ExitStatus = "draft" | "pending_review" | "under_verification" | "documents_required" | "verified" | "rejected" | "published";
export const exitStatusLabel: Record<ExitStatus, string> = {
  draft: "مسودة", pending_review: "تم إرسال الطلب", under_verification: "قيد المراجعة", documents_required: "مطلوب مستندات إضافية",
  verified: "تم التحقق", rejected: "مرفوض", published: "منشورة",
};
export type CheckType = "IDENTITY" | "CONTRACT" | "UNIT_PROJECT_DEVELOPER" | "PAYMENTS" | "REMAINING_BALANCE" | "TRANSFER_ELIGIBILITY" | "CANCELLATION_TERMS" | "MARKET_VALUE";
export const checkTypeLabel: Record<CheckType, string> = {
  IDENTITY: "الهوية", CONTRACT: "العقد", UNIT_PROJECT_DEVELOPER: "الوحدة / المشروع / المطور", PAYMENTS: "المدفوعات", REMAINING_BALANCE: "المتبقي للمطور",
  TRANSFER_ELIGIBILITY: "قابلية التنازل", CANCELLATION_TERMS: "شروط الإلغاء", MARKET_VALUE: "سعر السوق",
};
export type CheckStatus = "PENDING" | "PASSED" | "FAILED" | "NEEDS_INFO";
export const checkStatusLabel: Record<CheckStatus, string> = { PENDING: "لم تتم بعد", PASSED: "تم التحقق", FAILED: "لم يجتز", NEEDS_INFO: "مطلوب معلومات" };
export type PaymentVerification = "CLAIMED" | "VERIFIED" | "ADJUSTED" | "REJECTED";
export const paymentVerificationLabel: Record<PaymentVerification, string> = { CLAIMED: "مُدّعى — لم يُراجع", VERIFIED: "موثق", ADJUSTED: "معدّل بعد المراجعة", REJECTED: "مرفوض" };

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
