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

/** Worked demo example — makes the exit financial model obvious at a glance. */
export function ExitExample() {
  const items: Array<[string, string, string]> = [
    ["مبلغ الخروج", "١٬٥٠٠٬٠٠٠", "المدفوع الموثق للمطور"],
    ["المتبقي للمطور", "٣٬٥٠٠٬٠٠٠", "بتكمله حسب جدول العقد"],
    ["سعر السوق الحالي", "٦٬٥٠٠٬٠٠٠", "حسب تقييم عقار فرصة"],
    ["التوفير التقديري", "١٬٤٣٧٬٥٠٠", "بعد قيمة الصفقة ورسوم المنصة"],
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <div className="grid gap-2 bg-primary p-5 text-primary-foreground md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold text-primary-foreground/70">مثال توضيحي · بالم هيلز أكتوبر · عقد بقيمة ٥٬٠٠٠٬٠٠٠ جنيه</p>
            <h2 className="mt-1 text-xl font-black md:text-2xl">يعني إيه فرصة خروج؟</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-primary-foreground/85">صاحب الوحدة بيخرج بالمبلغ المدفوع الموثق، وإنت بتكمل المتبقي للمطور وفقًا لشروط التنازل.</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y md:grid-cols-4 md:divide-y-0">
          {items.map(([k, v, h], i) => (
            <div key={k} className={`p-5 ${i === 3 ? "bg-brand-green/10" : ""}`}>
              <p className="text-sm font-bold text-muted-foreground">{k}</p>
              <p className={`mt-1 text-2xl font-black ${i === 3 ? "text-brand-green" : "text-primary"}`}>{v} <span className="text-sm">جنيه</span></p>
              <p className="mt-1 text-[11px] text-muted-foreground">{h}</p>
            </div>
          ))}
        </div>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">قيمة الصفقة ٥٬٠٠٠٬٠٠٠ + رسوم المنصة ٦٢٬٥٠٠ (١٫٢٥٪). التوفير تقديري ويعتمد على البيانات المتاحة والتقييم الحالي.</p>
      </div>
    </section>
  );
}
