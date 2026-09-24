// Local draft persistence (autosave-ready). Swap these functions for server
// calls when the backend exists — the wizard only talks to this module.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExitRequestDraft, SubmittedExitRequest } from "@/types/exit-request";

const DRAFT_KEY = "aqar-exit-draft-v1";
const SUBMITTED_KEY = "aqar-exit-requests-v1";

export const emptyDraft = (): ExitRequestDraft => ({
  seller: { fullName: "", phone: "", email: "", nationalId: "", city: "", preferredContact: "phone" },
  developerId: "", projectId: "",
  unit: { phase: "", unitNumber: "", unitType: "", area: "", bedrooms: "", bathrooms: "", floor: "", view: "", finishing: "", furnished: "", deliveryDate: "" },
  contract: { contractNumber: "", contractDate: "", originalValue: "", currency: "EGP", installmentAmount: "", installmentFrequency: "", remainingInstallments: "", nextInstallmentDate: "", maintenanceStatus: "", transferNotes: "" },
  payments: { downPayment: { amount: "", date: "", principal: "", reference: "" }, installments: [], claimedRemainingBalance: "" },
  documents: { contract: [], schedule: [], receipts: [], nationalId: [], other: [], notes: "" },
  transfer: { eligibility: "unknown", developerApprovalRequired: "unknown", terms: "", transferFee: "", adminFee: "", cancellationTerms: "", notes: "" },
  updatedAt: new Date(0).toISOString(),
});

export function useExitDraft() {
  const [draft, setDraft] = useState<ExitRequestDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...emptyDraft(), ...JSON.parse(raw) });
    } catch { /* ignore corrupt draft */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)), 400);
    return () => clearTimeout(t);
  }, [draft, loaded]);

  const update = useCallback(<K extends keyof ExitRequestDraft>(key: K, value: ExitRequestDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value, updatedAt: new Date().toISOString() }));
  }, []);

  const reset = useCallback(() => { localStorage.removeItem(DRAFT_KEY); setDraft(emptyDraft()); }, []);

  return { draft, update, loaded, reset };
}

export function submitExitRequest(draft: ExitRequestDraft): SubmittedExitRequest {
  const req: SubmittedExitRequest = {
    id: `XR-${Date.now().toString(36).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    status: "submitted",
    draft,
  };
  const all = listExitRequests();
  localStorage.setItem(SUBMITTED_KEY, JSON.stringify([req, ...all]));
  localStorage.removeItem(DRAFT_KEY);
  return req;
}

export function listExitRequests(): SubmittedExitRequest[] {
  try { return JSON.parse(localStorage.getItem(SUBMITTED_KEY) ?? "[]"); } catch { return []; }
}

export const num = (v: string) => { const n = Number(String(v).replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; };

/** Claimed total paid — display only, never "verified". */
export function claimedTotalPaid(d: ExitRequestDraft) {
  return num(d.payments.downPayment.amount) + d.payments.installments.reduce((s, p) => s + num(p.amount), 0);
}
