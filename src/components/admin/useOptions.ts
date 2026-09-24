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

export const NEW_UNIT_STATUS = [
  { value: "DRAFT", label: "مسودة" }, { value: "PENDING_APPROVAL", label: "بانتظار الموافقة" }, { value: "APPROVED", label: "تمت الموافقة" },
  { value: "PUBLISHED", label: "منشورة" }, { value: "RESERVED", label: "محجوزة" }, { value: "SOLD", label: "مباعة" },
  { value: "REJECTED", label: "مرفوضة" }, { value: "PAUSED", label: "موقوفة مؤقتاً" }, { value: "UNAVAILABLE", label: "غير متاحة" },
];
export const PROJECT_STATUS = [
  { value: "DRAFT", label: "مسودة" }, { value: "PENDING_REVIEW", label: "بانتظار المراجعة" }, { value: "VERIFIED", label: "تم التحقق" },
  { value: "PUBLISHED", label: "منشورة" }, { value: "PAUSED", label: "موقوفة" }, { value: "CLOSED", label: "مغلقة" }, { value: "REJECTED", label: "مرفوضة" },
];
export const PROJECT_TYPES = [
  { value: "DEVELOPMENT_PROJECT", label: "مشروع تطوير" }, { value: "LAND_PLUS_DEVELOPMENT", label: "أرض + تطوير" },
  { value: "BUILDING_PORTFOLIO", label: "محفظة مباني" }, { value: "INVESTMENT_OPPORTUNITY", label: "فرصة استثمار" },
  { value: "DEVELOPMENT_PARTNERSHIP", label: "شراكة تطوير" },
];
export const label = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;
