import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/_authenticated/admin/forms")({
  component: () => (
    <AdminPage title="النماذج">
      <p className="mb-4 text-sm text-muted-foreground">حقول نموذج "مهتم بالفرصة": غيّر التسمية، اجعل الحقل إجباري، أو اخفيه. الاسم والموبايل دايماً إجباريين عشان نقدر نتواصل.</p>
      <CrudTable table="form_fields" filter={["form", "interest"]} defaults={{ form: "interest" }} fields={[
        { key: "label", label: "التسمية", required: true },
        { key: "field_key", label: "الحقل", type: "select", required: true, options: [{ value: "name", label: "الاسم" }, { value: "phone", label: "الموبايل" }, { value: "email", label: "البريد" }, { value: "message", label: "رسالة" }] },
        { key: "required", label: "إجباري", type: "bool" },
        { key: "visible", label: "ظاهر", type: "bool" },
        { key: "sort_order", label: "الترتيب", type: "number" },
      ]} />
    </AdminPage>
  ),
});
