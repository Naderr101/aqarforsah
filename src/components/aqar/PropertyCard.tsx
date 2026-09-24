import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, Heart, MapPin, Maximize2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import propertyStrip from "@/assets/property-strip.jpg";
import type { Property } from "@/types/property";
import { formatPrice } from "@/data/properties";

export function PropertyCard({property,view="grid"}:{property:Property;view?:"grid"|"list"}){
 return <article className={`group overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-card-hover ${view==="list"?"md:grid md:grid-cols-[260px_1fr]":""}`}>
  <div className="relative h-44 overflow-hidden"><img src={propertyStrip} alt={property.title} loading="lazy" width={1920} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{objectPosition:property.imagePosition}}/><span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-primary-foreground badge-${property.badgeTone}`}>{property.badge}</span><Button variant="ghost" size="icon" aria-label="حفظ العقار" className="absolute left-2 top-2 bg-background/85 text-primary hover:bg-background"><Heart/></Button></div>
  <div className="p-4"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><Link to="/property/$slug" params={{slug:property.slug}} className="block truncate text-base font-extrabold text-primary hover:text-brand-blue">{property.title}</Link><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3"/>{property.location}{property.verified&&<ShieldCheck className="mr-1 size-3 text-brand-green"/>}</p></div></div>
   <div className="mt-4 flex items-center gap-4 border-y py-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><BedDouble className="size-4"/>{property.bedrooms}</span><span className="flex items-center gap-1"><Bath className="size-4"/>{property.bathrooms}</span><span className="flex items-center gap-1"><Maximize2 className="size-4"/>{property.area} م²</span></div>
   <div className="mt-3 grid grid-cols-2 gap-3"><div><small className="text-muted-foreground">{property.purpose==="rent"?"الإيجار الشهري":"السعر المطلوب"}</small><p className="font-extrabold text-primary">{formatPrice(property.price)} ج.م</p></div>{property.oldPrice&&<div className="border-r pr-3"><small className="text-muted-foreground">القيمة السوقية</small><p className="font-bold text-foreground">{formatPrice(property.oldPrice)} ج.م</p></div>}{property.installment&&<div className="border-r pr-3"><small className="text-muted-foreground">نظام السداد</small><p className="font-bold text-foreground">{property.installment}</p></div>}</div>
  </div>
 </article>
}
