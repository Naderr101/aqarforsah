import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account/privacy")({
  head: () => ({ meta: [{ title: "بياناتي والخصوصية | عقار فرصة" }, { name: "description", content: "نزّل نسخة من بياناتك أو اطلب تصحيحها أو حذفها." }, { property: "og:title", content: "بياناتي والخصوصية | عقار فرصة" }, { property: "og:description", content: "التحكم في بياناتك على عقار فرصة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const KIND = { EXPORT: "نسخة من البيانات", CORRECTION: "تصحيح بيانات", DELETION: "حذف البيانات" } as const;
const STATUS: Record<string, string> = { OPEN: "مفتوح", IN_PROGRESS: "جاري", COMPLETED: "تم", REJECTED: "مرفوض" };

function Page() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<keyof typeof KIND>("CORRECTION");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const reqs = useQuery({ queryKey: ["my-privacy"], queryFn: async () => (await supabase.from("privacy_requests").select("*").order("created_at", { ascending: false })).data ?? [] });
  const create = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("privacy_requests").insert({ kind, details: details.slice(0, 2000) }); if (error) throw error; },
    onSuccess: () => { toast.success("اتسجل طلبك"); setDetails(""); qc.invalidateQueries({ queryKey: ["my-privacy"] }); },
    onError: () => toast.error("تعذر إرسال الطلب"),
  });
  async function exportData() {
    setBusy(true);
    const [p, e, u, c, pay, docs, acc] = await Promise.all([
      supabase.from("profiles").select("*"), supabase.from("exit_opportunities").select("*"), supabase.from("units").select("*"),
      supabase.from("contracts").select("*"), supabase.from("payment_records").select("*"), supabase.from("exit_documents").select("kind,status,file_name,created_at"),
      supabase.from("policy_acceptances").select("*"),
    ]);
    setBusy(false);
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), profile: p.data, exit_requests: e.data, units: u.data, contracts: c.data, payments: pay.data, documents: docs.data, policy_acceptances: acc.data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aqar-forsah-my-data.json"; a.click(); URL.revokeObjectURL(a.href);
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-black text-primary">بياناتي والخصوصية</h1>
      <section className="mt-6 rounded-lg border bg-card p-5">
        <h2 className="font-black">نسخة من بياناتك</h2>
        <p className="mt-1 text-sm text-muted-foreground">نزّل ملف فيه كل بياناتك المسجلة على المنصة.</p>
        <Button className="mt-3" variant="outline" disabled={busy} onClick={exportData}>{busy ? <Loader2 className="animate-spin" /> : <Download />}تنزيل بياناتي</Button>
      </section>
      <section className="mt-6 rounded-lg border bg-card p-5">
        <h2 className="font-black">طلب تصحيح أو حذف</h2>
        <select className="mt-3 h-10 rounded-md border bg-background px-2" value={kind} onChange={(e) => setKind(e.target.value as keyof typeof KIND)}>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Textarea className="mt-3" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اشرح طلبك" maxLength={2000} />
        <p className="mt-2 text-xs text-muted-foreground">لازم نحتفظ ببعض السجلات قانونياً، زي سجلات التحقق والمدفوعات والعمليات. في الحالة دي بنخفي هويتك بدل ما نمسحها.</p>
        <Button className="mt-3" disabled={create.isPending} onClick={() => create.mutate()}>إرسال الطلب</Button>
      </section>
      <section className="mt-6 divide-y rounded-lg border bg-card">
        {reqs.data?.length === 0 && <p className="p-5 text-sm text-muted-foreground">مفيش طلبات سابقة.</p>}
        {reqs.data?.map((r) => <div key={r.id} className="p-4 text-sm"><p className="font-bold">{KIND[r.kind]} · {STATUS[r.status]}</p>{r.decision && <p className="text-muted-foreground">{r.decision}</p>}</div>)}
      </section>
    </main>
  );
}
