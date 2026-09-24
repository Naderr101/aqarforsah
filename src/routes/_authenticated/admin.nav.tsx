import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/_authenticated/admin/nav")({
  component: () => (
    <AdminPage title="الأقسام والقوائم">
      <p className="mb-4 text-sm text-muted-foreground">الروابط اللي بتظهر في قائمة الموقع العلوية. غيّر الاسم أو الترتيب أو اخفي أي قسم.</p>
      <CrudTable table="nav_sections" fields={[
        { key: "label", label: "الاسم", required: true },
        { key: "href", label: "الرابط", required: true, type: "select", options: [
          { value: "/exit-opportunities", label: "فرص الخروج" }, { value: "/new-units", label: "الوحدات الجديدة" },
          { value: "/project-opportunities", label: "فرص المشاريع" }, { value: "/sell-exit", label: "عايز تخرج من وحدتك؟" }, { value: "/favorites", label: "المفضلة" } ] },
        { key: "sort_order", label: "الترتيب", type: "number" },
        { key: "visible", label: "ظاهر", type: "bool" },
      ]} defaults={{ visible: true }} />
    </AdminPage>
  ),
});
