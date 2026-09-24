import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";
import { listUsers, setRole } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/admin/developer-access")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const usersFn = useServerFn(listUsers); const roleFn = useServerFn(setRole);
  const users = useQuery({ queryKey: ["admin", "users-all"], queryFn: () => usersFn() });
  const devs = useQuery({ queryKey: ["admin", "developers", "opts"], queryFn: async () => (await supabase.from("developers").select("id,name").order("name")).data ?? [] });
  const mem = useQuery({ queryKey: ["admin", "members"], queryFn: async () => (await supabase.from("developer_members").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [u, setU] = useState(""); const [d, setD] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("developer_members").insert({ user_id: u, developer_id: d, verified: true }); if (error) throw error;
      if (!users.data?.find((x) => x.id === u)?.roles.includes("DEVELOPER")) await roleFn({ data: { userId: u, role: "DEVELOPER", grant: true } });
    },
    onSuccess: () => { toast.success("اتربط الحساب بالمطور"); setU(""); qc.invalidateQueries({ queryKey: ["admin", "members"] }); qc.invalidateQueries({ queryKey: ["admin", "users-all"] }); },
    onError: () => toast.error("تعذر الربط — ممكن يكون مربوط بالفعل."),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("developer_members").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("اتشال الربط"); qc.invalidateQueries({ queryKey: ["admin", "members"] }); },
  });
  const name = (id: string) => { const x = users.data?.find((y) => y.id === id); return x?.full_name || x?.email || id.slice(0, 8); };
  return (
    <AdminPage title="حسابات المطورين">
      <p className="mb-4 text-sm text-muted-foreground">اربط حساب مستخدم بشركة تطوير بعد ما تراجع بياناتها. الحساب المربوط يقدر يدير وحدات شركته بس من "بوابة المطور".</p>
      <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-4">
        <select className="h-10 min-w-48 rounded-md border bg-background px-2" value={u} onChange={(e) => setU(e.target.value)}><option value="">اختر المستخدم</option>{users.data?.map((x) => <option key={x.id} value={x.id}>{x.full_name || x.email}</option>)}</select>
        <select className="h-10 min-w-48 rounded-md border bg-background px-2" value={d} onChange={(e) => setD(e.target.value)}><option value="">اختر المطور</option>{devs.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <Button disabled={!u || !d || add.isPending} onClick={() => add.mutate()}>ربط وتوثيق</Button>
      </div>
      <div className="mt-4 divide-y rounded-lg border bg-card">
        {mem.data?.length === 0 && <p className="p-5 text-sm text-muted-foreground">مفيش حسابات مطورين مربوطة.</p>}
        {mem.data?.map((m) => <div key={m.id} className="flex items-center justify-between p-3 text-sm"><span>{name(m.user_id)} ← {devs.data?.find((x) => x.id === m.developer_id)?.name ?? m.developer_id}</span><Button size="icon" variant="ghost" aria-label="إزالة" onClick={() => { if (confirm("إزالة الربط؟")) del.mutate(m.id); }}><Trash2 /></Button></div>)}
      </div>
    </AdminPage>
  );
}
