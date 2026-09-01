import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/NotFound";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "404 Not Found — CarrotHost" },
      { name: "description", content: "The page you are looking for does not exist." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: NotFound,
});
