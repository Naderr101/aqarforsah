import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFlags() {
  return useQuery({
    queryKey: ["flags"],
    queryFn: async () => Object.fromEntries(((await supabase.from("feature_flags").select("key,enabled")).data ?? []).map((f) => [f.key, f.enabled])) as Record<string, boolean>,
    staleTime: 30_000,
  });
}

/** Real, privacy-safe usage tracking for admin analytics. Never throws. */
export function track(kind: "view" | "search" | "favorite", section: string, ref = "", meta: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  void supabase.from("analytics_events").insert({ kind, section: section.slice(0, 40), ref: ref.slice(0, 120), meta }).then(() => undefined, () => undefined);
}

export const fmtEGP = (v: number | null | undefined, cur = "EGP") =>
  v == null ? "—" : `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(v)} ${cur === "USD" ? "دولار" : "جنيه"}`;
