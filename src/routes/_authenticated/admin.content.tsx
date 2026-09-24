import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const Route = createFileRoute("/_authenticated/admin/content")({ component: () => <AdminPage title="محتوى الموقع"><ContentEditor images={false} /></AdminPage> });
