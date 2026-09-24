import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { documentKindDb, documentKinds, type DocumentKind } from "@/types/exit-request";

const BUCKET = "exit-documents";
const mimes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"] as const;
const extFor: Record<(typeof mimes)[number], string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
const kindEnum = z.enum(documentKinds as [DocumentKind, ...DocumentKind[]]);
const meta = z.object({
  oppId: z.string().uuid(), kind: kindEnum, fileName: z.string().min(1).max(200), mime: z.enum(mimes),
  size: z.number().int().positive().max(15 * 1024 * 1024), replacesId: z.string().uuid().optional(),
}).strict();

async function audit(actor: string, action: string, entityId: string, details: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_events").insert({ actor_id: actor, action, entity_type: "document", entity_id: entityId, details: details as never });
}

/** Step 1: owner asks for a one-time upload slot inside their own private folder. */
export const createDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => meta.parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("exit_accepts_documents", { _id: data.oppId });
    if (!ok) throw new Error("مش ممكن رفع مستندات على الطلب ده دلوقتي.");
    const path = `${context.userId}/${data.oppId}/${crypto.randomUUID()}.${extFor[data.mime]}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: slot, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !slot) throw new Error("تعذر تجهيز الرفع.");
    return { path, token: slot.token };
  });

/** Step 2: register the uploaded file (ownership + status enforced by the database). */
export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => meta.extend({ path: z.string().max(300) }).strict().parse(d))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/${data.oppId}/`)) throw new Error("FORBIDDEN");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const folder = data.path.split("/").slice(0, 2).join("/");
    const name = data.path.split("/")[2]!;
    const { data: found } = await supabaseAdmin.storage.from(BUCKET).list(folder, { search: name });
    if (!found?.some((f) => f.name === name)) throw new Error("الملف لم يُرفع.");
    const { data: row, error } = await context.supabase.from("exit_documents").insert({
      exit_opportunity_id: data.oppId, owner_id: context.userId, kind: documentKindDb[data.kind] as never, storage_path: data.path,
      file_name: data.fileName, mime_type: data.mime, size_bytes: data.size, replaces_id: data.replacesId ?? null,
    }).select("id,status,version").single();
    if (error) { await supabaseAdmin.storage.from(BUCKET).remove([data.path]); throw new Error("تعذر حفظ المستند."); }
    await audit(context.userId, "document.upload", row.id, { kind: data.kind, version: row.version });
    return { id: row.id, status: row.status, version: row.version };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).strict().parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("exit_documents").delete().eq("id", data.id).eq("owner_id", context.userId).select("storage_path").maybeSingle();
    if (error || !row) throw new Error("مش ممكن حذف المستند ده.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(BUCKET).remove([row.storage_path]);
    await audit(context.userId, "document.delete", data.id, {});
    return { ok: true };
  });

/** Short-lived private link; only the owner or review staff (RLS) can obtain it. Every access is audited. */
export const getDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).strict().parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase.from("exit_documents").select("storage_path").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("NOT_FOUND");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(row.storage_path, 120);
    if (error || !signed) throw new Error("تعذر فتح المستند.");
    await audit(context.userId, "document.access", data.id, {});
    return { url: signed.signedUrl };
  });
