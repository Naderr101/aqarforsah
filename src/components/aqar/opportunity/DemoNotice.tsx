import { FlaskConical } from "lucide-react";
export function DemoNotice() {
  return (
    <p className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
      <FlaskConical className="size-4 shrink-0" />
      الفرص المعروضة حالياً بيانات تجريبية للعرض فقط، وحالات المراجعة فيها توضيحية.
    </p>
  );
}
