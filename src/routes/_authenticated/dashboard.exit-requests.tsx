import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/aqar/DashboardLayout";
import { Button } from "@/components/ui/button";
import { listMyExitRequests } from "@/lib/exit-drafts.functions";
import { exitStatusLabel } from "@/types/exit-request";

export const Route = createFileRoute("/_authenticated/dashboard/exit-requests")({
  head: () => ({ meta: [
    { title: "طلبات الخروج | عقار فرصة" },
    { name: "description", content: "تابع مسودات وطلبات الخروج من وحداتك وحالتها." },
    { property: "og:title", content: "طلبات الخروج | عقار فرصة" },
    { property: "og:description", content: "إدارة طلبات الخروج من حسابك." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const fmt = (iso: string) => new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

function Page() {
  const list = useServerFn(listMyExitRequests);
  const q = useQuery({ queryKey: ["my-exit-requests"], queryFn: () => list() });
  return (
    <DashboardLayout title="طلبات الخروج">
      <div className="mb-4 flex justify-end"><Button asChild><Link to="/sell-exit/new"><Plus /> طلب خروج جديد</Link></Button></div>
      {q.isLoading ? <div className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>
        : q.isError ? <p className="text-sm text-destructive">تعذر تحميل الطلبات.</p>
        : !q.data?.length ? (
          <div className="rounded-lg border border-dashed bg-card py-14 text-center"><p className="font-bold">مفيش طلبات خروج لسه</p><p className="mt-1 text-sm text-muted-foreground">ابدأ طلبك وهيتحفظ هنا كمسودة.</p></div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-secondary/60 text-xs text-muted-foreground"><tr>{["المشروع", "الوحدة", "تاريخ الإنشاء", "الحالة", "آخر تحديث", ""].map((h) => <th key={h} className="px-4 py-3 text-right font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {q.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-bold">{r.project || "لم يُحدد بعد"}<span className="block text-xs font-normal text-muted-foreground">{r.developer}</span></td>
                    <td className="px-4 py-3">{r.unit || "—"}</td>
                    <td className="px-4 py-3">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.status === "draft" ? "bg-secondary" : "bg-brand-yellow/20"}`}>{exitStatusLabel[r.status]}</span></td>
                    <td className="px-4 py-3">{fmt(r.updatedAt)}</td>
                    <td className="px-4 py-3 text-left">
                      {r.status === "draft"
                        ? <Button size="sm" asChild><Link to="/sell-exit/new" search={{ id: r.id }}>كمّل الطلب</Link></Button>
                        : <Button size="sm" variant="outline" asChild><Link to="/sell-exit/status" search={{ id: r.id }}>عرض الحالة</Link></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </DashboardLayout>
  );
}
