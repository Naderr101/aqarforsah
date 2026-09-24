import { Link } from "@tanstack/react-router";

export function Brand() {
  return <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="عقار فرصة - الرئيسية">
    <span className="relative grid h-10 w-10 rotate-45 grid-cols-2 overflow-hidden rounded-sm shadow-sm">
      <span className="bg-brand-blue"/><span className="bg-brand-pink"/><span className="bg-brand-green"/><span className="bg-brand-yellow"/>
    </span>
    <span className="flex flex-col leading-none"><strong className="text-lg text-primary">عقار فرصة</strong><small className="mt-1 text-[9px] font-bold tracking-wider text-muted-foreground">AQAR FORSAH</small></span>
  </Link>;
}
