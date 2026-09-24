import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(file: File) {
    if (!ALLOWED.includes(file.type)) return toast.error("الصور المسموحة: PNG أو JPG أو WEBP");
    if (file.size > 5 * 1024 * 1024) return toast.error("أقصى حجم 5 ميجا");
    setBusy(true);
    const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return toast.error("تعذر الرفع — تأكد من صلاحيتك."); }
    const s = await supabase.storage.from("site-media").createSignedUrl(path, TEN_YEARS);
    setBusy(false);
    if (s.error || !s.data) return toast.error("تعذر تجهيز رابط الصورة.");
    onChange(s.data.signedUrl);
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? <img src={value} alt="" className="h-16 w-24 rounded border object-cover" /> : <div className="grid h-16 w-24 place-items-center rounded border border-dashed text-xs text-muted-foreground">بدون صورة</div>}
      <Button type="button" variant="outline" size="sm" asChild disabled={busy}>
        <label className="cursor-pointer">{busy ? <Loader2 className="animate-spin" /> : <Upload />}رفع صورة<input type="file" accept={ALLOWED.join(",")} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} /></label>
      </Button>
      {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}><X />إزالة</Button>}
    </div>
  );
}
