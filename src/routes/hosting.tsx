import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ArrowRight,
  LayoutDashboard,
  Mail,
  Database,
  Globe,
  Shield,
  Zap,
  Clock,
  HelpCircle,
  Server,
  Star,
  Activity,
  Lock,
  ShoppingBag,
  TrendingUp,
  Users,
  Phone,
  FolderOpen,
  Code,
  Settings,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { WebuzoMockup } from "@/components/WebuzoMockup";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  breadcrumbSchema,
  createSeoMeta,
  faqSchema,
  jsonLdScript,
  webHostingServiceSchema,
} from "@/lib/seo";

const HOSTING_FAQS = [
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

export const Route = createFileRoute("/hosting")({
  head: () => {
    const seo = createSeoMeta({
      title: "High-Performance Webuzo Hosting — CarrotHost",
      description:
        "Fast, reliable shared hosting in Bangladesh powered by Webuzo. LiteSpeed, NVMe SSD, server-side tracking, and 24/7 local support.",
      path: "/hosting",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-hosting-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Hosting", path: "/hosting" },
          ]),
        ),
        jsonLdScript(
          "ld-hosting-service",
          webHostingServiceSchema({
            name: "High-Performance Webuzo Hosting",
            description:
              "Fast shared hosting in Bangladesh with LiteSpeed, NVMe SSD, server-side tracking, Webuzo control panel, and 24/7 support.",
            path: "/hosting",
            serviceType: "Shared Web Hosting",
            priceFrom: "4200",
          }),
        ),
        jsonLdScript(
          "ld-hosting-faq",
          faqSchema(HOSTING_FAQS.map((item) => ({ question: item.q, answer: item.a }))),
        ),
      ],
    };
  },
  component: HostingPage,
});

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-soft border-b border-border/55 py-12 md:py-12">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 border border-brand-green/20 px-4 py-1.5 text-xs font-semibold text-brand-green">
              <Server className="h-4.5 w-4.5 animate-pulse" />
              Next-Gen Cloud Infrastructure
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              High-Performance <span className="text-gradient-brand">Cloud Hosting</span>
            </h1>
            <p className="text-lg md:text-xl font-bold text-foreground/90">
              Your Website’s Speed, Security, and Tracking—Fully Managed!
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Are you tired of slow loading times, random server crashes, and poor tracking data
              that ruins your ad campaigns? It’s time to upgrade. We run a fully customized,
              enterprise-grade Cloud Hosting platform engineered to handle high-traffic e-commerce
              ecosystems effortlessly.
            </p>
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
              >
                View Hosting Plans <ArrowRight className="h-4.5 w-4.5" />
              </a>
              <a
                href="tel:01787882277"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-4 font-bold text-foreground hover:border-brand-orange hover:bg-secondary/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Phone className="h-4.5 w-4.5 text-brand-green animate-bounce" /> Call 01787-882277
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-green opacity-10 blur-xl" />
            <WebuzoMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreOptimization() {
  return (
    <section className="py-16 md:py-24 border-b border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-soft hover:shadow-elegant transition duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-brand-orange/5 blur-3xl pointer-events-none" />
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
                Tuned for Maximum Uptime
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Optimized from the Linux Kernel Up
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Unlike traditional hosting companies that rely on default, restricted
                configurations, we optimize our servers from the Linux kernel level up. This ensures
                your business gets blistering speeds, server-side stability, and unmatched
                reliability under heavy traffic loads.
              </p>
              <div className="space-y-4">
                {[
                  "Optimized network socket buffers for low-latency transmission",
                  "Fine-tuned CPU scheduling to prioritize high-traffic web requests",
                  "I/O scheduler adjustments for blazing NVMe SSD read/write speeds",
                  "Pre-configured Nginx kernel variables to eliminate packet drops",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-brand-green" />
                    </div>
                    <span className="text-foreground/90 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative p-6 bg-slate-900 rounded-2xl border border-slate-800 text-slate-100 overflow-hidden shadow-elegant">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-orange/10 blur-3xl" />
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2 font-mono">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-green animate-ping" />
                  carrot-stack-optimization.conf
                </h3>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                  STABLE
                </span>
              </div>
              <div className="space-y-3.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">OS / Kernel</span>
                  <span className="text-brand-green font-semibold">Tuned Linux Kernel v6.8</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Web Engine</span>
                  <span className="text-brand-green font-semibold">Optimized Nginx Core</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">File Descriptors</span>
                  <span className="text-brand-orange font-semibold">fs.file-max = 65,535</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">GTM Proxies</span>
                  <span className="text-brand-green font-semibold">Node-Free Server Tracking</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Auto Guard</span>
                  <span className="text-brand-green font-semibold">Hourly Permission Cron</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExclusiveFeatures() {
  const features = [
    {
      icon: Activity,
      badge: "Performance Upgrade",
      title: "100% Node-Free Server-Side Tracking",
      desc: "If you are a digital marketer or e-commerce owner using Google Tag Manager (GTM) Server-Side Tracking, our hosting is the ultimate solution. We have eliminated heavy, crash-prone Node.js processes and integrated tracking proxies directly into the Nginx core.",
      benefit:
        "Track 100% of your customer journey even if third-party cookies are blocked, without draining your server's RAM or slowing down your main website by even a millisecond.",
    },
    {
      icon: Shield,
      badge: "Auto-Recovery",
      title: "Auto-Unlock & Permission Guard",
      desc: "A common frustration with standard hosting is when automated background scripts or updates break file permissions, locking you out with a '403 Forbidden' error.",
      benefit:
        "Our servers feature a custom 24/7 background automation script that detects and instantly fixes locked directories every hour. Your site stays accessible, always.",
    },
    {
      icon: Zap,
      badge: "High Capacity",
      title: "10x More Traffic Capacity",
      desc: "Most hosting environments crash when a few thousand visitors hit the site simultaneously during a flash sale or ad spike.",
      benefit:
        "We have scaled our server's Linux kernel constraints and Nginx file descriptor limits from the standard 1,024 up to 65,535 concurrent connections. No matter how big your Facebook or Google ad campaigns get, your site remains smooth and responsive.",
    },
    {
      icon: Lock,
      badge: "SSL Automation",
      title: "One-Click Custom Subdomains & Auto-SSL",
      desc: "Need a dedicated subdomain (e.g., ss.yourdomain.com) for tracking or isolated landing pages? You don't have to manually deal with complex SSL installations.",
      benefit:
        "Simply point your DNS to our server, and our background cron architecture will automatically issue and configure a free Let's Encrypt SSL certificate within 10 minutes.",
    },
    {
      icon: LayoutDashboard,
      badge: "Simple & Lightweight",
      title: "Lightweight Webuzo Control Panel",
      desc: "Say goodbye to bloated, slow, and expensive control panels.",
      benefit:
        "Our lightweight Webuzo panel gives you an intuitive, lightning-fast interface to manage your file manager, databases, and professional email accounts with zero technical hassle.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Exclusive Infrastructure
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Features you only get with our hosting
          </h2>
          <p className="mt-3 text-muted-foreground">
            We have custom-tuned our hosting platform to provide features that default setups simply
            cannot match.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className={`rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft hover:shadow-elegant hover:border-brand-orange transition duration-300 flex flex-col justify-between ${
                idx === 0
                  ? "lg:col-span-2 border-brand-green/30 bg-gradient-to-r from-card to-secondary/30"
                  : ""
              }`}
            >
              <div>
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand-green mb-4">
                  {f.badge}
                </span>
                <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3 mb-4 text-foreground">
                  <span className="h-10 w-10 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center shrink-0">
                    <f.icon className="h-5 w-5" />
                  </span>
                  {f.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-secondary/50 border-l-4 border-brand-green text-sm">
                <span className="font-bold text-foreground block mb-1">The Benefit:</span>
                <p className="text-muted-foreground leading-relaxed">{f.benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WebuzoFacilities() {
  const [activeTab, setActiveTab] = useState(0);

  const facilities = [
    {
      icon: Code,
      title: "1-Click App Installer",
      subtitle: "WordPress & 450+ Apps",
      desc: "Deploy WordPress, WooCommerce, Laravel, or Node.js apps in 5 seconds. No manual database creation, configuration, or file uploads required.",
      points: [
        "Instant one-click updates",
        "Backup before update option",
        "Automatic database creation",
        "Cloning & staging sites setup",
      ],
    },
    {
      icon: Mail,
      title: "Professional Email Server",
      subtitle: "Custom Addresses & Security",
      desc: "Create unlimited professional @yourdomain.com email accounts to communicate with your clients, fully secured with anti-spam filters.",
      points: [
        "IMAP/SMTP/POP3 support",
        "Modern Roundcube webmail interface",
        "Email forwarders & autoresponders",
        "Inbound spam assassin protection",
      ],
    },
    {
      icon: Database,
      title: "Database Management",
      subtitle: "MySQL & phpMyAdmin Access",
      desc: "Create MySQL databases and manage permissions visually. Check statistics, run queries, and optimize tables using a clean interface.",
      points: [
        "One-click phpMyAdmin launch",
        "Manage DB users and hosts",
        "Secure remote database access",
        "Automatic backups & optimizations",
      ],
    },
    {
      icon: Settings,
      title: "Multi-PHP Version Selector",
      subtitle: "PHP 7.4 to PHP 8.3",
      desc: "Run legacy projects alongside modern apps. Assign different PHP versions for individual domains and subdomains instantly with a click.",
      points: [
        "Supports PHP 7.4, 8.0, 8.1, 8.2, 8.3",
        "Toggle extensions & config limits",
        "Max file upload size controls",
        "Direct php.ini variables editing",
      ],
    },
    {
      icon: FolderOpen,
      title: "Advanced File Manager",
      subtitle: "Browser-based File Control",
      desc: "Manage your website files entirely from your browser. Upload, zip, unzip, and edit files inside a clean file manager with zero technical lag.",
      points: [
        "Drag & drop file upload",
        "Built-in code editor",
        "Fast zip & extract utilities",
        "Visual file permissions control",
      ],
    },
    {
      icon: RefreshCw,
      title: "Auto-SSL & DNS Manager",
      subtitle: "Instant Certificates & DNS Control",
      desc: "Secure every site automatically. The DNS manager allows you to manage A, MX, CNAME, and TXT records without touching the server command line.",
      points: [
        "Auto Let's Encrypt SSL issuance",
        "Auto-renews every 90 days",
        "Full DNS zone editing panel",
        "Redirect HTTP to HTTPS in 1-click",
      ],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-card relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Webuzo Facilities
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
            Control panel built for ultimate speed
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Say goodbye to bloated, expensive dashboards. Our lightweight Webuzo panel gives you an
            intuitive, lightning-fast interface with zero technical hassle.
          </p>
        </div>

        {/* Tabbed interface layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch mt-12">
          {/* Tabs selector */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 border-b lg:border-b-0 lg:border-r border-border pb-4 lg:pb-0 lg:pr-4 shrink-0">
            {facilities.map((fac, idx) => (
              <button
                key={fac.title}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 whitespace-nowrap lg:whitespace-normal shrink-0 ${
                  activeTab === idx
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant scale-[1.02]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <fac.icon className="h-5 w-5 shrink-0" />
                <div>
                  <span className="block text-xs opacity-75 font-normal">{fac.subtitle}</span>
                  <span className="block">{fac.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="lg:col-span-8 bg-secondary/30 rounded-3xl border border-border p-6 md:p-10 flex flex-col justify-between shadow-soft hover:shadow-elegant transition duration-300">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-border/60 pb-6">
                <div className="h-14 w-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  {(() => {
                    const ActiveIcon = facilities[activeTab].icon;
                    return <ActiveIcon className="h-7 w-7" />;
                  })()}
                </div>
                <div>
                  <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
                    {facilities[activeTab].subtitle}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">
                    {facilities[activeTab].title}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                {facilities[activeTab].desc}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {facilities[activeTab].points.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 text-sm font-semibold text-foreground/80"
                  >
                    <div className="h-5 w-5 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-brand-green" />
                    </div>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border/50 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
              <span>Included on all Starter, Standard & Advanced plans</span>
              <a
                href="https://earth.carrothost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-brand-orange hover:underline"
              >
                Panel Preview <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TargetAudience() {
  const groups = [
    {
      icon: ShoppingBag,
      title: "E-Commerce & F-Commerce Brands",
      desc: "Businesses running heavy ad spend who need maximum uptime, zero dropped checkouts, and blazing page load speeds during high-traffic spikes.",
    },
    {
      icon: TrendingUp,
      title: "Growth Marketers & Performance Agencies",
      desc: "Professionals and agencies who demand flawless conversion tracking data via reliable, server-side setups.",
    },
    {
      icon: Users,
      title: "High-Traffic Blogs & Corporate Portals",
      desc: "Publishers requiring seamless page speeds and server stability for thousands of daily readers.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/40 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-green">Built for Growth</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
            Who is this hosting built for?
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {groups.map((g) => (
            <div
              key={g.title}
              className="rounded-2xl bg-card border border-border p-6 shadow-soft hover:shadow-elegant hover:border-brand-orange transition duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center mb-5">
                <g.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{g.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
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
      price: "৳4,200.00",
      period: "/yr",
      tag: "Best for beginners",
      link: "https://portal.carrothost.com/store/webuzo-hosting/starter",
      features: [
        "5 GB SSD Storage",
        "250 GB Bandwidth",
        "1 Website",
        "Standard Performance",
        "Vulnerability Protection",
        "SSL Certificates",
      ],
    },
    {
      name: "Standard",
      price: "৳8,400.00",
      period: "/yr",
      tag: "Most popular",
      highlight: true,
      link: "https://portal.carrothost.com/store/webuzo-hosting/standard",
      features: [
        "10 GB SSD Storage",
        "500 GB Bandwidth",
        "1 Website",
        "Standard Performance",
        "Vulnerability Protection",
        "SSL Certificates",
      ],
    },
    {
      name: "Advanced",
      price: "৳12,000.00",
      period: "/yr",
      tag: "Power users",
      link: "https://portal.carrothost.com/store/webuzo-hosting/advanced",
      features: [
        "20 GB SSD Storage",
        "1000 GB Bandwidth",
        "1 Website",
        "Standard Performance",
        "Vulnerability Protection",
        "SSL Certificates",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Pricing Plans</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Transparent shared hosting plans
          </h2>
          <p className="mt-3 text-muted-foreground">
            Billed annually. All plans include 24/7 support and 100% free website migration.
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
                <span className="text-muted-foreground text-sm font-semibold">{p.period}</span>
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
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex justify-center items-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${
                  p.highlight
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant hover:opacity-95 animate-pulse"
                    : "border border-border bg-card hover:border-brand-orange text-foreground"
                }`}
              >
                Order Now
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
    {
      icon: Zap,
      title: "LiteSpeed Cache",
      desc: "Built-in server-level caching makes WordPress and static sites load instantly.",
    },
    {
      icon: Shield,
      title: "Free SSL",
      desc: "AutoSSL issues and renews Let’s Encrypt certificates for every domain.",
    },
    {
      icon: Clock,
      title: "Daily Backups",
      desc: "Incremental backups stored off-site. Restore any file or database in one click.",
    },
    {
      icon: HelpCircle,
      title: "Bangla Support",
      desc: "Talk to real humans in Bangla or English — 24 hours a day, 365 days a year.",
    },
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
            <div
              key={i.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-orange hover:shadow-elegant transition"
            >
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
  const faqs = HOSTING_FAQS;

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Common questions about hosting
          </h2>
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

function MigrationCTA() {
  return (
    <section className="py-20 md:py-24 bg-card">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl bg-gradient-brand p-10 md:p-14 text-center text-primary-foreground shadow-elegant relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 20%, white 0, transparent 30%), radial-gradient(circle at 90% 80%, white 0, transparent 30%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white mb-4">
              100% Free Website Migration
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Migrate to Our Server Today—100% Free!
            </h2>
            <p className="mt-4 max-w-2xl mx-auto opacity-95 text-base md:text-lg">
              Don't let migration worries hold you back. Our engineering team will handle your
              entire website transfer completely free of charge, ensuring zero downtime for your
              business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="https://wa.me/8801787882277"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft"
              >
                Inbox Us to Migrate <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="tel:01787882277"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white hover:bg-white/20 transition"
              >
                <Phone className="h-4 w-4" /> Call: 01787-882277
              </a>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs opacity-90">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Full Website Transfer
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Zero Downtime Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> SSL & DNS Configuration
              </span>
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
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-3 gap-8 text-center">
        {[
          { k: "99.9%", v: "Uptime Guarantee" },
          { k: "< 15m", v: "Response SLA" },
          { k: "Free", v: "Site Migration" },
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

function HostingPage() {
  return (
    <div>
      <Header />
      <Hero />
      <TrustBar />
      <CoreOptimization />
      <ExclusiveFeatures />
      <WebuzoFacilities />
      <TargetAudience />
      <Pricing />
      <Included />
      <FAQ />
      <MigrationCTA />
      <Footer />
    </div>
  );
}
