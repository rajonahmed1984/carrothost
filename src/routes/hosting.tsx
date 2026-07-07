import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ArrowRight,
  LayoutDashboard,
  MousePointerClick,
  Mail,
  Database,
  Globe,
  Shield,
  Zap,
  Clock,
  HelpCircle,
  Server,
  Star,
} from "lucide-react";
import { WebuzoMockup } from "@/components/WebuzoMockup";

export const Route = createFileRoute("/hosting")({
  head: () => ({
    meta: [
      { title: "Shared Hosting — CarrottHost" },
      { name: "description", content: "Fast, reliable shared hosting in Bangladesh powered by Webuzo. LiteSpeed, NVMe SSD, free SSL, and 24/7 local support." },
      { property: "og:title", content: "Shared Hosting — CarrottHost" },
      { property: "og:description", content: "Bangladesh shared hosting with Webuzo control panel, LiteSpeed servers, and transparent pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HostingPage,
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-brand shadow-elegant flex items-center justify-center">
        <span className="text-brand-orange-foreground font-extrabold text-lg leading-none">C</span>
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-background" />
      </div>
      <span className="font-extrabold text-xl tracking-tight">
        Carrott<span className="text-brand-orange">Host</span>
      </span>
    </Link>
  );
}

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">Home</Link>
          <Link to="/domains" className="hover:text-foreground transition">Domains</Link>
          <Link to="/hosting" className="text-foreground font-semibold transition">Hosting</Link>
          <Link to="/vps" className="hover:text-foreground transition">BDIX VPS</Link>
          <Link to="/cloud-vps" className="hover:text-foreground transition">Cloud VPS</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
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
      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand-green">
              <Server className="h-3.5 w-3.5" />
              LiteSpeed + NVMe SSD
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
              Shared hosting powered by <span className="text-brand-orange">Webuzo</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Manage websites, databases, emails, and apps from one clean dashboard. Built for Bangladeshi businesses that demand speed and simplicity.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
              >
                View Plans <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/domains"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground hover:border-brand-orange transition"
              >
                Register a Domain
              </Link>
            </div>
          </div>
          <WebuzoMockup />
        </div>
      </div>

    </section>
  );
}

function ControlPanel() {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Clean Dashboard",
      desc: "A modern, uncluttered interface that puts every tool within two clicks — no training required.",
    },
    {
      icon: MousePointerClick,
      title: "One-Click Installer",
      desc: "Deploy WordPress, Joomla, Drupal, and 400+ apps in seconds. No manual uploads or database setup.",
    },
    {
      icon: Mail,
      title: "Email Management",
      desc: "Create professional @yourdomain.com addresses, set up forwarders, and manage mailboxes with ease.",
    },
    {
      icon: Database,
      title: "Database Tools",
      desc: "Create MySQL databases, manage users, and access phpMyAdmin directly from the panel.",
    },
    {
      icon: Globe,
      title: "Domain & DNS",
      desc: "Add addon domains, create subdomains, and manage DNS records without touching a command line.",
    },
    {
      icon: Shield,
      title: "Security Center",
      desc: "Enable free SSL certificates, configure hotlink protection, and manage IP blocks in one place.",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-sm font-semibold text-brand-green">Control Panel</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Webuzo makes hosting effortless
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Webuzo is a powerful yet simple control panel designed for modern web hosting. Whether you are launching your first blog or managing a portfolio of client sites, every tool is where you expect it to be — fast, visual, and beginner-friendly.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "No technical skills required — everything is point-and-click",
                "Built-in file manager with drag-and-drop uploads",
                "Real-time resource usage charts at a glance",
                "Automatic backups and one-click restore",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:border-brand-orange hover:shadow-elegant transition">
                <div className="h-10 w-10 rounded-lg bg-gradient-brand text-primary-foreground flex items-center justify-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-sm">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
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
      features: [
        "1 Website",
        "10 GB NVMe SSD",
        "Unmetered Bandwidth",
        "Webuzo Control Panel",
        "Free SSL Certificate",
        "Weekly Backups",
        "Email Support",
      ],
    },
    {
      name: "Pro",
      price: "৳399",
      tag: "Most popular",
      highlight: true,
      features: [
        "10 Websites",
        "50 GB NVMe SSD",
        "Unmetered Bandwidth",
        "Webuzo Control Panel",
        "Free SSL & CDN",
        "Free .com Domain (1st yr)",
        "Daily Backups",
        "Priority Support",
      ],
    },
    {
      name: "Business",
      price: "৳899",
      tag: "For growing brands",
      features: [
        "Unlimited Websites",
        "150 GB NVMe SSD",
        "Unmetered Bandwidth",
        "Webuzo Control Panel",
        "Free SSL & CDN",
        "Free .com.bd Domain",
        "Dedicated IP Address",
        "Real-time Backups",
        "24/7 Phone Support",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Transparent shared hosting plans
          </h2>
          <p className="mt-3 text-muted-foreground">
            No hidden fees. Every plan includes a 30-day money-back guarantee and free migration.
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

function Included() {
  const items = [
    { icon: Zap, title: "LiteSpeed Cache", desc: "Built-in server-level caching makes WordPress and static sites load instantly." },
    { icon: Shield, title: "Free SSL", desc: "AutoSSL issues and renews Let’s Encrypt certificates for every domain." },
    { icon: Clock, title: "Daily Backups", desc: "Incremental backups stored off-site. Restore any file or database in one click." },
    { icon: HelpCircle, title: "Bangla Support", desc: "Talk to real humans in Bangla or English — 24 hours a day, 365 days a year." },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Everything Included</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            The extras that make a difference
          </h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((i) => (
            <div key={i.title} className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-orange hover:shadow-elegant transition">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-brand-green group-hover:bg-gradient-brand group-hover:text-primary-foreground transition">
                <i.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{i.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What is Webuzo and why do you use it?",
      a: "Webuzo is a modern, lightweight control panel that makes managing websites, databases, and emails simple. We chose it because it is faster, cleaner, and more affordable than legacy panels — and it gives you one-click access to 400+ apps.",
    },
    {
      q: "Can I migrate my existing site for free?",
      a: "Yes. Our team handles free migration from any cPanel or Webuzo host. Most transfers are completed within 24 hours with zero downtime.",
    },
    {
      q: "Do I get email accounts with hosting?",
      a: "Every plan includes professional email hosting. Create unlimited @yourdomain.com addresses, set up forwarders, and access webmail from any browser.",
    },
    {
      q: "What if I outgrow shared hosting?",
      a: "Upgrading is seamless. Move to our BDIX VPS or Cloud VPS plans with a few clicks — your data, emails, and settings transfer automatically.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">Common questions about hosting</h2>
        </div>
        <div className="mt-14 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-bold text-base flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                {faq.q}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed pl-8">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl bg-gradient-brand p-10 md:p-14 text-center text-primary-foreground shadow-elegant relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 10% 20%, white 0, transparent 30%), radial-gradient(circle at 90% 80%, white 0, transparent 30%)",
          }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Ready to launch your website?
            </h2>
            <p className="mt-4 max-w-xl mx-auto opacity-90">
              Pick a plan, register your domain, and go live in minutes — backed by our 30-day guarantee.
            </p>
            <a
              href="#pricing"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-orange hover:bg-white/90 transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </a>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Free migration</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> 30-day guarantee</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> bKash accepted</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-brand shadow-elegant flex items-center justify-center">
                <span className="text-brand-orange-foreground font-extrabold text-lg leading-none">C</span>
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-background" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">
                Carrott<span className="text-brand-orange">Host</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Reliable domain & hosting for Bangladesh. BDIX-optimized, locally supported, and built to scale.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/domains" className="hover:text-foreground transition">Domain Registration</Link></li>
              <li><Link to="/hosting" className="hover:text-foreground transition">Shared Hosting</Link></li>
              <li><Link to="/vps" className="hover:text-foreground transition">BDIX VPS</Link></li>
              <li><Link to="/cloud-vps" className="hover:text-foreground transition">Cloud VPS</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition">About</Link></li>
              <li><Link to="/" className="hover:text-foreground transition">Contact</Link></li>
              <li><Link to="/" className="hover:text-foreground transition">Terms</Link></li>
              <li><Link to="/" className="hover:text-foreground transition">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition">Help Center</Link></li>
              <li><Link to="/" className="hover:text-foreground transition">Status</Link></li>
              <li><Link to="/" className="hover:text-foreground transition">Migrate to Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} CarrottHost. All rights reserved.</p>
          <p>Made with care in Dhaka, Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}

function HostingPage() {
  return (
    <div>
      <PageHeader />
      <Hero />
      <ControlPanel />
      <Pricing />
      <Included />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
