import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Building2, FileCheck2, Handshake, Scale, LogOut, Construction, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/aqar/SearchBar";
import { ExitOpportunityCard, NewUnitCard, ProjectOpportunityCard } from "@/components/aqar/opportunity/OpportunityCards";
import { ExitExample, HowExitWorks } from "@/components/aqar/opportunity/HowExitWorks";
import { DemoNotice } from "@/components/aqar/opportunity/DemoNotice";
import { exitOpportunities, newUnits, projectOpportunities } from "@/data/opportunities";
import hero from "@/assets/aqar-hero.jpg";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "عقار فرصة | فرص الخروج والوحدات الجديدة وفرص المشاريع" },
    { name: "description", content: "اكتشف فرص الخروج من عقود التقسيط بمبلغ خروج قائم على المدفوع فعلياً، ووحدات جديدة وفرص مشاريع في مصر." },
    { property: "og:title", content: "عقار فرصة | إنت بتدور على فرصة" },
    { property: "og:description", content: "فرص الخروج والوحدات الجديدة وفرص المشاريع ببيانات مالية واضحة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const benefits: Array<[LucideIcon, string, string]> = [
  [Scale, "مبلغ خروج واضح", "قائم على المدفوع فعلياً للمطور"],
  [BarChart3, "بيانات أوضح", "لاتخاذ قرار أفضل"],
  [FileCheck2, "عملية مراجعة منظمة", "المستندات تخضع للمراجعة"],
  [Handshake, "متابعة من عقار فرصة", "بدون تواصل مباشر مع البائع"],
];

function SectionHead({ title, to }: { title: string; to: "/exit-opportunities" | "/new-units" | "/project-opportunities" }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><h2 className="text-2xl font-black text-primary">{title}</h2><Button variant="link" asChild><Link to={to}>عرض الكل <ArrowLeft /></Link></Button></div>;
}

function Index() {
  const t = useSiteContent();
  return (
    <main>
      <section className="relative min-h-[430px] overflow-hidden">
        <img src={t("home.hero_image") || hero} width={1920} height={900} alt="إطلالة عقارية حديثة في القاهرة الجديدة" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="hero-wash absolute inset-0" />
        <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center px-4 py-12 lg:px-8">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-black leading-tight text-primary md:text-5xl">{t("home.hero_title")}</h1>
            <p className="mt-3 font-bold text-foreground/80 md:text-lg">{t("home.hero_subtitle")}</p>
            <div className="mt-6"><SearchBar /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
          <Link to="/exit-opportunities" className="grid min-h-32 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg bg-primary p-5 text-primary-foreground shadow-card">
            <LogOut className="size-10 text-brand-green" />
            <div><span className="text-[11px] font-bold text-primary-foreground/70">القسم الأساسي</span><h2 className="text-xl font-black">{t("home.exit_title")}</h2><p className="mt-1 text-sm leading-6 text-primary-foreground/80">{t("home.exit_text")}</p></div>
            <ArrowLeft className="size-5" />
          </Link>
          <Link to="/new-units" className="grid min-h-32 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg bg-secondary p-5">
            <Building2 className="size-9 text-brand-pink" /><div><h2 className="text-lg font-black text-primary">{t("home.units_title")}</h2><p className="mt-1 text-sm leading-6 text-foreground/75">{t("home.units_text")}</p></div><ArrowLeft className="size-5 text-primary" />
          </Link>
          <Link to="/project-opportunities" className="grid min-h-32 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg bg-accent p-5">
            <Construction className="size-9 text-brand-blue" /><div><h2 className="text-lg font-black text-primary">{t("home.projects_title")}</h2><p className="mt-1 text-sm leading-6 text-foreground/75">{t("home.projects_text")}</p></div><ArrowLeft className="size-5 text-primary" />
          </Link>
        </div>
      </section>

      <ExitExample />

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHead title="أحدث فرص الخروج" to="/exit-opportunities" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{exitOpportunities.map((o) => <ExitOpportunityCard key={o.id} o={o} />)}</div>
        <div className="mt-4"><DemoNotice /></div>
      </section>

      <HowExitWorks />

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-6 shadow-card md:flex-row md:items-center">
          <div><h2 className="text-xl font-black text-primary">{t("home.sell_title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("home.sell_text")}</p></div>
          <Button asChild size="lg"><Link to="/sell-exit">ابدأ طلب الخروج <ArrowLeft /></Link></Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-2 lg:px-8">
        <div><SectionHead title="الوحدات الجديدة" to="/new-units" /><div className="mt-5 grid gap-5 sm:grid-cols-2">{newUnits.slice(0, 2).map((o) => <NewUnitCard key={o.id} o={o} />)}</div></div>
        <div><SectionHead title="فرص المشاريع" to="/project-opportunities" /><div className="mt-5 grid gap-5 sm:grid-cols-2">{projectOpportunities.slice(0, 2).map((o) => <ProjectOpportunityCard key={o.id} o={o} />)}</div></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
        <div className="grid divide-y rounded-lg border bg-card shadow-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {benefits.map(([Icon, title, text]) => <div key={title} className="flex items-center gap-3 p-5"><span className="grid size-11 place-items-center rounded-full bg-secondary text-brand-blue"><Icon className="size-6" /></span><div><h3 className="font-extrabold text-primary">{title}</h3><p className="text-xs text-muted-foreground">{text}</p></div></div>)}
        </div>
      </section>
    </main>
  );
}
