import { createFileRoute } from "@tanstack/react-router";
import { ListingsPage } from "@/components/aqar/ListingsPage";
type Search={q?:string;page?:number;sort?:string;purpose?:string};
export const Route=createFileRoute("/properties")({validateSearch:(s:Record<string,unknown>):Search=>({q:typeof s["q"]==="string"?s["q"]:"",page:typeof s["page"]==="number"?s["page"]:1,sort:typeof s["sort"]==="string"?s["sort"]:"newest",purpose:typeof s["purpose"]==="string"?s["purpose"]:"all"}),head:()=>({meta:[{title:"كل العقارات | عقار فرصة"},{name:"description",content:"تصفح فرص العقارات للبيع والإيجار في أهم المدن والمشروعات."},{property:"og:title",content:"كل العقارات | عقار فرصة"},{property:"og:description",content:"ابحث وقارن بين أفضل الفرص العقارية المتاحة."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Page});
function Page(){const {q}=Route.useSearch();return <ListingsPage q={q??""}/>}
