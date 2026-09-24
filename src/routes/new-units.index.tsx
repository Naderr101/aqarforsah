import { createFileRoute } from "@tanstack/react-router";
import { LiveNewUnits } from "@/components/aqar/opportunity/LiveListings";
import { OpportunityListing, RangeFilter } from "@/components/aqar/opportunity/OpportunityListing";
import { NewUnitCard } from "@/components/aqar/opportunity/OpportunityCards";
import { newUnits } from "@/data/opportunities";

export const Route = createFileRoute("/new-units/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({ meta: [
    { title: "الوحدات الجديدة | عقار فرصة" },
    { name: "description", content: "وحدات مباشرة من المطورين والمشروعات بسعر الوحدة والمقدم وخطة التقسيط." },
    { property: "og:title", content: "الوحدات الجديدة | عقار فرصة" },
    { property: "og:description", content: "وحدات مباشرة من المطورين والمشروعات." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { q } = Route.useSearch();
  return (
    <>
    <LiveNewUnits q={q} />
    <OpportunityListing
      title="الوحدات الجديدة"
      description="وحدات مباشرة من المطورين والمشروعات، بسعر الوحدة والمقدم وخطة السداد."
      items={newUnits}
      q={q}
      render={(o) => <NewUnitCard o={o} />}
      filters={<><RangeFilter label="سعر الوحدة" /><RangeFilter label="المقدم" /></>}
    />
    </>
  );
}
