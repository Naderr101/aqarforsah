import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم | عقار فرصة" }, { name: "description", content: "لوحة التحكم الإدارية لمنصة عقار فرصة." }, { property: "og:title", content: "لوحة التحكم | عقار فرصة" }, { property: "og:description", content: "إدارة محتوى ومنصة عقار فرصة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminShell,
});
