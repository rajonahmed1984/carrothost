import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, jsonLdScript } from "@/lib/seo";
import { Calendar, Users, Award, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about-us")({
  head: () => {
    const seo = createSeoMeta({
      title: "About Us — CarrotHost",
      description:
        "Learn about CarrotHost, formerly RD Network BD, providing premium managed web hosting and local VPS servers in Bangladesh since 2014.",
      path: "/about-us",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-about-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about-us" },
          ]),
        ),
      ],
    };
  },
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <div>
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-soft py-16 md:py-24 border-b border-border/55">
        <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-4 py-1.5 text-xs font-semibold text-brand-orange">
            <Users className="h-4 w-4" />
            Our Story
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            About <span className="text-gradient-brand">CarrotHost</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your partners in online success. Providing blistering speeds, server-side stability, and
            dedicated support since 2014.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 bg-card">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-8 space-y-6 text-sm md:text-base leading-relaxed text-muted-foreground">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Our Journey
              </h2>
              <p>
                At **CarrotHost**, we’ve been providing reliable web hosting solutions since
                **2014**, back when we started as{" "}
                <a
                  href="https://www.rdnetworkbd.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange hover:underline font-semibold"
                >
                  RD Network BD
                </a>
                . What makes us truly stand out is our team of dedicated experts who are passionate
                about what they do—ensuring your websites run smoothly, securely, and efficiently.
              </p>
              <p>
                Our commitment goes beyond just hosting; we bring personalized support and technical
                excellence to every website we manage. Day in and day out, we face challenges that
                others shy away from, making complex website management easier for you.
              </p>
              <p>
                With CarrotHost, you’re not just getting a service—you’re getting partners who care
                about your online success. Whether it is e-commerce flash sales, custom application
                pipelines, or GTM tracking setups, we have you covered.
              </p>
            </div>

            <div className="md:col-span-4 bg-secondary/35 rounded-3xl border border-border p-6 space-y-6">
              <h3 className="font-bold text-foreground text-base pb-3 border-b border-border/50">
                CarrotHost at a glance
              </h3>
              <div className="space-y-4 text-xs font-semibold text-foreground/80">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-brand-orange shrink-0" />
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      Established
                    </span>
                    <span>Since 2014</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-brand-orange shrink-0" />
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      Original Brand
                    </span>
                    <span>RD Network BD</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-brand-orange shrink-0" />
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      Parent Company
                    </span>
                    <span>Apptimatic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
