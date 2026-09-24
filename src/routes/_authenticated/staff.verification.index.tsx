import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StaffGate, StaffNav } from "@/components/aqar/StaffGate";
import { listVerificationQueue } from "@/lib/staff.functions";
import { exitStatusLabel, type ExitStatus } from "@/types/exit-request";

export const Route = createFileRoute("/_authenticated/staff/verification/")({
  head: () => ({ meta: [{ title: "طابور المراجعة | عقار فرصة" }, { name: "description", content: "مراجعة وتوثيق طلبات الخروج." }, { property: "og:title", content: "طابور المراجعة | عقار فرصة" }, { property: "og:description", content: "لفريق المراجعة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <main className="mx-auto max-w-6xl px-4 py-8"><h1 className="mb-4 text-2xl font-black text-primary">لوحة المراجعة</h1><StaffGate><StaffNav /><Queue /></StaffGate></main>,
});

const filters: Array<[string, ExitStatus[]]> = [
  ["مفتوحة", ["pending_review", "under_verification", "documents_required"]],
  ["تم التحقق", ["verified"]], ["منشورة", ["published"]], ["مرفوضة", ["rejected"]],
];

function Queue() {
  const fn = useServerFn(listVerificationQueue);
  const q = useQuery({ queryKey: ["verification-queue"], queryFn: () => fn() });
  const [f, setF] = useState(0);
  if (q.isLoading) return <div className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  if (q.isError) return <p className="text-sm text-destructive">تعذر تحميل الطابور.</p>;
  const rows = (q.data ?? []).filter((r) => filters[f]![1].includes(r.status as ExitStatus));
  return (
    <>
      <div className="mb-3 flex gap-2">{filters.map(([l], i) => <Button key={l} size="sm" variant={i === f ? "default" : "outline"} onClick={() => setF(i)}>{l}</Button>)}</div>
      {!rows.length ? <div className="rounded-lg border border-dashed bg-card py-12 text-center text-sm text-muted-foreground">مفيش طلبات هنا.</div> : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary/60 text-xs text-muted-foreground"><tr>{["المشروع", "الوحدة", "تاريخ الإرسال", "الحالة", ""].map((h) => <th key={h} className="px-4 py-3 text-right">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-bold">{r.project}<span className="block text-xs font-normal text-muted-foreground">{r.developer}</span></td>
                  <td className="px-4 py-3">{r.unit || "—"}</td>
                  <td className="px-4 py-3">{r.submittedAt ? new Date(r.submittedAt).toLocaleString("ar-EG") : "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold">{exitStatusLabel[r.status as ExitStatus]}</span></td>
                  <td className="px-4 py-3 text-left"><Button size="sm" asChild><Link to="/staff/verification/$id" params={{ id: r.id }}>فتح الملف</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
