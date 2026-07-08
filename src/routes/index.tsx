import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Globe,
  Shield,
  Zap,
  HeadphonesIcon,
  ArrowRight,
  Star,
  MapPin,
  Cpu,
  Server,
  Network,
  Phone,
} from "lucide-react";
import { HeroNetwork } from "@/components/HeroNetwork";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, faqSchema, jsonLdScript } from "@/lib/seo";

const HOME_FAQS = [
  {
    q: "Do you accept bKash and Nagad?",
    a: "Yes — we accept bKash, Nagad, Rocket, bank transfer, and international cards.",
  },
  {
    q: "Where are your servers located?",
    a: "We operate data centers in Singapore, USA, and a Tier-III facility right here in Dhaka for low-latency delivery in Bangladesh.",
  },
  {
    q: "Can I migrate my existing site?",
    a: "Absolutely. Our team handles free migration from any host — usually within 24 hours with zero downtime.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes, all hosting plans come with a 30-day money-back guarantee, no questions asked.",
  },
];

export const Route = createFileRoute("/")({
  head: () => {
    const seo = createSeoMeta({
      title: "CarrotHost — Reliable Domain & Web Hosting in Bangladesh",
      description:
        "Fast, secure, and affordable domain registration, Webuzo hosting, BDIX VPS, and Xeon VPS for Bangladesh with local support.",
      path: "/",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript("ld-home-breadcrumbs", breadcrumbSchema([{ name: "Home", path: "/" }])),
        jsonLdScript(
          "ld-home-faq",
          faqSchema(HOME_FAQS.map((item) => ({ question: item.q, answer: item.a }))),
        ),
      ],
    };
  },
  component: Landing,
});

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-soft py-12 md:py-12 border-b border-border/55">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 border border-brand-green/20 px-4 py-1.5 text-xs font-semibold text-brand-green">
              <MapPin className="h-4 w-4" />
              BDIX-Optimized · High-Performance Hosting
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Hosting Built for <span className="text-gradient-brand">Bangladeshi Brands</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Blazing fast GTM tracking shared hosting, local sub-10ms BDIX VPS, and enterprise
              Intel Xeon Cloud servers. Backed by 24/7 expert support and local payment methods.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/hosting"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
              >
                Explore Webuzo Hosting <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <a
                href="https://portal.carrothost.com/cart.php?a=add&domain=register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-bold text-foreground hover:border-brand-orange hover:bg-secondary/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                Register Domain
              </a>
            </div>
            <div className="pt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-t border-border/50">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> Free Migration
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> bKash & Nagad
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> 99.9% Uptime SLA
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-soft">
              <HeroNetwork />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { k: "99.9%", v: "Uptime SLA" },
          { k: "5,000+", v: "Active Deployments" },
          { k: "24/7/365", v: "Expert Support" },
          { k: "< 10ms", v: "Dhaka Network Latency" },
        ].map((s) => (
          <div key={s.v}>
            <div className="text-3xl md:text-4xl font-extrabold text-gradient-brand">{s.k}</div>
            <div className="mt-1 text-sm text-muted-foreground font-medium">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Services() {
  const items = [
    {
      icon: Globe,
      title: "Shared Webuzo Hosting",
      desc: "LiteSpeed & NVMe storage optimized for high traffic e-commerce. Features 100% Node-Free GTM server-side tracking proxies and Hourly Auto-Unlock Guard.",
      to: "/hosting",
      price: "From ৳4,200.00 / year",
    },
    {
      icon: Network,
      title: "BDIX Cloud VPS",
      desc: "Dhaka-based KVM virtual servers connected directly to BDIX. Delivers lightning-fast sub-10ms speeds to local audiences, perfect for local portals.",
      to: "/bdix-cloud-vps",
      price: "From ৳1,550.00 / month",
    },
    {
      icon: Cpu,
      title: "Xeon Cloud VPS",
      desc: "Enterprise Intel Xeon Platinum hypervisors powered by Webdock remote dashboard panel. Ideal for compute-heavy workloads and compilation pipelines.",
      to: "/xeon-cloud-vps",
      price: "From ৳607.00 / month",
    },
  ];

  return (
    <section id="services" className="py-20 md:py-28 bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Our Core Services
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
            High-availability cloud hosting
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Choose the perfect infrastructure for your business, backed by direct local peering and
            responsive support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((s) => (
            <div
              key={s.title}
              className="group relative rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between shadow-soft hover:shadow-elegant hover:border-brand-orange/60 transition duration-300"
            >
              <div className="space-y-5">
                <div className="h-12 w-12 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:bg-gradient-brand group-hover:text-primary-foreground transition duration-300">
                  <s.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-green">{s.price}</span>
                <Link
                  to={s.to}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-orange group-hover:translate-x-1 transition duration-200"
                >
                  Explore Plans <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const rows = [
    {
      icon: Zap,
      title: "Tuned Linux Kernel",
      desc: "We customize server socket buffers, scheduling variables, and Nginx connections to handle traffic easily.",
    },
    {
      icon: Shield,
      title: "Enterprise Mitigation",
      desc: "Network-level DDoS traffic scrubbing up to 100 Gbps guards your virtual servers 24/7.",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Local Support",
      desc: "Resolve server issues instantly with local technical engineers over phone or WhatsApp.",
    },
    {
      icon: Check,
      title: "bKash & Nagad Gateways",
      desc: "Pay securely in BDT via local mobile banking options with instant checkout processing.",
    },
  ];

  return (
    <section id="why" className="py-20 md:py-28 bg-card border-y border-border/50">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Why CarrotHost
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            The hosting partner Bangladesh trusts
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We combine high-performance global network peering with local features designed for
            Bangladesh — from bKash integrations to Bangla-speaking engineers.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/hosting"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:01787882277"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-6 py-3 font-bold text-foreground hover:bg-secondary/40 transition"
            >
              <Phone className="h-4 w-4 text-brand-green" /> 01787-882277
            </a>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {rows.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elegant transition duration-300"
            >
              <div className="h-10 w-10 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-sm">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Rafiq Ahmed",
      role: "Founder, Dhaka Threads",
      body: "Migrating our WooCommerce store to CarrotHost cut our check-out delay by half. GTM server-side tracking proxy captured 100% of our Facebook ad campaigns data.",
    },
    {
      name: "Nusrat Jahan",
      role: "CTO, EduLift BD",
      body: "The BDIX VPS is rock solid. We've had zero downtime in 14 months and Bangladeshi students experience sub-10ms site loading speed.",
    },
    {
      name: "Tanvir Hasan",
      role: "Agency Owner",
      body: "The Intel Xeon Cloud VPS is incredibly fast for dynamic compilation. Webdock dashboard makes rebuilding nodes simple.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Reviews
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Loved by local developers & agencies
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft flex flex-col justify-between hover:shadow-elegant transition duration-300"
            >
              <div>
                <div className="flex gap-0.5 text-brand-orange">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 text-sm text-foreground/80 leading-relaxed font-medium">
                  &ldquo;{q.body}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-8 pt-6 border-t border-border/50 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
                  {q.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{q.name}</div>
                  <div className="text-xs text-muted-foreground font-semibold">{q.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = HOME_FAQS;

  return (
    <section id="faq" className="py-20 md:py-28 bg-card border-t border-border/50">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border bg-card p-5 open:shadow-soft transition"
            >
              <summary className="flex cursor-pointer items-center justify-between font-bold text-sm md:text-base text-foreground/90">
                {f.q}
                <span className="ml-4 h-6 w-6 rounded-full bg-secondary text-brand-green flex items-center justify-center group-open:rotate-45 transition shrink-0">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed pl-1">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 bg-card border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 md:p-16 shadow-elegant text-center">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 20%, white 0, transparent 30%), radial-gradient(circle at 90% 80%, white 0, transparent 30%)",
            }}
          />
          <div className="relative z-10 text-primary-foreground max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to launch your website?
            </h2>
            <p className="opacity-95 text-base md:text-lg">
              Join thousands of Bangladeshi entrepreneurs on CarrotHost today. Free migration
              included.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/hosting"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft animate-bounce"
              >
                View Hosting Plans <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:01787882277"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white hover:bg-white/20 transition"
              >
                <Phone className="h-4 w-4" /> Call: 01787-882277
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div>
      <Header />
      <Hero />
      <TrustBar />
      <Services />
      <WhyUs />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
