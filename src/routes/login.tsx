import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/aqar/AuthPage";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({ meta: [{ title: "تسجيل الدخول | عقار فرصة" }, { name: "description", content: "سجل الدخول إلى حسابك في عقار فرصة." }, { property: "og:title", content: "تسجيل الدخول | عقار فرصة" }, { property: "og:description", content: "تابع طلبات الخروج وفرصك من حسابك." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AuthPage mode="login" redirect={Route.useSearch().redirect} />,
});
