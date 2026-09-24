import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";
import { useCatalogOptions } from "@/components/admin/useOptions";

export const Route = createFileRoute("/_authenticated/admin/new-units")({ component: Page });

function Page() {
  const o = useCatalogOptions();
  return (
    <AdminPage title="الوحدات الجديدة">
      <CrudTable table="new_units" fields={[
        { key: "title", label: "العنوان", required: true },
        { key: "city", label: "المدينة", type: "select", options: o.cities },
        { key: "published", label: "منشورة", type: "bool" },
        { key: "price", label: "السعر", type: "number" },
        { key: "developer_id", label: "المطور", type: "select", options: o.devs },
        { key: "project_id", label: "المشروع", type: "select", options: o.projs },
        { key: "unit_type", label: "نوع الوحدة" },
        { key: "area", label: "المساحة (م²)", type: "number" },
        { key: "bedrooms", label: "الغرف", type: "number" },
        { key: "down_payment", label: "المقدم", type: "number" },
        { key: "installment_years", label: "سنين التقسيط", type: "number" },
        { key: "delivery", label: "الاستلام" },
        { key: "sort_order", label: "الترتيب", type: "number" },
        { key: "image_url", label: "الصورة", type: "image" },
        { key: "description", label: "الوصف", type: "textarea" },
      ]} />
    </AdminPage>
  );
}
