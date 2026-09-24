import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { NEW_UNIT_STATUS, PROJECT_STATUS, PROJECT_TYPES, label } from "@/components/admin/useOptions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { fmtEGP } from "@/lib/public-data";

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({ meta: [{ title: "بوابة المطور | عقار فرصة" }, { name: "description", content: "إدارة وحدات المطور وفرص المشاريع على عقار فرصة." }, { property: "og:title", content: "بوابة المطور | عقار فرصة" }, { property: "og:description", content: "إدارة مخزون الوحدات الجديدة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Portal,
});

const friendly = (m: string) => m.includes("STATUS_CHANGE_FORBIDDEN") ? "الانتقال ده غير مسموح." : m.includes("LOCKED") ? "الطلب مقفول أثناء المراجعة." : m.includes("row-level") ? "حسابك مش مربوط بالمطور ده أو مش موثق." : "تعذر الحفظ.";
type Unit = { id?: string; developer_id: string; project_id: string | null; title: string; unit_code: string; unit_type: string; area: string; bedrooms: string; bathrooms: string; floor: string; finishing: string; price: string; down_payment: string; installment_years: string; installment_plan: string; delivery: string; availability: string; image_url: string; description: string; status?: string; review_notes?: string };
const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^\d.]/g, "")));

function Portal() {
  const qc = useQueryClient();
  const mem = useQuery({ queryKey: ["dev-membership"], queryFn: async () => (await supabase.from("developer_members").select("developer_id,verified,developers(name)")).data ?? [] });
  const devIds = (mem.data ?? []).filter((m) => m.verified).map((m) => m.developer_id);
  const units = useQuery({ queryKey: ["dev-units", devIds.join()], enabled: devIds.length > 0, queryFn: async () => (await supabase.from("new_units").select("*").in("developer_id", devIds).order("created_at", { ascending: false }).limit(200)).data ?? [] });
  const projects = useQuery({ queryKey: ["dev-projects", devIds.join()], enabled: devIds.length > 0, queryFn: async () => (await supabase.from("projects").select("id,name,developer_id").in("developer_id", devIds)).data ?? [] });
  const opps = useQuery({ queryKey: ["dev-opps"], enabled: devIds.length > 0, queryFn: async () => (await supabase.from("project_opportunities").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [edit, setEdit] = useState<Unit | null>(null);

  const save = useMutation({
    mutationFn: async ({ u, submit }: { u: Unit; submit: boolean }) => {
      if (!u.title.trim()) throw new Error("اكتب عنوان الوحدة");
      const row = { developer_id: u.developer_id, project_id: u.project_id || null, title: u.title.trim().slice(0, 200), unit_code: u.unit_code, unit_type: u.unit_type, area: num(u.area), bedrooms: num(u.bedrooms), bathrooms: num(u.bathrooms), floor: u.floor, finishing: u.finishing, price: num(u.price), down_payment: num(u.down_payment), installment_years: num(u.installment_years), installment_plan: u.installment_plan, delivery: u.delivery, availability: u.availability, image_url: u.image_url, description: u.description.slice(0, 5000) };
      if (u.id) {
        const patch = submit ? { ...row, status: "PENDING_APPROVAL" as const } : row;
        const { error } = await supabase.from("new_units").update(patch).eq("id", u.id); if (error) throw new Error(friendly(error.message));
      } else {
        const { error } = await supabase.from("new_units").insert({ ...row, status: submit ? "PENDING_APPROVAL" : "DRAFT" }); if (error) throw new Error(friendly(error.message));
      }
    },
    onSuccess: (_d, v) => { toast.success(v.submit ? "اتبعتت للمراجعة" : "اتحفظت"); setEdit(null); qc.invalidateQueries({ queryKey: ["dev-units"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "PAUSED" | "UNAVAILABLE" | "PUBLISHED" | "RESERVED" | "SOLD" }) => { const { error } = await supabase.from("new_units").update({ status }).eq("id", id); if (error) throw new Error(friendly(error.message)); },
    onSuccess: () => { toast.success("اتحدثت الحالة"); qc.invalidateQueries({ queryKey: ["dev-units"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (mem.isLoading) return <Loader2 className="mx-auto my-20 animate-spin" />;
  if (!devIds.length) return <main className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-black text-primary">بوابة المطور</h1><p className="mt-3 text-muted-foreground">حسابك لسه مش مربوط بشركة تطوير موثقة. تواصل مع فريق عقار فرصة عشان يربط حسابك بعد مراجعة بيانات الشركة.</p><Button asChild className="mt-6"><Link to="/">الرئيسية</Link></Button></main>;

  const blank: Unit = { developer_id: devIds[0]!, project_id: null, title: "", unit_code: "", unit_type: "", area: "", bedrooms: "", bathrooms: "", floor: "", finishing: "", price: "", down_payment: "", installment_years: "", installment_plan: "", delivery: "", availability: "", image_url: "", description: "" };
  const toForm = (u: Record<string, unknown>): Unit => Object.fromEntries(Object.entries({ ...blank, ...u }).map(([k, v]) => [k, v == null ? (k === "project_id" ? null : "") : typeof v === "number" ? String(v) : v])) as unknown as Unit;
  const locked = edit?.status && ["PENDING_APPROVAL", "SOLD"].includes(edit.status);
  const F = ({ k, l, t }: { k: keyof Unit; l: string; t?: "area" }) => (
    <label className={`grid gap-1 text-sm font-bold ${t ? "sm:col-span-2" : ""}`}>{l}
      {t ? <Textarea disabled={!!locked} value={String(edit?.[k] ?? "")} onChange={(e) => setEdit({ ...edit!, [k]: e.target.value })} /> : <Input disabled={!!locked} value={String(edit?.[k] ?? "")} onChange={(e) => setEdit({ ...edit!, [k]: e.target.value })} />}
    </label>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black text-primary">بوابة المطور</h1><Button onClick={() => setEdit(blank)}><Plus />وحدة جديدة</Button></div>
      <p className="mt-2 text-sm text-muted-foreground">أي وحدة لازم فريق عقار فرصة يوافق عليها قبل النشر. تغيير السعر أو خطة السداد بعد الموافقة بيرجّع الوحدة للمراجعة.</p>

      {edit && (
        <form className="mt-6 grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate({ u: edit, submit: false }); }}>
          {edit.review_notes && <p className="rounded bg-secondary p-3 text-sm sm:col-span-2">ملاحظات المراجعة: {edit.review_notes}</p>}
          {locked && <p className="rounded bg-secondary p-3 text-sm sm:col-span-2">الوحدة دي {label(NEW_UNIT_STATUS, edit.status!)} ومش ممكن تتعدل دلوقتي.</p>}
          {devIds.length > 1 && <label className="grid gap-1 text-sm font-bold">المطور<select disabled={!!edit.id} className="h-10 rounded-md border bg-background px-2" value={edit.developer_id} onChange={(e) => setEdit({ ...edit, developer_id: e.target.value, project_id: null })}>{mem.data?.filter((m) => m.verified).map((m) => <option key={m.developer_id} value={m.developer_id}>{m.developers?.name}</option>)}</select></label>}
          <label className="grid gap-1 text-sm font-bold">المشروع<select disabled={!!locked} className="h-10 rounded-md border bg-background px-2" value={edit.project_id ?? ""} onChange={(e) => setEdit({ ...edit, project_id: e.target.value || null })}><option value="">—</option>{projects.data?.filter((p) => p.developer_id === edit.developer_id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <F k="title" l="عنوان الوحدة *" /><F k="unit_code" l="كود الوحدة" /><F k="unit_type" l="نوع الوحدة" /><F k="area" l="المساحة (م²)" />
          <F k="bedrooms" l="الغرف" /><F k="bathrooms" l="الحمامات" /><F k="floor" l="الدور" /><F k="finishing" l="التشطيب" />
          <F k="price" l="سعر الوحدة" /><F k="down_payment" l="المقدم" /><F k="installment_years" l="سنين التقسيط" /><F k="delivery" l="موعد الاستلام" />
          <F k="availability" l="الإتاحة" /><F k="installment_plan" l="تفاصيل خطة السداد" t="area" /><F k="description" l="الوصف" t="area" />
          <div className="grid gap-1 text-sm font-bold sm:col-span-2">الصورة<ImageUpload value={edit.image_url} onChange={(v) => setEdit({ ...edit, image_url: v })} /></div>
          {!locked && <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" variant="outline" disabled={save.isPending}>حفظ كمسودة</Button><Button type="button" disabled={save.isPending} onClick={() => save.mutate({ u: edit, submit: true })}>{save.isPending ? <Loader2 className="animate-spin" /> : "ابعت للمراجعة"}</Button><Button type="button" variant="ghost" onClick={() => setEdit(null)}>إلغاء</Button></div>}
          {locked && <Button type="button" variant="ghost" onClick={() => setEdit(null)}>إغلاق</Button>}
        </form>
      )}

      <div className="mt-6 divide-y rounded-lg border bg-card">
        {units.isLoading && <Loader2 className="m-6 mx-auto animate-spin" />}
        {units.data?.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">لسه مفيش وحدات. ابدأ بإضافة أول وحدة.</p>}
        {units.data?.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <button className="min-w-0 text-start" onClick={() => setEdit(toForm(u))}><p className="font-bold">{u.title}</p><p className="text-xs text-muted-foreground">{label(NEW_UNIT_STATUS, u.status)} · {fmtEGP(u.price, u.currency)}</p></button>
            <div className="flex flex-wrap gap-1">
              {u.status === "PUBLISHED" && <><Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "RESERVED" })}>محجوزة</Button><Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "PAUSED" })}>إيقاف مؤقت</Button><Button size="sm" variant="outline" onClick={() => { if (confirm("تأكيد إن الوحدة اتباعت؟")) setStatus.mutate({ id: u.id, status: "SOLD" }); }}>اتباعت</Button></>}
              {u.status === "RESERVED" && <><Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "PUBLISHED" })}>إلغاء الحجز</Button><Button size="sm" variant="outline" onClick={() => { if (confirm("تأكيد إن الوحدة اتباعت؟")) setStatus.mutate({ id: u.id, status: "SOLD" }); }}>اتباعت</Button></>}
              {["PAUSED", "UNAVAILABLE"].includes(u.status) && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "PUBLISHED" })}>إعادة النشر</Button>}
            </div>
          </div>
        ))}
      </div>

      <ProjectOppsSection opps={opps.data ?? []} />
    </main>
  );
}

type Opp = { id: string; title: string; status: string; opp_type: string; review_notes: string };
function ProjectOppsSection({ opps }: { opps: Opp[] }) {
  const qc = useQueryClient();
  const [f, setF] = useState<{ title: string; opp_type: string; location: string; size_sqm: string; development_status: string; investment_value: string; terms: string; description: string } | null>(null);
  const add = useMutation({
    mutationFn: async () => {
      if (!f?.title.trim()) throw new Error("اكتب عنوان الفرصة");
      const { error } = await supabase.from("project_opportunities").insert({ title: f.title.trim().slice(0, 200), opp_type: f.opp_type as "DEVELOPMENT_PROJECT", location: f.location, size_sqm: num(f.size_sqm), development_status: f.development_status, investment_value: num(f.investment_value), terms: f.terms.slice(0, 5000), description: f.description.slice(0, 5000), status: "PENDING_REVIEW" });
      if (error) throw new Error(friendly(error.message));
    },
    onSuccess: () => { toast.success("اتبعتت للمراجعة. فريقنا هيطلب مستندات الملكية."); setF(null); qc.invalidateQueries({ queryKey: ["dev-opps"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black text-primary">فرص المشاريع</h2><Button variant="outline" onClick={() => setF({ title: "", opp_type: "DEVELOPMENT_PROJECT", location: "", size_sqm: "", development_status: "", investment_value: "", terms: "", description: "" })}><Plus />قدّم فرصة</Button></div>
      {f && (
        <form className="mt-4 grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <label className="grid gap-1 text-sm font-bold">العنوان *<Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold">نوع الفرصة<select className="h-10 rounded-md border bg-background px-2" value={f.opp_type} onChange={(e) => setF({ ...f, opp_type: e.target.value })}>{PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-bold">الموقع<Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold">المساحة (م²)<Input value={f.size_sqm} onChange={(e) => setF({ ...f, size_sqm: e.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold">حالة التطوير<Input value={f.development_status} onChange={(e) => setF({ ...f, development_status: e.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold">قيمة الاستثمار المطلوبة<Input value={f.investment_value} onChange={(e) => setF({ ...f, investment_value: e.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">الهيكل والشروط<Textarea value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">الوصف<Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={add.isPending}>ابعت للمراجعة</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>إلغاء</Button></div>
        </form>
      )}
      <div className="mt-4 divide-y rounded-lg border bg-card">
        {opps.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">مفيش فرص مقدمة.</p>}
        {opps.map((o) => <div key={o.id} className="p-4"><p className="font-bold">{o.title}</p><p className="text-xs text-muted-foreground">{label(PROJECT_TYPES, o.opp_type)} · {label(PROJECT_STATUS, o.status)}</p>{o.review_notes && <p className="mt-1 text-xs">ملاحظات: {o.review_notes}</p>}</div>)}
      </div>
    </section>
  );
}
