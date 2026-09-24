import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "تعيين كلمة مرور جديدة | عقار فرصة" }, { name: "description", content: "اختر كلمة مرور جديدة لحسابك." }, { property: "og:title", content: "تعيين كلمة مرور جديدة | عقار فرصة" }, { property: "og:description", content: "استعادة حسابك على عقار فرصة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr("الرابط انتهى أو كلمة المرور ضعيفة. اطلب رابط جديد."); return; }
    await navigate({ to: "/dashboard/exit-requests" });
  };
  return (
    <main className="grid min-h-[70vh] place-items-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-black text-primary">كلمة مرور جديدة</h1>
        <Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="٨ حروف على الأقل" />
        {err && <p className="text-sm font-bold text-destructive">{err}</p>}
        <Button className="w-full" disabled={busy}>حفظ</Button>
      </form>
    </main>
  );
}
