import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Every editable text/image on the site, with its safe default. */
export const CONTENT_FIELDS = [
  { key: "brand.name", group: "الهوية", label: "اسم الموقع", def: "عقار فرصة" },
  { key: "brand.tagline", group: "الهوية", label: "السطر الإنجليزي تحت الاسم", def: "AQAR FORSAH" },
  { key: "brand.logo", group: "الهوية", label: "اللوجو", def: "", image: true },
  { key: "home.hero_title", group: "الصفحة الرئيسية", label: "العنوان الرئيسي", def: "إنت مش بتدور على عقار.. إنت بتدور على فرصة", long: true },
  { key: "home.hero_subtitle", group: "الصفحة الرئيسية", label: "السطر تحت العنوان", def: "فرص خروج من عقود تقسيط بمبلغ خروج قائم على المدفوع فعلياً — بدون أوفر برايس.", long: true },
  { key: "home.hero_image", group: "الصفحة الرئيسية", label: "صورة البانر", def: "", image: true },
  { key: "home.exit_title", group: "الصفحة الرئيسية", label: "عنوان قسم فرص الخروج", def: "فرص الخروج" },
  { key: "home.exit_text", group: "الصفحة الرئيسية", label: "وصف فرص الخروج", def: "فرص لوحدات أصحابها عايزين يخرجوا من عقودهم." },
  { key: "home.units_title", group: "الصفحة الرئيسية", label: "عنوان الوحدات الجديدة", def: "الوحدات الجديدة" },
  { key: "home.units_text", group: "الصفحة الرئيسية", label: "وصف الوحدات الجديدة", def: "وحدات مباشرة من المطورين والمشروعات." },
  { key: "home.projects_title", group: "الصفحة الرئيسية", label: "عنوان فرص المشاريع", def: "فرص المشاريع" },
  { key: "home.projects_text", group: "الصفحة الرئيسية", label: "وصف فرص المشاريع", def: "فرص تطوير واستثمار ومشروعات عقارية." },
  { key: "home.sell_title", group: "الصفحة الرئيسية", label: "عنوان قسم البيع", def: "عايز تخرج من وحدتك؟" },
  { key: "home.sell_text", group: "الصفحة الرئيسية", label: "وصف قسم البيع", def: "ضيف بيانات عقدك ومدفوعاتك، ومبلغ الخروج بيتحدد بعد مراجعة المستندات.", long: true },
  { key: "interest.cta", group: "نموذج الاهتمام", label: "نص الزر", def: "مهتم بالفرصة" },
  { key: "interest.success", group: "نموذج الاهتمام", label: "رسالة النجاح", def: "تم تسجيل اهتمامك" },
  { key: "footer.about", group: "الفوتر والتواصل", label: "نبذة", def: "منصة فرص عقارية: فرص خروج، وحدات جديدة، وفرص مشاريع.", long: true },
  { key: "footer.phone", group: "الفوتر والتواصل", label: "رقم التواصل", def: "" },
  { key: "footer.email", group: "الفوتر والتواصل", label: "البريد", def: "" },
  { key: "footer.address", group: "الفوتر والتواصل", label: "العنوان", def: "" },
] as const satisfies ReadonlyArray<{ key: string; group: string; label: string; def: string; long?: boolean; image?: boolean }>;

export type ContentKey = (typeof CONTENT_FIELDS)[number]["key"];
const DEFAULTS = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.def])) as Record<ContentKey, string>;

export const siteContentQuery = {
  queryKey: ["site-content"] as const,
  queryFn: async () => {
    const { data } = await supabase.from("site_content").select("key,value");
    const map: Record<string, string> = {};
    for (const r of data ?? []) if (typeof r.value === "string") map[r.key] = r.value;
    return map;
  },
  staleTime: 60_000,
};

export function useSiteContent() {
  const q = useQuery(siteContentQuery);
  return (key: ContentKey) => {
    const v = q.data?.[key];
    return v && v.trim() ? v : DEFAULTS[key];
  };
}

export function useNavSections() {
  return useQuery({
    queryKey: ["nav-sections"],
    queryFn: async () => (await supabase.from("nav_sections").select("id,label,href,sort_order").eq("visible", true).order("sort_order")).data ?? [],
    staleTime: 60_000,
  });
}
