import { Link } from "@tanstack/react-router";
import { Globe2, Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brand } from "./Brand";
import { useNavSections } from "@/lib/site-content";
import { useMyAccess } from "./StaffGate";
function StaffLink({onClick}:{onClick?:()=>void}){const q=useMyAccess();if(q.data?.roles.includes("DEVELOPER")&&!q.data?.staff)return <Button variant="ghost" asChild><Link to="/developer" onClick={onClick}>بوابة المطور</Link></Button>;if(!q.data?.staff&&!q.data?.roles.includes("SALES_AGENT"))return null;return <Button variant="ghost" asChild><Link to="/admin" onClick={onClick}>لوحة التحكم</Link></Button>}

const links = [{to:"/",label:"الرئيسية"},{to:"/exit-opportunities",label:"فرص الخروج"},{to:"/new-units",label:"الوحدات الجديدة"},{to:"/project-opportunities",label:"فرص المشاريع"},{to:"/sell-exit",label:"عايز تخرج من وحدتك؟"} ] as const;
export function SiteHeader(){
 const [open,setOpen]=useState(false);
 const nav=useNavSections();
 const items=nav.data?.length?[links[0],...nav.data.map(n=>({to:n.href as (typeof links)[number]["to"],label:n.label}))]:links;
 const [signedIn,setSignedIn]=useState(false);
 useEffect(()=>{void supabase.auth.getSession().then(({data})=>setSignedIn(!!data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSignedIn(!!s));return()=>data.subscription.unsubscribe();},[]);
 const signOut=()=>{void supabase.auth.signOut();setOpen(false);};
 return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
  <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 lg:flex lg:h-[72px] lg:px-8">
   <Brand/><nav className="mr-auto hidden items-center gap-7 lg:flex">{items.map((l,i)=><Link key={`${l.to}-${i}`} to={l.to} className="border-b-2 border-transparent py-6 text-sm font-bold text-foreground/80 transition-colors hover:border-primary hover:text-primary" activeProps={{className:"border-primary text-primary"}}>{l.label}</Link>)}</nav>
   <div className="hidden items-center gap-2 lg:flex"><Button variant="ghost" size="icon" aria-label="المفضلة" asChild><Link to="/favorites"><Heart/></Link></Button><Button variant="ghost" size="sm"><Globe2/> EN</Button>{signedIn?<><StaffLink/><Button variant="outline" asChild><Link to="/dashboard/exit-requests">طلبات الخروج</Link></Button><Button variant="ghost" onClick={signOut}>خروج</Button></>:<><Button variant="outline" asChild><Link to="/login" search={{redirect:undefined}}>تسجيل الدخول</Link></Button><Button asChild><Link to="/register" search={{redirect:undefined}}>إنشاء حساب</Link></Button></>}</div>
   <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open?"إغلاق القائمة":"فتح القائمة"} onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</Button>
  </div>
  {open&&<nav className="border-t bg-background px-4 py-4 lg:hidden">{items.map((l,i)=><Link key={`${l.to}-${i}`} to={l.to} onClick={()=>setOpen(false)} className="block border-b py-3 font-bold">{l.label}</Link>)}<div className="mt-4 grid grid-cols-2 gap-2">{signedIn?<><StaffLink onClick={()=>setOpen(false)}/><Button variant="outline" asChild><Link to="/dashboard/exit-requests" onClick={()=>setOpen(false)}>طلبات الخروج</Link></Button><Button variant="ghost" onClick={signOut}>خروج</Button></>:<><Button variant="outline" asChild><Link to="/login" search={{redirect:undefined}}>دخول</Link></Button><Button asChild><Link to="/register" search={{redirect:undefined}}>إنشاء حساب</Link></Button></>}</div></nav>}
 </header>
}
