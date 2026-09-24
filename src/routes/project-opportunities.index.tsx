import { createFileRoute } from "@tanstack/react-router";
import { OpportunityListing, RangeFilter } from "@/components/aqar/opportunity/OpportunityListing";
import { ProjectOpportunityCard } from "@/components/aqar/opportunity/OpportunityCards";
import { projectOpportunities } from "@/data/opportunities";

export const Route = createFileRoute("/project-opportunities/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({ meta: [
    { title: "فرص المشاريع | عقار فرصة" },
    { name: "description", content: "فرص تطوير واستثمار: أراضي، شراكات تطوير، ومحافظ مباني." },
    { property: "og:title", content: "فرص المشاريع | عقار فرصة" },
    { property: "og:description", content: "فرص تطوير واستثمار ومشروعات عقارية." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { q } = Route.useSearch();
  return (
    <OpportunityListing
      title="فرص المشاريع"
      description="فرص تطوير واستثمار ومشروعات عقارية: أراضي، شراكات تطوير، ومحافظ مباني."
      items={projectOpportunities}
      q={q}
      render={(o) => <ProjectOpportunityCard o={o} />}
      filters={<RangeFilter label="قيمة الاستثمار" />}
    />
  );
}
