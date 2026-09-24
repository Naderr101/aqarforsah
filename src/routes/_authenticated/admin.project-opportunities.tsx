import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";
import { useCatalogOptions } from "@/components/admin/useOptions";

export const Route = createFileRoute("/_authenticated/admin/project-opportunities")({ component: Page });

function Page() {
  const o = useCatalogOptions();
  return (
    <AdminPage title="فرص المشاريع">
      <CrudTable table="project_opportunities" fields={[
        { key: "title", label: "العنوان", required: true },
        { key: "city", label: "المدينة", type: "select", options: o.cities },
        { key: "published", label: "منشورة", type: "bool" },
        { key: "stage", label: "المرحلة" },
        { key: "developer_id", label: "المطور", type: "select", options: o.devs },
        { key: "min_investment", label: "أقل استثمار", type: "number" },
        { key: "sort_order", label: "الترتيب", type: "number" },
        { key: "image_url", label: "الصورة", type: "image" },
        { key: "description", label: "الوصف", type: "textarea" },
      ]} />
    </AdminPage>
  );
}
