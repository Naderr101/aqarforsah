import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_FIELDS, siteContentQuery } from "@/lib/site-content";
import { ImageUpload } from "./ImageUpload";

export function ContentEditor({ images }: { images: boolean }) {
  const qc = useQueryClient();
  const q = useQuery(siteContentQuery);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => { if (q.data) setVals(q.data); }, [q.data]);
  const fields = CONTENT_FIELDS.filter((f) => images ? ("image" in f || f.group === "الهوية") : !("image" in f));
  const groups = [...new Set(fields.map((f) => f.group))];
  const dirty = fields.filter((f) => (vals[f.key] ?? "") !== (q.data?.[f.key] ?? ""));

  const save = useMutation({
    mutationFn: async () => {
      const rows = dirty.map((f) => ({ key: f.key, value: (vals[f.key] ?? "").slice(0, 5000) }));
      const { error } = await supabase.from("site_content").upsert(rows);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحفظ وظهر في الموقع"); qc.invalidateQueries({ queryKey: ["site-content"] }); qc.invalidateQueries({ queryKey: ["content-history"] }); },
    onError: () => toast.error("تعذر الحفظ — تأكد من صلاحيتك."),
  });

  const hist = useQuery({
    queryKey: ["content-history"],
    queryFn: async () => (await supabase.from("site_content_history").select("id,key,old_value,changed_at").order("changed_at", { ascending: false }).limit(30)).data ?? [],
  });

  if (q.isLoading) return <Loader2 className="mx-auto animate-spin" />;
  return (
    <div className="grid gap-6">
      {groups.map((g) => (
        <section key={g} className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-black text-primary">{g}</h2>
          <div className="grid gap-4">
            {fields.filter((f) => f.group === g).map((f) => (
              <label key={f.key} className="grid gap-1 text-sm font-bold">
                {f.label}
                {"image" in f ? <ImageUpload value={vals[f.key] ?? ""} onChange={(v) => setVals({ ...vals, [f.key]: v })} />
                  : "long" in f ? <Textarea placeholder={f.def} value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                  : <Input placeholder={f.def} value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />}
                {!("image" in f) && <span className="text-[11px] font-normal text-muted-foreground">لو سبته فاضي، هيظهر النص الافتراضي.</span>}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="sticky bottom-3 flex items-center gap-3 rounded-lg border bg-card p-3 shadow-card">
        <Button disabled={!dirty.length || save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="animate-spin" /> : `حفظ ${dirty.length ? `(${dirty.length})` : ""}`}</Button>
        <Button variant="ghost" disabled={!dirty.length} onClick={() => setVals(q.data ?? {})}>تراجع</Button>
      </div>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-black text-primary">آخر التعديلات</h2>
        <div className="divide-y text-sm">
          {(hist.data ?? []).map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">{CONTENT_FIELDS.find((f) => f.key === h.key)?.label ?? h.key} · <span className="text-muted-foreground">{new Date(h.changed_at).toLocaleString("ar-EG")}</span></span>
              <Button size="sm" variant="ghost" onClick={() => setVals({ ...vals, [h.key]: typeof h.old_value === "string" ? h.old_value : "" })}><RotateCcw />رجوع للنسخة السابقة</Button>
            </div>
          ))}
          {!hist.data?.length && <p className="text-muted-foreground">مفيش تعديلات لسه.</p>}
        </div>
      </section>
    </div>
  );
}
