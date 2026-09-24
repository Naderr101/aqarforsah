import { createFileRoute, redirect } from "@tanstack/react-router";
// Legacy route kept temporarily; the marketplace is organised by opportunity sections.
export const Route = createFileRoute("/sale")({ beforeLoad: () => { throw redirect({ to: "/exit-opportunities" }); } });
