import { createFileRoute, redirect } from "@tanstack/react-router";
// Legacy route kept temporarily; the marketplace is organised by opportunity sections.
export const Route = createFileRoute("/rent")({ beforeLoad: () => { throw redirect({ to: "/new-units" }); } });
