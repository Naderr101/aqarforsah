import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/policies")({ component: Page });

const KINDS = { TERMS: "الشروط والأحكام", PRIVACY: "سياسة الخصوصية", FEES: "سياسة الرسوم", CANCELLATION: "سياسة الإلغاء" } as const;
type K = keyof typeof KINDS;

function Page() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<K>("TERMS");
  const [body, setBody] = useState("");
  const list = useQuery({ queryKey: ["admin", "policies"], queryFn: async () => (await supabase.from("policy_versions").select("id,kind,version,published,created_at,body").order("version", { ascending: false })).data ?? [] });
  const reqs = useQuery({ queryKey: ["admin", "privacy"], queryFn: async () => (await supabase.from("privacy_requests").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  const create = useMutation({
    mutationFn: async () => {
      const next = Math.max(0, ...(list.data ?? []).filter((p) => p.kind === kind).map((p) => p.version)) + 1;
      const { error } = await supabase.from("policy_versions").insert({ kind, version: next, body: body.trim() }); if (error) throw error;
    },
    onSuccess: () => { toast.success("اتحفظت كنسخة جديدة (غير منشورة)"); setBody(""); qc.invalidateQueries({ queryKey: ["admin", "policies"] }); },
    onError: () => toast.error("تعذر الحفظ"),
  });
  const publish = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("policy_versions").update({ published: true }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("اتنشرت"); qc.invalidateQueries({ queryKey: ["admin", "policies"] }); },
  });
  const handle = useMutation({
    mutationFn: async (p: { id: string; status?: "IN_PROGRESS" | "COMPLETED" | "REJECTED"; legal_hold?: boolean; decision?: string }) => { const { id, ...patch } = p; const { error } = await supabase.from("privacy_requests").update(patch).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("اتحدث"); qc.invalidateQueries({ queryKey: ["admin", "privacy"] }); },
  });
  return (
    <AdminPage title="السياسات والخصوصية">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-black text-primary">نسخة جديدة من سياسة</h2>
        <p className="mt-1 text-xs text-muted-foreground">النسخ المنشورة ما بتتعدلش. أي تعديل بيبقى نسخة جديدة، وبنحتفظ بمين وافق على أنهي نسخة وإمتى.</p>
        <select className="mt-3 h-10 rounded-md border bg-background px-2" value={kind} onChange={(e) => setKind(e.target.value as K)}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Textarea className="mt-3 min-h-40" value={body} onChange={(e) => setBody(e.target.value)} placeholder="نص السياسة" />
        <Button className="mt-3" disabled={body.trim().length < 20 || create.isPending} onClick={() => create.mutate()}>حفظ كنسخة جديدة</Button>
      </section>
      <section className="mt-6 divide-y rounded-lg border bg-card">
        {list.data?.length === 0 && <p className="p-5 text-sm text-muted-foreground">مفيش سياسات لسه.</p>}
        {list.data?.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <details className="min-w-0"><summary className="cursor-pointer font-bold">{KINDS[p.kind as K]} — نسخة {p.version} {p.published ? "· منشورة" : "· مسودة"}</summary><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{p.body}</p></details>
            {!p.published && <Button size="sm" onClick={() => { if (confirm("النشر نهائي ومش ممكن التعديل بعده. نكمل؟")) publish.mutate(p.id); }}>نشر</Button>}
          </div>
        ))}
      </section>
      <h2 className="mt-8 mb-3 text-xl font-black text-primary">طلبات الخصوصية</h2>
      <div className="divide-y rounded-lg border bg-card">
        {reqs.data?.length === 0 && <p className="p-5 text-sm text-muted-foreground">مفيش طلبات.</p>}
        {reqs.data?.map((r) => (
          <div key={r.id} className="grid gap-2 p-4 text-sm">
            <p className="font-bold">{{ EXPORT: "نسخة من البيانات", CORRECTION: "تصحيح بيانات", DELETION: "حذف البيانات" }[r.kind]} · {new Date(r.created_at).toLocaleDateString("ar-EG")} · {r.status}</p>
            {r.details && <p className="text-muted-foreground">{r.details}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <select className="h-9 rounded-md border bg-background px-2" value={r.status} onChange={(e) => handle.mutate({ id: r.id, status: e.target.value as "COMPLETED" })}><option value="OPEN">مفتوح</option><option value="IN_PROGRESS">جاري</option><option value="COMPLETED">تم</option><option value="REJECTED">مرفوض</option></select>
              <label className="flex items-center gap-1"><input type="checkbox" checked={r.legal_hold} onChange={(e) => handle.mutate({ id: r.id, legal_hold: e.target.checked })} />حجز قانوني</label>
              <Button size="sm" variant="ghost" onClick={() => { const d = prompt("القرار (مثلاً: إخفاء الهوية مع الاحتفاظ بسجلات المعاملات والتحقق):", r.decision); if (d != null) handle.mutate({ id: r.id, decision: d.slice(0, 1000) }); }}>القرار</Button>
            </div>
            {r.decision && <p className="text-xs">القرار: {r.decision}</p>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">سجلات التحقق والمدفوعات والعمليات المالية وسجل العمليات ما بتتمسحش أبداً، حتى مع طلب الحذف. بيتم إخفاء هوية صاحبها بس.</p>
    </AdminPage>
  );
}
