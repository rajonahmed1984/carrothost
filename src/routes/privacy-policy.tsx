import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, jsonLdScript } from "@/lib/seo";
import { Shield, Eye, Lock } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => {
    const seo = createSeoMeta({
      title: "Privacy Policy — CarrotHost",
      description: "Privacy Policy and data protection terms for CarrotHost customers.",
      path: "/privacy-policy",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-privacy-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy-policy" },
          ]),
        ),
      ],
    };
  },
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div>
      <Header />
      <div className="bg-gradient-soft py-16 md:py-24 border-b border-border/55">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 border border-brand-green/20 px-4 py-1.5 text-xs font-semibold text-brand-green">
              <Shield className="h-4 w-4" />
              Data Security
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              Last updated: July 2026. Learn how we collect, process, and protect your information
              at CarrotHost.
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-soft space-y-10 text-sm md:text-base leading-relaxed text-muted-foreground">
            {/* 1. Information Collection */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                1. Information We Collect
              </h2>
              <p>
                We collect personal data necessary to establish accounts, process payments, and
                verify domain ownership. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your name, corporate details, email address, and billing address.</li>
                <li>
                  Payment details associated with bKash, Nagad, or credit transactions (processed
                  through secure, encrypted gateways).
                </li>
                <li>
                  Server login activities, IP logs, and system resource monitors for infrastructure
                  security.
                </li>
              </ul>
            </section>

            {/* 2. GTM Server-Side Proxy */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                2. GTM Server-Side Tracking Proxies
              </h2>
              <p>
                For clients utilizing our optimized **Node-Free Server-Side Tracking** on Webuzo
                Shared Hosting:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The server acts strictly as a secure proxy conduit, routing tracking requests
                  directly to GTM endpoints.
                </li>
                <li>
                  We do not record, inspect, inspect cookie headers, or cache visitor-level tracking
                  events on local database logs.
                </li>
                <li>
                  Your customer metrics pass directly to your destination metrics container in an
                  encrypted state.
                </li>
              </ul>
            </section>

            {/* 3. Data Storage & Hosting Locations */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                3. Hosting Locations & Data Center Physical Security
              </h2>
              <p>
                BDIX VPS data and associated local hosting backups are located in our Tier-III
                colocation data facility in Dhaka, Bangladesh, featuring biometric checks, CCTV
                surveillance, and 24/7 security staff. Global Xeon VPS instances are located in
                secure virtual clouds in Singapore, APAC, and USA.
              </p>
            </section>

            {/* 4. Information Sharing */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                4. Third-Party Sharing & Compliance
              </h2>
              <p>
                CarrotHost does not lease, sell, or trade client registration profiles to external
                advertising companies. We disclose information only:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  To register domains with global ICANN registries (WHOIS registry protocols).
                </li>
                <li>
                  To comply with regulatory subpoenas or law enforcement requests issued by
                  competent local courts.
                </li>
              </ul>
            </section>

            {/* 5. Contact Information */}
            <div className="rounded-2xl bg-secondary/50 border border-border p-5 flex items-start gap-4">
              <Lock className="h-6 w-6 text-brand-green shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">Data Privacy Concerns</h4>
                <p className="text-xs">
                  If you have questions regarding personal data privacy, access rights, or wish to
                  request data erasure, please connect with our support desk at **01787-882277**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
