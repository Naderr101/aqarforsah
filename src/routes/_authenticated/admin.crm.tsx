import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";
import { useMyAccess } from "@/components/aqar/StaffGate";
import { listUsers } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/admin/crm")({ component: Crm });

const STATUS = { NEW: "جديد", CONTACTED: "تم التواصل", INTERESTED: "مهتم", PURCHASE_REQUEST: "طلب شراء", WON: "تم البيع", LOST: "خسارة" } as const;
type St = keyof typeof STATUS;
const SECTION: Record<string, string> = { exit: "فرص الخروج", "new-unit": "الوحدات الجديدة", project: "فرص المشاريع" };

function Crm() {
  const qc = useQueryClient();
  const access = useMyAccess();
  const [status, setStatus] = useState<St | "">("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const usersFn = useServerFn(listUsers);
  const agents = useQuery({ queryKey: ["admin", "agents"], enabled: !!access.data?.admin, queryFn: async () => (await usersFn()).filter((u) => u.roles.some((r) => ["SALES_AGENT", "ADMIN", "SUPER_ADMIN"].includes(r))) });

  const leads = useQuery({
    queryKey: ["admin", "leads", status, search],
    queryFn: async () => {
      let q = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
      if (status) q = q.eq("status", status);
      if (search.trim()) q = q.or(`name.ilike.%${search.trim().replace(/[%,()]/g, "")}%,phone.ilike.%${search.trim().replace(/[%,()]/g, "")}%`);
      const { data, error } = await q; if (error) throw error; return data ?? [];
    },
  });
  const upd = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: St; assigned_to?: string | null; next_follow_up?: string | null } }) => { const { error } = await supabase.from("leads").update(patch).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin", "leads"] }); },
    onError: () => toast.error("غير مسموح"),
  });

  return (
    <AdminPage title="العملاء المحتملين">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="بحث بالاسم أو الموبايل" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="h-10 rounded-md border bg-background px-2" value={status} onChange={(e) => setStatus(e.target.value as St | "")}><option value="">كل الحالات</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <div className="divide-y rounded-lg border bg-card">
        {leads.isLoading && <Loader2 className="m-6 mx-auto animate-spin" />}
        {leads.data?.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">مفيش عملاء محتملين.</p>}
        {leads.data?.map((l) => (
          <div key={l.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="min-w-0 text-start" onClick={() => setOpen(open === l.id ? null : l.id)}>
                <p className="font-bold">{l.name} · <span dir="ltr">{l.phone}</span></p>
                <p className="text-xs text-muted-foreground">{SECTION[l.section] ?? l.section} · {l.opportunity_ref} · {new Date(l.created_at).toLocaleDateString("ar-EG")}</p>
              </button>
              <div className="flex flex-wrap gap-2">
                <select className="h-9 rounded-md border bg-background px-2 text-sm" value={l.status} onChange={(e) => upd.mutate({ id: l.id, patch: { status: e.target.value as St } })}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                {access.data?.admin && <select className="h-9 rounded-md border bg-background px-2 text-sm" value={l.assigned_to ?? ""} onChange={(e) => upd.mutate({ id: l.id, patch: { assigned_to: e.target.value || null } })}><option value="">غير معيّن</option>{agents.data?.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}</select>}
                <Input type="date" className="h-9 w-40" value={l.next_follow_up ?? ""} onChange={(e) => upd.mutate({ id: l.id, patch: { next_follow_up: e.target.value || null } })} aria-label="موعد المتابعة" />
              </div>
            </div>
            {open === l.id && <LeadNotes id={l.id} message={l.message} email={l.email} />}
          </div>
        ))}
      </div>
    </AdminPage>
  );
}

function LeadNotes({ id, message, email }: { id: string; message: string; email: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const notes = useQuery({ queryKey: ["admin", "lead-notes", id], queryFn: async () => (await supabase.from("lead_notes").select("*").eq("lead_id", id).order("created_at")).data ?? [] });
  const add = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("lead_notes").insert({ lead_id: id, body: body.trim() }); if (error) throw error; },
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["admin", "lead-notes", id] }); },
    onError: () => toast.error("تعذر إضافة الملاحظة"),
  });
  return (
    <div className="mt-3 grid gap-2 rounded-md bg-secondary/50 p-3 text-sm">
      {email && <p>البريد: <span dir="ltr">{email}</span></p>}
      {message && <p className="whitespace-pre-wrap">رسالة العميل: {message}</p>}
      {notes.data?.map((n) => <p key={n.id} className="rounded bg-card p-2"><span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("ar-EG")}</span><br />{n.body}</p>)}
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="اكتب ملاحظة متابعة" />
      <Button size="sm" className="justify-self-start" disabled={!body.trim() || add.isPending} onClick={() => add.mutate()}>إضافة ملاحظة</Button>
    </div>
  );
}
