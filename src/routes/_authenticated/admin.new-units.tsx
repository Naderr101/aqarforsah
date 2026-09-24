import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";
import { useCatalogOptions, NEW_UNIT_STATUS } from "@/components/admin/useOptions";

export const Route = createFileRoute("/_authenticated/admin/new-units")({ component: Page });

function Page() {
  const o = useCatalogOptions();
  return (
    <AdminPage title="الوحدات الجديدة">
      <p className="mb-4 text-sm text-muted-foreground">الوحدة لازم تتوافق عليها قبل النشر. أي تغيير في السعر أو خطة السداد من المطور بيرجّعها للموافقة تلقائياً.</p>
      <CrudTable table="new_units" defaults={{ status: "DRAFT" }} fields={[
        { key: "title", label: "العنوان", required: true },
        { key: "city", label: "المدينة", type: "select", options: o.cities },
        { key: "status", label: "الحالة", type: "select", required: true, options: NEW_UNIT_STATUS },
        { key: "price", label: "سعر الوحدة", type: "number" },
        { key: "developer_id", label: "المطور", type: "select", options: o.devs },
        { key: "project_id", label: "المشروع", type: "select", options: o.projs },
        { key: "unit_code", label: "كود الوحدة" },
        { key: "unit_type", label: "نوع الوحدة" },
        { key: "bathrooms", label: "الحمامات", type: "number" },
        { key: "floor", label: "الدور" },
        { key: "finishing", label: "التشطيب" },
        { key: "installment_plan", label: "خطة التقسيط" },
        { key: "availability", label: "الإتاحة" },
        { key: "area", label: "المساحة (م²)", type: "number" },
        { key: "bedrooms", label: "الغرف", type: "number" },
        { key: "down_payment", label: "المقدم", type: "number" },
        { key: "installment_years", label: "سنين التقسيط", type: "number" },
        { key: "delivery", label: "الاستلام" },
        { key: "sort_order", label: "الترتيب", type: "number" },
        { key: "image_url", label: "الصورة", type: "image" },
        { key: "description", label: "الوصف", type: "textarea" },
        { key: "review_notes", label: "ملاحظات المراجعة (تظهر للمطور)", type: "textarea" },
      ]} />
    </AdminPage>
  );
}
