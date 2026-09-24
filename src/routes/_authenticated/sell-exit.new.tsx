import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { ExitWizard } from "@/components/aqar/exit-wizard/ExitWizard";
import { createExitDraft } from "@/lib/exit-drafts.functions";

export const Route = createFileRoute("/_authenticated/sell-exit/new")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  head: () => ({ meta: [
    { title: "طلب خروج من وحدة | عقار فرصة" },
    { name: "description", content: "قدّم بيانات وحدتك وعقدك ومدفوعاتك للمراجعة. مبلغ الخروج يُحدد بعد التوثيق." },
    { property: "og:title", content: "طلب خروج من وحدة | عقار فرصة" },
    { property: "og:description", content: "قدّم بيانات عقدك للمراجعة على عقار فرصة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const create = useServerFn(createExitDraft);
  const started = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id || started.current) return;
    started.current = true;
    create().then((r) => navigate({ to: "/sell-exit/new", search: { id: r.id }, replace: true })).catch(() => setError(true));
  }, [id, create, navigate]);

  return (
    <main className="px-4 py-8">
      {id ? <ExitWizard key={id} id={id} /> : (
        <div className="py-20 text-center text-sm text-muted-foreground">
          {error ? "تعذر إنشاء المسودة. حدّث الصفحة وحاول تاني." : <><Loader2 className="mx-auto mb-2 size-5 animate-spin" />جاري إنشاء مسودة جديدة…</>}
        </div>
      )}
    </main>
  );
}
