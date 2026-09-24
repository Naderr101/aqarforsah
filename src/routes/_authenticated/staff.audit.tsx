import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { StaffGate, StaffNav } from "@/components/aqar/StaffGate";
import { listAudit } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/staff/audit")({
  head: () => ({ meta: [{ title: "سجل العمليات | عقار فرصة" }, { name: "description", content: "سجل غير قابل للتعديل للعمليات الحساسة." }, { property: "og:title", content: "سجل العمليات | عقار فرصة" }, { property: "og:description", content: "للإدارة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <main className="mx-auto max-w-6xl px-4 py-8"><h1 className="mb-4 text-2xl font-black text-primary">لوحة المراجعة</h1><StaffGate admin><StaffNav /><Audit /></StaffGate></main>,
});

function Audit() {
  const fn = useServerFn(listAudit);
  const q = useQuery({ queryKey: ["audit"], queryFn: () => fn() });
  if (q.isLoading) return <div className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  if (q.isError) return <p className="text-sm text-destructive">تعذر التحميل.</p>;
  if (!q.data?.length) return <p className="rounded-lg border border-dashed bg-card py-12 text-center text-sm text-muted-foreground">لا توجد عمليات مسجلة بعد.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
      <table className="w-full min-w-[720px] text-xs">
        <thead className="bg-secondary/60 text-muted-foreground"><tr>{["الوقت", "العملية", "العنصر", "المنفّذ", "التفاصيل"].map((h) => <th key={h} className="px-3 py-2 text-right">{h}</th>)}</tr></thead>
        <tbody className="divide-y">
          {q.data.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString("ar-EG")}</td>
              <td className="px-3 py-2 font-bold" dir="ltr">{e.action}</td>
              <td className="px-3 py-2" dir="ltr">{e.entity_type}:{e.entity_id?.slice(0, 8)}</td>
              <td className="px-3 py-2" dir="ltr">{e.actor_id?.slice(0, 8) ?? "system"}</td>
              <td className="px-3 py-2 font-mono" dir="ltr">{JSON.stringify(e.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
