// UI-level models for the three Aqar Forsah marketplace sections.
// Each section keeps its own financial / business fields — no shared "price".

export type OpportunitySection = "exit" | "new-unit" | "project";

/** Verification states. Must come from real server state (or be flagged as demo). */
export type VerificationStatus =
  | "not_submitted"
  | "under_review"
  | "reviewed"
  | "verified"
  | "needs_documents";

export interface OpportunityBase {
  id: string;
  slug: string;
  section: OpportunitySection;
  title: string;
  location: string;
  city: string;
  imagePosition: string;
  description: string;
  /** True while listings are sample content, not real submissions. */
  isDemo: boolean;
}

export interface UnitSpecs {
  project: string;
  developer: string;
  unitType: string;
  area: number;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  floor?: string | undefined;
  delivery?: string | undefined;
}

export interface ExitVerification {
  paidAmount: VerificationStatus;
  contract: VerificationStatus;
  unitData: VerificationStatus;
  transfer: VerificationStatus;
}

export interface ExitContract {
  originalContractValue: number;
  installmentPlan: string;
  nextInstallment?: { amount: number | undefined; dueDate: string };
  contractStatus: string;
}

export interface ExitOpportunity extends OpportunityBase, UnitSpecs {
  section: "exit";
  /** Verified principal already paid to the developer. Not set by the seller. */
  exitAmount: number;
  /** Amount confirmed by document review, when available. */
  verifiedPaidAmount?: number | undefined;
  remainingDeveloperBalance: number;
  /** Set by the Aqar Forsah valuation process only. */
  marketValue?: number | undefined;
  monthlyInstallment?: number | undefined;
  contract: ExitContract;
  verification: ExitVerification;
}

export interface NewUnitOpportunity extends OpportunityBase, UnitSpecs {
  section: "new-unit";
  unitPrice: number;
  downPayment: number;
  installmentYears: number;
  availability: string;
}

export interface ProjectOpportunity extends OpportunityBase {
  section: "project";
  opportunityType: string;
  projectSize: number;
  developmentStatus: string;
  owner: string;
  /** القيمة المطلوبة / قيمة الاستثمار */
  investmentValue: number;
  highlights: string[];
}

export type AnyOpportunity = ExitOpportunity | NewUnitOpportunity | ProjectOpportunity;
