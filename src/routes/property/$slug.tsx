import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/property/$slug")({ beforeLoad: () => { throw redirect({ to: "/exit-opportunities" }); } });
