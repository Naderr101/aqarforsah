import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminShell";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/_authenticated/admin/catalog")({ component: Catalog });

function Picker({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: { id: string; name: string }[] }) {
  return <label className="grid gap-1 text-sm font-bold">{label}<select className="h-10 rounded-md border bg-background px-2" value={value} onChange={(e) => onChange(e.target.value)}><option value="">— اختر —</option>{items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>;
}

function Catalog() {
  const [dev, setDev] = useState(""); const [proj, setProj] = useState(""); const [phase, setPhase] = useState("");
  const devs = useQuery({ queryKey: ["admin", "developers", "pick"], queryFn: async () => (await supabase.from("developers").select("id,name").order("name")).data ?? [] });
  const projs = useQuery({ queryKey: ["admin", "projects", dev], enabled: !!dev, queryFn: async () => (await supabase.from("projects").select("id,name").eq("developer_id", dev).order("name")).data ?? [] });
  const phases = useQuery({ queryKey: ["admin", "phases", proj], enabled: !!proj, queryFn: async () => (await supabase.from("phases").select("id,name").eq("project_id", proj).order("sort_order")).data ?? [] });
  return (
    <AdminPage title="المطورين والمشاريع">
      <div className="grid gap-6">
        <section><h2 className="mb-2 font-black text-primary">المطورين</h2>
          <CrudTable table="developers" orderBy="name" textId fields={[{ key: "name", label: "اسم المطور", required: true }]} /></section>
        <section className="grid gap-3"><h2 className="font-black text-primary">المشاريع</h2>
          <Picker label="المطور" value={dev} onChange={(v) => { setDev(v); setProj(""); setPhase(""); }} items={devs.data ?? []} />
          {dev && <CrudTable table="projects" orderBy="name" textId filter={["developer_id", dev]} defaults={{ developer_id: dev }} fields={[{ key: "name", label: "اسم المشروع", required: true }, { key: "location", label: "الموقع" }]} />}
        </section>
        {dev && <section className="grid gap-3"><h2 className="font-black text-primary">المراحل</h2>
          <Picker label="المشروع" value={proj} onChange={(v) => { setProj(v); setPhase(""); }} items={projs.data ?? []} />
          {proj && <CrudTable table="phases" textId filter={["project_id", proj]} defaults={{ project_id: proj }} fields={[{ key: "name", label: "اسم المرحلة", required: true }, { key: "sort_order", label: "الترتيب", type: "number" }]} />}
        </section>}
        {proj && <section className="grid gap-3"><h2 className="font-black text-primary">المباني</h2>
          <Picker label="المرحلة" value={phase} onChange={setPhase} items={phases.data ?? []} />
          {phase && <CrudTable table="buildings" textId filter={["phase_id", phase]} defaults={{ phase_id: phase }} fields={[{ key: "name", label: "اسم المبنى", required: true }, { key: "sort_order", label: "الترتيب", type: "number" }]} />}
        </section>}
      </div>
    </AdminPage>
  );
}
