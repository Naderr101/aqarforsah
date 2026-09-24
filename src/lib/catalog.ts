import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Catalog {
  developers: { id: string; name: string }[];
  projects: { id: string; developer_id: string; name: string; location: string }[];
  phases: { id: string; project_id: string; name: string }[];
  buildings: { id: string; phase_id: string; name: string }[];
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Catalog> => {
      const [d, p, ph, b] = await Promise.all([
        supabase.from("developers").select("id,name").order("name"),
        supabase.from("projects").select("id,developer_id,name,location").order("name"),
        supabase.from("phases").select("id,project_id,name").order("sort_order"),
        supabase.from("buildings").select("id,phase_id,name").order("sort_order"),
      ]);
      const err = d.error ?? p.error ?? ph.error ?? b.error;
      if (err) throw err;
      return { developers: d.data ?? [], projects: p.data ?? [], phases: ph.data ?? [], buildings: b.data ?? [] };
    },
  });
}
