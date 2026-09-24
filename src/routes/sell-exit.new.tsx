import { createFileRoute } from "@tanstack/react-router";
import { ExitWizard } from "@/components/aqar/exit-wizard/ExitWizard";

export const Route = createFileRoute("/sell-exit/new")({
  head: () => ({ meta: [
    { title: "طلب خروج من وحدة | عقار فرصة" },
    { name: "description", content: "قدّم بيانات وحدتك وعقدك ومدفوعاتك ومستنداتك للمراجعة. مبلغ الخروج يُحدد بعد التوثيق." },
    { property: "og:title", content: "طلب خروج من وحدة | عقار فرصة" },
    { property: "og:description", content: "قدّم بيانات عقدك للمراجعة لتحديد مبلغ الخروج." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <main className="bg-secondary/40 px-4 py-8"><ExitWizard /></main>,
});
