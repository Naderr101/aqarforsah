import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffGate, StaffNav } from "@/components/aqar/StaffGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/staff/settings")({
  head: () => ({ meta: [{ title: "إعدادات المنصة | عقار فرصة" }, { name: "description", content: "رسوم ومدد المنصة." }, { property: "og:title", content: "إعدادات المنصة | عقار فرصة" }, { property: "og:description", content: "للإدارة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <main className="mx-auto max-w-6xl px-4 py-8"><h1 className="mb-4 text-2xl font-black text-primary">لوحة المراجعة</h1><StaffGate admin><StaffNav /><Settings /></StaffGate></main>,
});

function Settings() {
  const q = useQuery({ queryKey: ["settings"], queryFn: async () => { const { data, error } = await supabase.from("platform_settings").select("key,value,description").order("key"); if (error) throw error; return data; } });
  if (q.isLoading) return <div className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  if (q.isError) return <p className="text-sm text-destructive">تعذر التحميل.</p>;
  return <div className="grid gap-2">{q.data!.map((s) => <Row key={s.key} s={s} />)}<p className="text-xs text-muted-foreground">كل تغيير بيتسجل في سجل العمليات. النسب تُكتب كرقم عشري (مثلاً 0.0125 = ١٫٢٥٪).</p></div>;
}

function Row({ s }: { s: { key: string; value: unknown; description: string } }) {
  const qc = useQueryClient();
  const initial = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
  const [v, setV] = useState(initial); const [msg, setMsg] = useState("");
  const save = async () => {
    setMsg("");
    const value = typeof s.value === "string" ? v : (() => { try { return JSON.parse(v); } catch { return undefined; } })();
    if (value === undefined) { setMsg("قيمة غير صحيحة"); return; }
    if (s.key.endsWith("_rate") && !/^0(\.\d{1,6})?$|^1$/.test(String(value))) { setMsg("النسبة لازم تكون بين 0 و 1"); return; }
    const { error } = await supabase.from("platform_settings").update({ value }).eq("key", s.key);
    setMsg(error ? "غير مسموح" : "تم الحفظ"); await qc.invalidateQueries({ queryKey: ["settings"] });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3 text-sm">
      <span className="min-w-64 flex-1"><b>{s.description || s.key}</b><span className="block text-[11px] text-muted-foreground" dir="ltr">{s.key}</span></span>
      <Input className="w-48" dir="ltr" value={v} onChange={(e) => setV(e.target.value)} />
      <Button size="sm" onClick={save} disabled={v === initial}>حفظ</Button>
      {msg && <span className="text-xs font-bold">{msg}</span>}
    </div>
  );
}
