import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCatalogOptions() {
  const devs = useQuery({ queryKey: ["admin", "developers", "opts"], queryFn: async () => (await supabase.from("developers").select("id,name").order("name")).data ?? [] });
  const projs = useQuery({ queryKey: ["admin", "projects", "opts"], queryFn: async () => (await supabase.from("projects").select("id,name").order("name")).data ?? [] });
  const cities = useQuery({ queryKey: ["admin", "cities", "opts"], queryFn: async () => (await supabase.from("cities").select("name").order("sort_order")).data ?? [] });
  return {
    devs: (devs.data ?? []).map((d) => ({ value: d.id, label: d.name })),
    projs: (projs.data ?? []).map((d) => ({ value: d.id, label: d.name })),
    cities: (cities.data ?? []).map((c) => ({ value: c.name, label: c.name })),
  };
}
