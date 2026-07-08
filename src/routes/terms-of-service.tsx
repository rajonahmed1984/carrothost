import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, jsonLdScript } from "@/lib/seo";
import { Shield, Scale, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/terms-of-service")({
  head: () => {
    const seo = createSeoMeta({
      title: "Terms of Service — CarrotHost",
      description:
        "Terms of Service and legal agreements for CarrotHost shared hosting, BDIX VPS, and Xeon Cloud VPS services.",
      path: "/terms-of-service",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-terms-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Terms of Service", path: "/terms-of-service" },
          ]),
        ),
      ],
    };
  },
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div>
      <Header />
      <div className="bg-gradient-soft py-16 md:py-24 border-b border-border/55">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-4 py-1.5 text-xs font-semibold text-brand-orange">
              <Scale className="h-4 w-4" />
              Legal Agreements
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              Last updated: July 2026. Please read these terms carefully before deploying services
              on CarrotHost.
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-soft space-y-10 text-sm md:text-base leading-relaxed text-muted-foreground">
            {/* 1. Overview */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, registering a domain, or deploying Webuzo shared hosting,
                BDIX VPS, or Xeon Cloud VPS instances through CarrotHost, you agree to comply with
                and be bound by these Terms of Service. If you do not agree, you must not use our
                services.
              </p>
            </section>

            {/* 2. Account & Payments */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
                2. Registration, Payments & Renewal
              </h2>
              <p>
                All account registrations must provide accurate and verifiable information. Payment
                options include bKash, Nagad, local bank transfers, and international cards.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Shared hosting accounts are billed annually.</li>
                <li>
                  BDIX and Xeon VPS services are billed monthly or annually depending on selection.
                </li>
                <li>
                  Invoices are generated 7 days before the renewal date. Suspended accounts may be
                  terminated after 5 days of non-payment.
                </li>
              </ul>
            </section>

            {/* 3. Acceptable Use Policy */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
                3. Acceptable Use Policy (AUP)
              </h2>
              <p>
                CarrotHost instances must be used for lawful purposes only. We strictly prohibit the
                hosting or distribution of:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Malware, viruses, phishing scripts, or booters.</li>
                <li>Unsolicited bulk email (SPAM) networks or mail bombers.</li>
                <li>Copyright-infringing or pirated material (DMCA violations).</li>
                <li>
                  Applications designed to overload network pipelines or scan ports maliciously.
                </li>
              </ul>
            </section>

            {/* 4. SLA & Uptime */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
                4. Service Level Agreement (SLA)
              </h2>
              <p>
                We pledge a **99.9% network and hardware uptime SLA** across our Webuzo shared
                nodes, BDIX local infrastructure in Dhaka, and global Xeon Platinum KVM hypervisors.
                In the event of unscheduled downtime exceeding the SLA threshold, clients may
                request billing credits.
              </p>
            </section>

            {/* 5. Backups & Data */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
                5. Backups and Data Loss
              </h2>
              <p>
                While CarrotHost implements automated weekly backups for shared hosting and daily
                snapshot logs for Xeon Cloud VPS, these are provided as a courtesy. Clients are
                solely responsible for maintaining local copies of their web databases and files.
                CarrotHost is not liable for data loss.
              </p>
            </section>

            {/* 6. Abuse Support */}
            <div className="rounded-2xl bg-secondary/50 border border-border p-5 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">
                  Reporting Abuse & SLA Claims
                </h4>
                <p className="text-xs">
                  To submit an SLA claim, report server abuse, or request technical support, please
                  contact our helpline directly via phone or WhatsApp at **01787-882277**.
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
