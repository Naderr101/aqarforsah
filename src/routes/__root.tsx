import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/aqar/SiteHeader";
import { SiteFooter } from "@/components/aqar/SiteFooter";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
function NotFoundComponent(){return <div className="grid min-h-screen place-items-center bg-secondary px-4 text-center"><div><strong className="text-7xl text-primary">404</strong><h1 className="mt-4 text-2xl font-black">الصفحة غير موجودة</h1><p className="mt-2 text-muted-foreground">ربما تم نقل الصفحة أو تغيير رابطها.</p><Button className="mt-6" asChild><Link to="/">العودة للرئيسية</Link></Button></div></div>}
function ErrorComponent({error,reset}:{error:Error;reset:()=>void}){const router=useRouter();useEffect(()=>reportLovableError(error,{boundary:"root"}),[error]);return <div className="grid min-h-screen place-items-center px-4 text-center"><div><h1 className="text-2xl font-black">تعذر تحميل الصفحة</h1><p className="mt-2 text-muted-foreground">حدث خطأ غير متوقع. حاول مرة أخرى.</p><Button className="mt-6" onClick={()=>{router.invalidate();reset()}}>إعادة المحاولة</Button></div></div>}
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1"},{name:"author",content:"عقار فرصة"},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"stylesheet",href:appCss},{rel:"preconnect",href:"https://fonts.googleapis.com"},{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"},{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"},{rel:"icon",href:"/favicon.ico",type:"image/x-icon"}]}),shellComponent:RootShell,component:RootComponent,notFoundComponent:NotFoundComponent,errorComponent:ErrorComponent});
function RootShell({children}:{children:ReactNode}){return <html lang="ar" dir="rtl"><head><HeadContent/></head><body>{children}<Scripts/></body></html>}
function RootComponent(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><SiteHeader/><Outlet/><SiteFooter/></QueryClientProvider>}
