import { createFileRoute, Link } from "@tanstack/react-router";
import { OpportunityListing, RangeFilter } from "@/components/aqar/opportunity/OpportunityListing";
import { ExitOpportunityCard } from "@/components/aqar/opportunity/OpportunityCards";
import { Button } from "@/components/ui/button";
import { exitOpportunities } from "@/data/opportunities";

export const Route = createFileRoute("/exit-opportunities/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({ meta: [
    { title: "فرص الخروج | عقار فرصة" },
    { name: "description", content: "وحدات أصحابها عايزين يخرجوا من عقود التقسيط، بمبلغ خروج قائم على المدفوع فعلياً للمطور." },
    { property: "og:title", content: "فرص الخروج | عقار فرصة" },
    { property: "og:description", content: "مبلغ الخروج والمتبقي للمطور وقيمة الصفقة بوضوح في كل فرصة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { q } = Route.useSearch();
  return (
    <OpportunityListing
      title="فرص الخروج"
      description="وحدات أصحابها عايزين يخرجوا من عقودهم. مبلغ الخروج قائم على المدفوع فعلياً للمطور — فرصة حقيقية بدون أوفر برايس."
      items={exitOpportunities}
      q={q}
      render={(o) => <ExitOpportunityCard o={o} />}
      heroExtra={<div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-bold text-foreground/80">عايز تخرج من وحدتك؟</span><Button asChild size="sm" variant="outline"><Link to="/sell-exit">ابدأ طلب الخروج</Link></Button></div>}
      filters={<><RangeFilter label="مبلغ الخروج" /><RangeFilter label="المتبقي للمطور" /><RangeFilter label="القسط الشهري" /></>}
    />
  );
}
