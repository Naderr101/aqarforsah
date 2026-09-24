import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileText, Wallet, Building2, UserRound, ArrowLeftRight } from "lucide-react";
import { PageHero } from "@/components/aqar/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sell-exit")({
  head: () => ({ meta: [
    { title: "عايز تخرج من وحدتك؟ | عقار فرصة" },
    { name: "description", content: "اعرض عقد وحدتك كفرصة خروج. مبلغ الخروج بيتحدد من المدفوع فعلياً للمطور بعد مراجعة المستندات." },
    { property: "og:title", content: "عايز تخرج من وحدتك؟ | عقار فرصة" },
    { property: "og:description", content: "حوّل عقدك لفرصة خروج واضحة للمشترين." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const steps = [
  { icon: UserRound, t: "بياناتك", d: "الاسم ووسيلة التواصل — مش هتظهر للمشترين." },
  { icon: Building2, t: "المطور والمشروع والوحدة", d: "المطور، المشروع، نوع الوحدة ومساحتها." },
  { icon: FileText, t: "العقد", d: "قيمة العقد ونظام السداد." },
  { icon: Wallet, t: "المدفوعات والمتبقي", d: "اللي دفعته فعلاً للمطور والمتبقي عليك." },
  { icon: ClipboardList, t: "المستندات", d: "العقد وإيصالات السداد للمراجعة." },
  { icon: ArrowLeftRight, t: "بيانات التنازل", d: "شروط التنازل عند المطور إن وجدت." },
];

function Page() {
  return (
    <>
      <PageHero title="عايز تخرج من وحدتك؟" description="ضيف بيانات عقدك ومدفوعاتك، وإحنا بنراجع المستندات ونحدد مبلغ الخروج على أساس اللي دفعته فعلاً للمطور." />
      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <div className="rounded-lg border bg-secondary p-4 text-sm leading-7">
          في فرص الخروج مفيش "سعر مطلوب". مبلغ الخروج = أصل المبلغ المدفوع للمطور بعد المراجعة، والتنازل يخضع لشروط وموافقة المطور.
        </div>
        <h2 className="mt-8 text-xl font-black text-primary">هنطلب منك</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {steps.map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="flex gap-3 rounded-lg border bg-card p-4 shadow-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-brand-blue"><Icon className="size-5" /></span>
              <div><p className="font-extrabold">{(i + 1).toLocaleString("ar-EG")}. {t}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{d}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" disabled>نموذج الطلب قريباً</Button>
          <Button size="lg" variant="outline" asChild><Link to="/exit-opportunities">شوف فرص الخروج الحالية</Link></Button>
        </div>
      </main>
    </>
  );
}
