import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/controls")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "flags"], queryFn: async () => (await supabase.from("feature_flags").select("*").order("key")).data ?? [] });
  const m = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => { const { error } = await supabase.from("feature_flags").update({ enabled }).eq("key", key); if (error) throw error; },
    onSuccess: () => { toast.success("اتغيّر"); qc.invalidateQueries({ queryKey: ["admin", "flags"] }); qc.invalidateQueries({ queryKey: ["flags"] }); },
    onError: () => toast.error("غير مسموح"),
  });
  return (
    <AdminPage title="المفاتيح والطوارئ">
      <p className="mb-4 text-sm text-muted-foreground">شغّل أو اقفل أجزاء من الموقع فوراً. كل تغيير بيتسجل في سجل العمليات. وضع الصيانة بيقفل الموقع للزوار، ولوحة التحكم بتفضل شغالة.</p>
      <div className="divide-y rounded-lg border bg-card">
        {q.isLoading && <Loader2 className="m-6 mx-auto animate-spin" />}
        {q.data?.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-3 p-4">
            <span className="font-bold">{f.label || f.key}{f.key === "maintenance_mode" && <span className="mr-2 text-xs text-destructive">طوارئ</span>}</span>
            <input type="checkbox" className="size-5" checked={f.enabled} disabled={m.isPending} onChange={(e) => { if (f.key === "maintenance_mode" && e.target.checked && !confirm("قفل الموقع للزوار؟")) return; m.mutate({ key: f.key, enabled: e.target.checked }); }} />
          </label>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">لإيقاف إعلان بعينه: من صفحة الوحدات أو فرص المشاريع غيّر حالته لـ "موقوفة". ولفرص الخروج: من ملف الحالة رجّعها "قيد التحقق". ولإيقاف حساب: من صفحة المستخدمين.</p>
    </AdminPage>
  );
}
