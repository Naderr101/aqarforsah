// Server-backed draft persistence for the Seller Exit Wizard.
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExitDraft, saveExitDraft } from "./exit-drafts.functions";
import { toCents } from "./money";
import type { ExitDraftRecord, ExitRequestDraft } from "@/types/exit-request";

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useServerDraft(id: string) {
  const load = useServerFn(getExitDraft);
  const save = useServerFn(saveExitDraft);
  const q = useQuery({ queryKey: ["exit-draft", id], queryFn: () => load({ data: { id } }), staleTime: Infinity, refetchOnWindowFocus: false, retry: false });

  const [record, setRecord] = useState<ExitDraftRecord | null>(null);
  const [draft, setDraft] = useState<ExitRequestDraft | null>(null);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const dirty = useRef(false);
  const latest = useRef({ draft, step, maxStep });
  latest.current = { draft, step, maxStep };
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (q.data && !record) {
      setRecord(q.data); setDraft(q.data.draft); setStep(q.data.currentStep); setMaxStep(Math.max(q.data.maxStep, q.data.currentStep));
    }
  }, [q.data, record]);

  const flush = useCallback(() => {
    const run = async () => {
      const { draft: d, step: s, maxStep: m } = latest.current;
      if (!d || !dirty.current || record?.status !== "draft") return;
      dirty.current = false;
      setSaveState("saving");
      try { await save({ data: { id, draft: d, currentStep: s, maxStep: m } }); setSaveState("saved"); }
      catch { dirty.current = true; setSaveState("error"); }
    };
    chain.current = chain.current.then(run, run);
    return chain.current;
  }, [id, save, record?.status]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => void flush(), 800);
    return () => clearTimeout(t);
  }, [draft, step, maxStep, flush]);

  useEffect(() => {
    const h = () => { if (dirty.current) void flush(); };
    window.addEventListener("pagehide", h);
    return () => { window.removeEventListener("pagehide", h); h(); };
  }, [flush]);

  const update = useCallback(<K extends keyof ExitRequestDraft>(key: K, value: ExitRequestDraft[K]) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, [key]: value, updatedAt: new Date().toISOString() } : d));
  }, []);
  const goStep = useCallback((s: number) => { dirty.current = true; setStep(s); setMaxStep((m) => Math.max(m, s)); }, []);

  return { query: q, record, draft, step, maxStep, goStep, update, saveState, flush };
}

/** Claimed figures — display only, always labelled seller-provided / unverified. */
export function claimedTotals(d: ExitRequestDraft) {
  const dp = d.payments.downPayment;
  let total = toCents(dp.amount);
  let principal = dp.principal ? toCents(dp.principal) : toCents(dp.amount);
  for (const p of d.payments.installments) {
    total += toCents(p.amount);
    if (p.principal) principal += toCents(p.principal);
    else if (p.category === "PRINCIPAL") principal += toCents(p.amount);
  }
  return { total, principal, remaining: toCents(d.payments.claimedRemainingBalance) };
}
