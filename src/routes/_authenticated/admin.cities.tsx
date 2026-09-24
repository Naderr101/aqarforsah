import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/_authenticated/admin/cities")({
  component: () => (
    <AdminPage title="المدن والمناطق">
      <CrudTable table="cities" fields={[
        { key: "name", label: "اسم المدينة", required: true },
        { key: "region", label: "المنطقة / المحافظة" },
        { key: "sort_order", label: "الترتيب", type: "number" },
        { key: "visible", label: "ظاهرة", type: "bool" },
      ]} defaults={{ visible: true }} />
    </AdminPage>
  ),
});
