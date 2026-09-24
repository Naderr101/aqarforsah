import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "./ImageUpload";

export type Field = {
  key: string; label: string;
  type?: "text" | "number" | "bool" | "textarea" | "select" | "image";
  options?: { value: string; label: string }[];
  required?: boolean; list?: boolean;
};
type Row = Record<string, unknown> & { id: string };

// Any table name from the managed set; RLS enforces admin + 2FA on every write.
type Managed = "nav_sections" | "cities" | "new_units" | "project_opportunities" | "form_fields" | "developers" | "projects" | "phases" | "buildings";

export function CrudTable({ table, fields, orderBy = "sort_order", filter, defaults = {}, textId }: {
  table: Managed; fields: Field[]; orderBy?: string; filter?: [string, string]; defaults?: Record<string, unknown>; textId?: boolean;
}) {
  const qc = useQueryClient();
  const key = ["admin", table, filter?.join("=") ?? ""];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      let r = supabase.from(table).select("*");
      if (filter) r = r.eq(filter[0], filter[1]);
      const { data, error } = await r.order(orderBy);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);

  const save = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const clean: Record<string, unknown> = { ...defaults };
      for (const f of fields) {
        let v = row[f.key];
        if (f.type === "number") v = v === "" || v == null ? null : Number(v);
        if (f.type === "bool") v = !!v;
        if (f.required && (v == null || v === "")) throw new Error(`${f.label} مطلوب`);
        clean[f.key] = v ?? (f.type === "number" ? null : f.type === "bool" ? false : "");
      }
      const tb = supabase.from(table) as unknown as { insert: (v: unknown) => Promise<{ error: Error | null }>; update: (v: unknown) => { eq: (k: string, v: unknown) => Promise<{ error: Error | null }> } };
      if (row["id"] && !row["__new"]) {
        const { error } = await tb.update(clean).eq("id", row["id"]); if (error) throw error;
      } else {
        if (textId) clean["id"] = String(row["id"] ?? "").trim() || crypto.randomUUID().slice(0, 8);
        const { error } = await tb.insert(clean); if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("تم الحفظ"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin", table] }); qc.invalidateQueries({ queryKey: ["nav-sections"] }); },
    onError: (e: Error) => toast.error(e.message.includes("row-level") ? "غير مسموح" : e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin", table] }); },
    onError: () => toast.error("تعذر الحذف — ممكن يكون مرتبط ببيانات تانية."),
  });

  const listFields = fields.filter((f) => f.list !== false).slice(0, 4);
  const show = (f: Field, v: unknown) => f.type === "bool" ? (v ? "نعم" : "لا") : f.type === "image" ? (v ? "✓" : "—") : f.options ? f.options.find((o) => o.value === v)?.label ?? String(v ?? "") : String(v ?? "");

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex justify-end border-b p-3"><Button size="sm" onClick={() => setEdit({ __new: true, ...defaults })}><Plus />إضافة</Button></div>
      {edit && (
        <form className="grid gap-3 border-b bg-secondary/40 p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
          {textId && !!edit["__new"] && <label className="grid gap-1 text-sm font-bold">المعرّف (إنجليزي بدون مسافات)<Input dir="ltr" value={String(edit["id"] ?? "")} onChange={(e) => setEdit({ ...edit, id: e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} /></label>}
          {fields.map((f) => (
            <label key={f.key} className={`grid gap-1 text-sm font-bold ${f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}`}>
              {f.label}{f.required && " *"}
              {f.type === "bool" ? <input type="checkbox" className="size-5" checked={!!edit[f.key]} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.checked })} />
                : f.type === "textarea" ? <Textarea value={String(edit[f.key] ?? "")} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} />
                : f.type === "select" ? <select className="h-10 rounded-md border bg-background px-2" value={String(edit[f.key] ?? "")} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value || null })}><option value="">—</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                : f.type === "image" ? <ImageUpload value={String(edit[f.key] ?? "")} onChange={(url) => setEdit({ ...edit, [f.key]: url })} />
                : <Input type={f.type === "number" ? "number" : "text"} value={String(edit[f.key] ?? "")} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} />}
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : "حفظ"}</Button><Button type="button" variant="ghost" onClick={() => setEdit(null)}>إلغاء</Button></div>
        </form>
      )}
      {q.isLoading ? <Loader2 className="m-6 mx-auto animate-spin" /> : (
        <div className="divide-y">
          {(q.data ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">مفيش بيانات لسه.</p>}
          {(q.data ?? []).map((r) => (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3">
              <div className="grid min-w-0 gap-1 text-sm sm:grid-cols-4">{listFields.map((f, i) => <span key={f.key} className={i === 0 ? "truncate font-bold" : "truncate text-muted-foreground"}>{show(f, r[f.key])}</span>)}</div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setEdit({ ...r })}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label="حذف" onClick={() => { if (confirm("متأكد من الحذف؟")) del.mutate(r.id); }}><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
