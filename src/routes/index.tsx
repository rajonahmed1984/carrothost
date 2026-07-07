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
} from "lucide-react";
import { HeroNetwork } from "@/components/HeroNetwork";
import { DomainIcon, HostingIcon, BdixIcon, CloudIcon } from "@/components/ServiceIcons";


export const Route = createFileRoute("/")({
  component: Landing,
});

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-brand shadow-elegant flex items-center justify-center">
        <span className="text-brand-orange-foreground font-extrabold text-lg leading-none">C</span>
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-background" />
      </div>
      <span className="font-extrabold text-xl tracking-tight">
        Carrott<span className="text-brand-orange">Host</span>
      </span>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#services" className="hover:text-foreground transition">Services</a>
          <Link to="/domains" className="hover:text-foreground transition">Domains</Link>
          <Link to="/hosting" className="hover:text-foreground transition">Hosting</Link>
          <Link to="/vps" className="hover:text-foreground transition">BDIX VPS</Link>
          <Link to="/cloud-vps" className="hover:text-foreground transition">Cloud VPS</Link>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <a href="#why" className="hover:text-foreground transition">Why Us</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#login" className="hidden sm:inline text-sm font-medium hover:text-brand-orange transition">
            Client Login
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-soft">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--brand-orange) 0, transparent 40%), radial-gradient(circle at 80% 60%, var(--brand-green) 0, transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand-green">
              <MapPin className="h-3.5 w-3.5" />
              Made in Bangladesh · BDIX-optimized
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Hosting built for{" "}
              <span className="text-gradient-brand">Bangladeshi businesses</span> that can't afford to go offline.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Lightning-fast BDIX &amp; global servers, affordable domains, and a support team
              that answers in Bangla — backed by a 99.9% uptime guarantee and free bKash checkout.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
              >
                View Hosting Plans <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/domains"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground hover:border-brand-orange transition"
              >
                Search a Domain
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> Free SSL</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> 30-day money-back</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> bKash accepted</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card/60 p-4 md:p-6">
              <HeroNetwork />
            </div>
          <div id="domain-search" className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">

            <p className="text-sm font-semibold text-brand-green">Find your perfect domain</p>
            <h2 className="mt-1 text-xl font-bold">Register a domain in seconds</h2>
            <form
              className="mt-5 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1 flex items-center rounded-xl border border-input bg-background px-4 focus-within:ring-2 focus-within:ring-ring transition">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="yourbusiness"
                  className="w-full bg-transparent px-3 py-3 outline-none text-sm"
                />
                <span className="text-sm font-semibold text-muted-foreground">.com</span>
              </div>
              <button className="rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition">
                Search
              </button>
            </form>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { tld: ".com", price: "৳1,190" },
                { tld: ".com.bd", price: "৳1,800" },
                { tld: ".net", price: "৳1,290" },
                { tld: ".xyz", price: "৳290" },
              ].map((t) => (
                <div key={t.tld} className="rounded-lg bg-secondary/60 py-2">
                  <div className="font-bold text-foreground">{t.tld}</div>
                  <div className="text-brand-orange font-semibold">{t.price}/yr</div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { k: "99.9%", v: "Uptime SLA" },
          { k: "5,000+", v: "Happy Clients" },
          { k: "24/7", v: "Local Support" },
          { k: "<1s", v: "Avg Load Time" },
        ].map((s) => (
          <div key={s.v}>
            <div className="text-3xl md:text-4xl font-extrabold text-gradient-brand">{s.k}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Services() {
  const items = [
    {
      Icon: DomainIcon,
      title: "Domain Registration",
      desc: "Grab .com, .com.bd, .net and 300+ TLDs at honest local pricing with free DNS management.",
    },
    {
      Icon: HostingIcon,
      title: "Shared Hosting",
      desc: "LiteSpeed + NVMe cPanel hosting tuned for WordPress, WooCommerce and small business sites.",
    },
    {
      Icon: BdixIcon,
      title: "BDIX VPS",
      desc: "Dhaka-based BDIX servers deliver sub-10ms latency to Bangladeshi visitors — perfect for local audiences.",
    },
    {
      Icon: CloudIcon,
      title: "Cloud VPS",
      desc: "Scalable global cloud servers with full root access, snapshots and instant provisioning.",
    },
  ];
  return (
    <section id="services" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-brand-green">Our Services</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Everything you need to be online
          </h2>
          <p className="mt-3 text-muted-foreground">
            From your first domain to enterprise-grade infrastructure — CarrottHost grows with you.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-orange hover:shadow-elegant transition"
            >
              <div className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-foreground group-hover:text-brand-orange group-hover:border-brand-orange/40 transition">
                <s.Icon />
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

function WhyUs() {
  const rows = [
    { icon: Zap, title: "Blazing Fast Servers", desc: "LiteSpeed + NVMe SSD storage delivers page loads up to 3x faster." },
    { icon: Shield, title: "Enterprise Security", desc: "Free SSL, daily backups, malware scanning, and DDoS mitigation." },
    { icon: HeadphonesIcon, title: "Local Bangla Support", desc: "Talk to real humans in Bangla or English — 24 hours a day." },
    { icon: Check, title: "99.9% Uptime Promise", desc: "Backed by SLA credits if we ever fall short. Your site stays online." },
  ];
  return (
    <section id="why" className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-brand-green">Why CarrottHost</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            The hosting partner Bangladesh trusts
          </h2>
          <p className="mt-4 text-muted-foreground">
            We combine world-class infrastructure with a team that understands the local
            market — from bKash payments to Bangla-first support.
          </p>
          <a
            href="#pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            Start hosting today <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {rows.map((r) => (
            <div key={r.title} className="rounded-2xl bg-card border border-border p-5 shadow-soft">
              <div className="h-10 w-10 rounded-lg bg-gradient-brand text-primary-foreground flex items-center justify-center">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "৳149",
      tag: "For personal sites",
      features: ["1 Website", "10 GB NVMe SSD", "Unmetered Bandwidth", "Free SSL", "Weekly Backups", "Email Support"],
    },
    {
      name: "Business",
      price: "৳399",
      tag: "Most popular",
      highlight: true,
      features: ["Unlimited Websites", "50 GB NVMe SSD", "Free .com Domain", "Free SSL & CDN", "Daily Backups", "Priority Support"],
    },
    {
      name: "Pro Cloud",
      price: "৳899",
      tag: "For growing brands",
      features: ["Unlimited Websites", "150 GB NVMe SSD", "Free .com.bd Domain", "Dedicated Resources", "Real-time Backups", "24/7 Phone Support"],
    },
  ];
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Simple, transparent hosting plans
          </h2>
          <p className="mt-3 text-muted-foreground">
            No hidden fees. Cancel anytime. All plans include a 30-day money-back guarantee.
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                p.highlight
                  ? "border-brand-orange bg-card shadow-elegant scale-[1.02]"
                  : "border-border bg-card shadow-soft"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-1 text-xs font-bold text-primary-foreground">
                  {p.tag}
                </span>
              )}
              <div className="text-sm font-semibold text-brand-green">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              {!p.highlight && <p className="mt-1 text-sm text-muted-foreground">{p.tag}</p>}
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-brand-green mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#signup"
                className={`mt-8 inline-flex justify-center rounded-xl px-4 py-3 font-semibold transition ${
                  p.highlight
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant hover:opacity-95"
                    : "border border-border hover:border-brand-orange"
                }`}
              >
                Choose {p.name}
              </a>
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
      body: "Migrating to CarrottHost cut our page load time in half. Support answered on WhatsApp within minutes.",
    },
    {
      name: "Nusrat Jahan",
      role: "CTO, EduLift BD",
      body: "The cloud VPS is rock solid. We've had zero downtime in 14 months — exactly what our students need.",
    },
    {
      name: "Tanvir Hasan",
      role: "Agency Owner",
      body: "Reseller hosting made it easy to launch our own hosting brand. The WHM tools are genuinely powerful.",
    },
  ];
  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Loved by clients</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Real results from real businesses
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <figure key={q.name} className="rounded-2xl bg-card border border-border p-6 shadow-soft">
              <div className="flex gap-0.5 text-brand-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground leading-relaxed">"{q.body}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center font-bold">
                  {q.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
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
  const faqs = [
    { q: "Do you accept bKash and Nagad?", a: "Yes — we accept bKash, Nagad, Rocket, bank transfer, and international cards." },
    { q: "Where are your servers located?", a: "We operate data centers in Singapore and the USA, with a Dhaka edge node for low-latency delivery in Bangladesh." },
    { q: "Can I migrate my existing site?", a: "Absolutely. Our team handles free migration from any cPanel host — usually within 24 hours." },
    { q: "Is there a money-back guarantee?", a: "Yes, all hosting plans come with a 30-day money-back guarantee, no questions asked." },
  ];
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-card p-5 open:shadow-soft transition"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {f.q}
                <span className="ml-4 h-6 w-6 rounded-full bg-secondary text-brand-green flex items-center justify-center group-open:rotate-45 transition">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 md:p-16 shadow-elegant">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="text-primary-foreground max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Ready to launch your website?
              </h2>
              <p className="mt-3 opacity-90">
                Join thousands of Bangladeshi entrepreneurs on CarrottHost today. Free migration included.
              </p>
            </div>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 font-semibold text-foreground hover:bg-secondary transition"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div
            aria-hidden
            className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-brand-green/30 blur-3xl"
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Bangladesh's trusted partner for domain registration and premium web hosting.
          </p>
        </div>
        {[
          { title: "Services", links: ["Domains", "Shared Hosting", "BDIX VPS", "Cloud VPS", "Reseller", "SSL"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
          { title: "Support", links: ["Knowledge Base", "24/7 Chat", "Status", "Terms", "Privacy"] },
        ].map((c) => (
          <div key={c.title}>
            <div className="font-semibold text-sm">{c.title}</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-brand-orange transition">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} CarrottHost. All rights reserved. Dhaka, Bangladesh.</div>
          <div className="flex items-center gap-4">
            <span>Accepts bKash · Nagad · Visa · Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <WhyUs />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
