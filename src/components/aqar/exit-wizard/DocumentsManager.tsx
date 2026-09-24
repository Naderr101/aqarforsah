import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, FileUp, Loader2, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createDocumentUpload, deleteDocument, getDocumentUrl, registerDocument } from "@/lib/documents.functions";
import { documentKindLabel, documentKinds, documentStatusLabel, type DocumentFile, type DocumentKind, type Documents } from "@/types/exit-request";

const required: DocumentKind[] = ["contract", "receipts"];
const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];

export function DocumentsManager({ oppId, docs, onChange, errors = {}, mode }: {
  oppId: string; docs: Documents; onChange: (d: Documents) => void; errors?: Record<string, string>; mode: "draft" | "replace" | "readonly";
}) {
  const createUpload = useServerFn(createDocumentUpload);
  const register = useServerFn(registerDocument);
  const remove = useServerFn(deleteDocument);
  const openUrl = useServerFn(getDocumentUrl);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");

  const upload = async (kind: DocumentKind, files: FileList | null, replaces?: DocumentFile) => {
    if (!files?.length) return;
    setErr("");
    let next = docs;
    for (const f of Array.from(files)) {
      if (!allowed.includes(f.type)) { setErr(`نوع الملف ${f.name} غير مدعوم (PDF أو صورة فقط).`); continue; }
      if (f.size > 15 * 1024 * 1024) { setErr(`الملف ${f.name} أكبر من ١٥ ميجا.`); continue; }
      setBusy(kind);
      try {
        const meta = { oppId, kind, fileName: f.name.slice(0, 200), mime: f.type as "application/pdf", size: f.size, ...(replaces?.id ? { replacesId: replaces.id } : {}) };
        const slot = await createUpload({ data: meta });
        const up = await supabase.storage.from("exit-documents").uploadToSignedUrl(slot.path, slot.token, f, { contentType: f.type });
        if (up.error) throw up.error;
        const row = await register({ data: { ...meta, path: slot.path } });
        const entry: DocumentFile = { id: row.id, name: f.name, size: f.size, status: row.status, version: row.version };
        const list = replaces ? next[kind].map((x) => (x.id === replaces.id ? entry : x)) : [...next[kind], entry];
        next = { ...next, [kind]: list };
        onChange(next);
      } catch (e) { setErr(e instanceof Error && e.message.length < 80 ? e.message : "تعذر رفع الملف. حاول تاني."); }
      finally { setBusy(""); }
    }
  };
  const del = async (kind: DocumentKind, f: DocumentFile) => {
    if (!f.id) { onChange({ ...docs, [kind]: docs[kind].filter((x) => x !== f) }); return; }
    try { await remove({ data: { id: f.id } }); onChange({ ...docs, [kind]: docs[kind].filter((x) => x.id !== f.id) }); }
    catch { setErr("مش ممكن حذف المستند ده."); }
  };
  const view = async (f: DocumentFile) => { if (!f.id) return; try { const { url } = await openUrl({ data: { id: f.id } }); window.open(url, "_blank", "noopener"); } catch { setErr("تعذر فتح المستند."); } };

  return (
    <div className="grid gap-4">
      {err && <p className="rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">{err}</p>}
      {documentKinds.map((k) => (
        <div key={k} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">{documentKindLabel[k]}{!required.includes(k) && <span className="mr-1 text-xs font-normal text-muted-foreground">(اختياري)</span>}</span>
            {mode !== "readonly" && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-bold hover:bg-secondary">
                {busy === k ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />} رفع ملف
                <input type="file" multiple accept="image/*,application/pdf" className="sr-only" disabled={!!busy} onChange={(e) => { void upload(k, e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          {docs[k].length > 0 && (
            <ul className="mt-3 grid gap-1">
              {docs[k].map((f, idx) => (
                <li key={f.id ?? `${f.name}-${idx}`} className="rounded bg-secondary/60 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{f.name}{f.version && f.version > 1 ? ` (نسخة ${f.version.toLocaleString("ar-EG")})` : ""}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {f.status && <span className={`rounded-full px-2 py-0.5 font-bold ${f.status === "REJECTED" || f.status === "REPLACEMENT_REQUIRED" ? "bg-destructive/10 text-destructive" : f.status === "VERIFIED" ? "bg-brand-green/15" : "bg-background"}`}>{documentStatusLabel[f.status]}</span>}
                      {f.id && <button type="button" onClick={() => void view(f)} aria-label="عرض"><Eye className="size-3.5" /></button>}
                      {mode === "draft" && f.status === "UPLOADED" && <button type="button" onClick={() => void del(k, f)} aria-label="حذف"><X className="size-3.5" /></button>}
                      {mode === "replace" && (f.status === "REJECTED" || f.status === "REPLACEMENT_REQUIRED") && (
                        <label className="inline-flex cursor-pointer items-center gap-1 font-bold text-brand-blue"><RefreshCw className="size-3.5" /> استبدال
                          <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { void upload(k, e.target.files, f); e.target.value = ""; }} />
                        </label>
                      )}
                    </span>
                  </div>
                  {f.notes && <p className="mt-1 text-muted-foreground">ملاحظة المراجع: {f.notes}</p>}
                </li>
              ))}
            </ul>
          )}
          {errors[k] && <p className="mt-2 text-xs font-bold text-destructive">{errors[k]}</p>}
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">الملفات محفوظة بشكل خاص — بتظهر لك ولفريق المراجعة بس. PDF أو صور، بحد أقصى ١٥ ميجا للملف.</p>
    </div>
  );
}
