import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/NotFound";
import { createSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  head: () => {
    const seo = createSeoMeta({
      title: "404 Not Found — CarrotHost",
      description: "The page you are looking for does not exist.",
      path: "/404",
    });
    return seo;
  },
  component: NotFound,
});
