import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, CheckCircle2, Loader2, LockKeyhole, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "login" | "register" | "forgot";
const content = {
  login: { title: "أهلاً بعودتك", text: "سجل الدخول لمتابعة طلبات الخروج وفرصك.", button: "تسجيل الدخول" },
  register: { title: "أنشئ حسابك", text: "انضم إلى عقار فرصة وابدأ طلب الخروج من وحدتك.", button: "إنشاء الحساب" },
  forgot: { title: "استعادة كلمة المرور", text: "هنبعتلك رابط آمن لاستعادة حسابك.", button: "إرسال رابط الاستعادة" },
};

export const safeRedirect = (r: string | undefined) => (r && r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard/exit-requests");

export function AuthPage({ mode, redirect }: { mode: Mode; redirect?: string | undefined }) {
  const c = content[mode];
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const target = safeRedirect(redirect);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: target });
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${target}`, data: { full_name: name } } });
        if (error) throw error;
        if (data.session) await navigate({ to: target });
        else setNotice("بعتنالك رابط تأكيد على بريدك. افتحه علشان تفعّل حسابك.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("لو البريد مسجل عندنا، هيوصلك رابط الاستعادة خلال دقائق.");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setError(m.includes("Invalid login") ? "البريد أو كلمة المرور غير صحيحة." : m.includes("already registered") ? "البريد ده مسجل بالفعل." : m.includes("Password") ? "كلمة المرور ضعيفة — استخدم ٨ حروف على الأقل." : "حصل خطأ، حاول تاني.");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setError("");
    try { sessionStorage.setItem("aqar-post-login", target); } catch { /* ignore */ }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { setError("تعذر تسجيل الدخول بجوجل."); return; }
    if (r.redirected) return;
    await navigate({ to: target });
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-secondary">
      <div className="mx-auto grid max-w-6xl items-stretch lg:grid-cols-2">
        <section className="hidden min-h-[650px] bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <Building2 className="size-12" />
          <div>
            <h2 className="text-4xl font-black leading-tight">فرصتك العقارية<br />تبدأ من هنا</h2>
            <div className="mt-8 space-y-4 text-sm text-primary-foreground/75">
              {["طلبات خروج محفوظة في حسابك", "مراجعة المدفوعات قبل أي نشر", "تواصل من خلال المنصة"].map((x) => <p key={x} className="flex items-center gap-3"><CheckCircle2 className="size-5 text-brand-green" />{x}</p>)}
            </div>
          </div>
          <p className="text-xs text-primary-foreground/50">عقار فرصة — فرص حقيقية لحياة أفضل</p>
        </section>
        <section className="flex items-center px-4 py-12 lg:px-16">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-black text-primary">{c.title}</h1>
            <p className="mt-2 text-muted-foreground">{c.text}</p>
            {mode !== "forgot" && (
              <>
                <Button type="button" variant="outline" size="lg" className="mt-8 w-full" onClick={google}>المتابعة بحساب جوجل</Button>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />أو<span className="h-px flex-1 bg-border" /></div>
              </>
            )}
            <form className={`${mode === "forgot" ? "mt-8" : ""} space-y-4`} onSubmit={onSubmit}>
              {mode === "register" && <label className="block"><span className="mb-2 block text-sm font-bold">الاسم الكامل</span><div className="relative"><User className="absolute right-3 top-3 size-5 text-muted-foreground" /><Input className="pr-10" required value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" /></div></label>}
              <label className="block"><span className="mb-2 block text-sm font-bold">البريد الإلكتروني</span><div className="relative"><Mail className="absolute right-3 top-3 size-5 text-muted-foreground" /><Input className="pr-10" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" /></div></label>
              {mode !== "forgot" && <label className="block"><span className="mb-2 block text-sm font-bold">كلمة المرور</span><div className="relative"><LockKeyhole className="absolute right-3 top-3 size-5 text-muted-foreground" /><Input className="pr-10" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div></label>}
              {mode === "login" && <div className="text-left"><Link to="/forgot-password" className="text-sm font-bold text-brand-blue">نسيت كلمة المرور؟</Link></div>}
              {error && <p className="rounded-md bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p>}
              {notice && <p className="rounded-md bg-brand-green/10 p-3 text-sm font-bold">{notice}</p>}
              <Button className="w-full" size="lg" type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{c.button}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "register" ? <>لديك حساب؟ <Link to="/login" search={{ redirect }} className="font-bold text-brand-blue">سجل الدخول</Link></>
                : mode === "login" ? <>ليس لديك حساب؟ <Link to="/register" search={{ redirect }} className="font-bold text-brand-blue">أنشئ حساباً</Link></>
                : <Link to="/login" search={{ redirect: undefined }} className="font-bold text-brand-blue">العودة لتسجيل الدخول</Link>}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
