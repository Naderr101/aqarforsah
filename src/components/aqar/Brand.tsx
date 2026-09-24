import { Link } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/site-content";

export function Brand() {
  const t = useSiteContent();
  const logo = t("brand.logo");
  return <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={`${t("brand.name")} - الرئيسية`}>
    {logo ? <img src={logo} alt={t("brand.name")} className="h-10 w-auto max-w-[140px] object-contain" /> :
    <span className="relative grid h-10 w-10 rotate-45 grid-cols-2 overflow-hidden rounded-sm shadow-sm">
      <span className="bg-brand-blue"/><span className="bg-brand-pink"/><span className="bg-brand-green"/><span className="bg-brand-yellow"/>
    </span>}
    <span className="flex flex-col leading-none"><strong className="text-lg text-primary">{t("brand.name")}</strong><small className="mt-1 text-[9px] font-bold tracking-wider text-muted-foreground">{t("brand.tagline")}</small></span>
  </Link>;
}
