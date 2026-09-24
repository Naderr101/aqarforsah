import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";
import { useCatalogOptions, PROJECT_STATUS, PROJECT_TYPES } from "@/components/admin/useOptions";

export const Route = createFileRoute("/_authenticated/admin/project-opportunities")({ component: Page });

function Page() {
  const o = useCatalogOptions();
  return (
    <AdminPage title="فرص المشاريع">
      <p className="mb-4 text-sm text-muted-foreground">لازم الفرصة تتراجع مستنداتها وتتحول لـ "تم التحقق" قبل النشر. القسم كله بيظهر للزوار بس لما تشغّله من "المفاتيح والطوارئ".</p>
      <CrudTable table="project_opportunities" defaults={{ status: "DRAFT", opp_type: "DEVELOPMENT_PROJECT" }} fields={[
        { key: "title", label: "العنوان", required: true },
        { key: "city", label: "المدينة", type: "select", options: o.cities },
        { key: "status", label: "الحالة", type: "select", required: true, options: PROJECT_STATUS },
        { key: "opp_type", label: "نوع الفرصة", type: "select", required: true, options: PROJECT_TYPES },
        { key: "location", label: "الموقع" },
        { key: "size_sqm", label: "المساحة (م²)", type: "number" },
        { key: "development_status", label: "حالة التطوير" },
        { key: "investment_value", label: "قيمة الاستثمار المطلوبة", type: "number" },
        { key: "terms", label: "الهيكل والشروط", type: "textarea" },
                { key: "developer_id", label: "المطور", type: "select", options: o.devs },
        { key: "min_investment", label: "أقل استثمار", type: "number" },
        { key: "sort_order", label: "الترتيب", type: "number" },
        { key: "image_url", label: "الصورة", type: "image" },
        { key: "description", label: "الوصف", type: "textarea" },
        { key: "review_notes", label: "ملاحظات المراجعة / سبب الرفض", type: "textarea" },
      ]} />
    </AdminPage>
  );
}
