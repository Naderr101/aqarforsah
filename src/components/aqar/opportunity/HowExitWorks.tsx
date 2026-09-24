const seller = ["ضيف بيانات وحدتك وعقدك", "أضف بيانات المدفوعات", "نراجع المستندات", "يتم تحديد مبلغ الخروج", "تظهر الفرصة للمشترين", "نتابع خطوات التنازل"];
const buyer = ["اكتشف الفرص", "راجع التفاصيل المالية", "شوف مبلغ الخروج والمتبقي", "قارن بسعر السوق", "سجل اهتمامك", "نتابع معاك إجراءات الفرصة"];

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-card">
      <h3 className="text-lg font-black text-primary">{title}</h3>
      <ol className="mt-4 grid gap-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm font-bold">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs text-brand-blue">{(i + 1).toLocaleString("ar-EG")}</span>{s}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowExitWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h2 className="text-2xl font-black text-primary">إزاي فرص الخروج بتشتغل؟</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">مبلغ الخروج هو اللي البائع دفعه فعلاً للمطور — مش سعر بيحطه البائع. التنازل يخضع لشروط وموافقة المطور.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Steps title="لو عايز تخرج من وحدتك" steps={seller} />
        <Steps title="لو بتدور على فرصة" steps={buyer} />
      </div>
    </section>
  );
}
