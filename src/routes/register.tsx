import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/aqar/AuthPage";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({ meta: [{ title: "إنشاء حساب | عقار فرصة" }, { name: "description", content: "أنشئ حسابك لمتابعة طلبات الخروج والفرص." }, { property: "og:title", content: "إنشاء حساب | عقار فرصة" }, { property: "og:description", content: "انضم إلى منصة عقار فرصة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AuthPage mode="register" redirect={Route.useSearch().redirect} />,
});
