// Seller Exit Request — data the seller submits for review.
// All figures here are CLAIMED by the seller. Verified figures, the final
// Exit Amount and the review status are set by Aqar Forsah only.

export type Unknownable<T> = T | "unknown";

export interface SellerInfo {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  city: string;
  preferredContact: "phone" | "whatsapp" | "email";
}

export interface UnitInfo {
  phase: string;
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

export interface ContractInfo {
  contractNumber: string;
  contractDate: string;
  originalValue: string;
  currency: "EGP" | "USD";
  installmentAmount: string;
  installmentFrequency: "monthly" | "quarterly" | "semiannual" | "annual" | "";
  remainingInstallments: string;
  nextInstallmentDate: string;
  maintenanceStatus: "paid" | "not_due" | "partially_paid" | "unpaid" | "unknown" | "";
  transferNotes: string;
}

export interface ClaimedPayment {
  id: string;
  date: string;
  amount: string;
  principal: string; // optional, if known
  reference: string;
  category: "installment" | "maintenance" | "club" | "other";
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
  transferFee: string; // empty = unknown
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

/** Customer-facing review states. Set server-side only. */
export type ExitRequestStatus = "submitted" | "under_review" | "needs_documents" | "verified" | "rejected";

export interface SubmittedExitRequest {
  id: string;
  submittedAt: string;
  status: ExitRequestStatus;
  draft: ExitRequestDraft;
  /** Filled by Aqar Forsah after verification. Never editable by the seller. */
  verified?: {
    eligiblePrincipalPaid: number;
    remainingDeveloperBalance: number;
    exitAmount: number;
  } | undefined;
  exitAmountConfirmedAt?: string | undefined;
}
