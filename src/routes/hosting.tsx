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
  Download,
  Layers,
  Cpu,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Sparkles,
  X,
  FileCode2,
  CheckCheck,
} from "lucide-react";
import { useState } from "react";
import { WebuzoMockup } from "@/components/WebuzoMockup";
import { ServerSideTrackerMockup } from "@/components/ServerSideTrackerMockup";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  breadcrumbSchema,
  createSeoMeta,
  faqSchema,
  jsonLdScript,
  webHostingServiceSchema,
  SITE_URL,
} from "@/lib/seo";

const HOSTING_FAQS = [
  {
    q: "How does CarrotHost serve as a Stape.io alternative in Bangladesh?",
    a: "Platforms like Stape.io or Google Cloud Platform (GCP) require recurring monthly dollar subscriptions ($20–$100/mo) and international dual-currency credit cards. In contrast, CarrotHost provides 100% Node-Free Server-Side Tracking built right into our high-speed cloud hosting at no additional monthly subscription, with easy local payments via bKash, Nagad, and Bangladeshi bank cards.",
  },
  {
    q: "What is '100% Node-Free' Server-Side Tracking and why is it better?",
    a: "Standard server-side GTM containers run heavy Node.js or Docker processes that consume 1 GB to 2 GB of RAM and frequently cause memory leaks or server crashes during traffic spikes. Our 100% Node-Free tracking handles tracking proxies directly inside the Nginx C-level core, requiring 0 MB of Node.js memory overhead with ultra-low latency (<10ms) and zero server crashes.",
  },
  {
    q: "How do I install and configure the carrothost-server-side-tracker.zip plugin on WordPress?",
    a: "It takes under 2 minutes: 1) Download 'carrothost-server-side-tracker.zip' from this page, 2) Upload and activate it in your WordPress dashboard under Plugins > Add New, 3) Open 'Carrothost SST' settings, enter your Meta Pixel ID and CAPI Access Token, and click 'Run Test Ping'. The plugin automatically tracks WooCommerce purchases, add-to-carts, and checkouts with 9+ Event Match Quality (EMQ).",
  },
  {
    q: "Will this bypass Ad Blockers and iOS 14.5+ tracking restrictions?",
    a: "Yes. By routing tracking requests through your own custom first-party domain (e.g. yourdomain.com/metrics/gtm.js), ad blockers, Brave browser shields, and Safari Intelligent Tracking Prevention (ITP) recognize the data as legitimate first-party traffic rather than third-party tracking scripts.",
  },
  {
    q: "Can I migrate my existing WordPress site for free?",
    a: "Yes! Our engineering team handles 100% free website migration from any cPanel, Webuzo, or VPS host. Most migrations are completed within a few hours with zero downtime guarantee.",
  },
  {
    q: "What is Webuzo and how does it compare to cPanel?",
    a: "Webuzo is a modern, lightweight control panel engineered for maximum performance. It consumes less than half the server resources of legacy cPanel, provides an intuitive interface for databases, emails, and file management, and includes a 1-click installer for WordPress and 450+ applications.",
  },
  {
    q: "Can I pay in BDT using bKash or Nagad?",
    a: "Yes! We accept bKash, Nagad, Rocket, Upay, and all major Bangladeshi debit and credit cards through secure local payment gateways. No international passport endorsement or USD cards required.",
  },
];

export const Route = createFileRoute("/hosting")({
  head: () => {
    const seo = createSeoMeta({
      title: "High-Performance Cloud Hosting with Node-Free Server-Side Tracking | CarrotHost",
      description:
        "Fast, reliable Webuzo cloud hosting in Bangladesh with 100% Node-Free Server-Side Tracking (Meta CAPI & GTM). Affordable Stape.io alternative with free WordPress plugin, NVMe SSD, and 24/7 local support.",
      path: "/hosting",
    });

    const sstSoftwareSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Carrothost Server-Side Tracker",
      operatingSystem: "WordPress 5.8+, WooCommerce",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BDT",
        description: "Included 100% free with all CarrotHost Cloud Hosting plans.",
      },
      description:
        "High-speed, 100% Node-Free Server-Side Tracking plugin for WordPress, Google Tag Manager & Meta Conversions API (CAPI) powered by CarrotHost Nginx Core.",
      downloadUrl: `${SITE_URL}/carrothost-server-side-tracker.zip`,
      softwareVersion: "1.3.5",
      publisher: {
        "@type": "Organization",
        name: "CarrotHost",
        url: SITE_URL,
      },
    };

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
            name: "High-Performance Cloud Hosting with Server-Side Tracking",
            description:
              "Fast shared & cloud hosting in Bangladesh with 100% Node-Free Server-Side Tracking (Meta CAPI & GTM), Speedy Cache, NVMe SSD, Webuzo control panel, and 24/7 Bangla support.",
            path: "/hosting",
            serviceType: "Shared & Cloud Web Hosting",
            priceFrom: "4200",
          }),
        ),
        jsonLdScript("ld-sst-software", sstSoftwareSchema),
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
  const [heroView, setHeroView] = useState<"sst" | "webuzo">("sst");

  return (
    <section className="relative overflow-hidden bg-gradient-soft border-b border-border/55 py-12 md:py-16">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 border border-brand-green/25 px-4 py-1.5 text-xs font-semibold text-brand-green">
              <Sparkles className="h-4 w-4 animate-pulse text-brand-green" />
              <span>100% Node-Free Server-Side Tracking Built-In</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-foreground">
              High-Performance Cloud Hosting with{" "}
              <span className="text-gradient-brand">Server-Side Tracking</span>
            </h1>

            <p className="text-lg md:text-xl font-bold text-foreground/90 leading-snug">
              The Smart Stape.io Alternative in Bangladesh — 100% Accurate Meta CAPI & GTM Data with
              0 MB Node.js Overhead!
            </p>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Are you tired of losing 30%+ of your Facebook and Google ad conversions to iOS 14+
              restrictions and ad blockers? Stop paying expensive monthly dollar fees for Stape.io
              or complex GCP servers. We engineered an enterprise-grade cloud hosting platform with{" "}
              <strong className="text-foreground">native Nginx-level server tracking</strong> and an
              official <strong className="text-foreground">WordPress SST plugin</strong> included
              free!
            </p>

            {/* Quick value props pill list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-medium text-foreground/85">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Bypass Ad Blockers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Zero RAM Memory Leaks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Free WordPress Plugin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Pay via bKash / Nagad</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Meta CAPI EMQ 9.5+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Free Site Migration</span>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="pt-3 space-y-3">
              <div className="flex flex-wrap gap-3.5 items-center">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
                >
                  View Hosting Plans (From ৳4,200/yr) <ArrowRight className="h-4.5 w-4.5" />
                </a>

                <a
                  href="#wordpress-plugin"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green/10 px-5 py-3.5 font-bold text-brand-green hover:bg-brand-green/20 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Download className="h-4.5 w-4.5" /> Free WP Plugin .zip
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse shrink-0" />
                <span>Need migration or tracking help?</span>
                <a
                  href="https://wa.me/8801787882277"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-brand-green hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> WhatsApp 01787-882277
                </a>
                <span className="hidden sm:inline opacity-70">— 24/7 Bangla Support</span>
              </div>
            </div>
          </div>

          {/* Hero Visual: Interactive Mockup Switcher */}
          <div className="lg:col-span-5 relative space-y-3 lg:pt-1">
            {/* View Switcher Bar */}
            <div className="flex items-center justify-center p-1 rounded-xl bg-secondary/80 border border-border max-w-xs mx-auto text-xs font-semibold">
              <button
                onClick={() => setHeroView("sst")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                  heroView === "sst"
                    ? "bg-card text-foreground shadow-soft font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⚡ Server-Side Tracker
              </button>
              <button
                onClick={() => setHeroView("webuzo")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                  heroView === "webuzo"
                    ? "bg-card text-foreground shadow-soft font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🖥️ Webuzo Control Panel
              </button>
            </div>

            <div className="relative">
              {heroView === "sst" ? <ServerSideTrackerMockup /> : <WebuzoMockup />}
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
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { k: "0 MB", v: "Node.js RAM Overhead", sub: "Nginx C-Core tracking" },
          { k: "100%", v: "Data Accuracy", sub: "Bypasses iOS 14 & AdBlock" },
          { k: "৳0", v: "Extra Monthly Fee", sub: "Free with Cloud Hosting" },
          { k: "10x", v: "Traffic Spike Capacity", sub: "Zero 503 errors on viral ads" },
        ].map((s) => (
          <div key={s.v} className="p-2">
            <div className="text-3xl md:text-4xl font-extrabold text-gradient-brand">{s.k}</div>
            <div className="mt-1 text-sm text-foreground font-bold">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StapeComparison() {
  const comparisonItems = [
    {
      feature: "Monthly Tracking Subscription",
      carrothost: "৳0 / Month (Included Free with Hosting)",
      stape: "$20 – $100+ USD / Month",
      gcp: "$120+ USD / Month (+ Dev fees)",
      isWin: true,
    },
    {
      feature: "Payment Method",
      carrothost: "bKash, Nagad, Local Cards (BDT)",
      stape: "Dual-currency USD Credit Card only",
      gcp: "Dual-currency USD Credit Card only",
      isWin: true,
    },
    {
      feature: "Server Architecture",
      carrothost: "100% Node-Free Nginx Reverse Proxy Core",
      stape: "Heavy Docker & Node.js Containers",
      gcp: "Complex Google Cloud Run / App Engine",
      isWin: true,
    },
    {
      feature: "Server Memory & RAM Overhead",
      carrothost: "0 MB RAM (Zero memory leaks, never crashes)",
      stape: "High Memory Footprint (1-2 GB+ RAM)",
      gcp: "High Resource Usage & Scaling Costs",
      isWin: true,
    },
    {
      feature: "WordPress & WooCommerce Plugin",
      carrothost: "Official Free Plugin (carrothost-sst.zip)",
      stape: "Requires manual container tagging",
      gcp: "Manual GTM Server Container setup",
      isWin: true,
    },
    {
      feature: "Meta CAPI Event Match Quality (EMQ)",
      carrothost: "9.0+ / 10 (Deep hashed WooCommerce data)",
      stape: "Varies by setup complexity",
      gcp: "Varies by custom coding",
      isWin: true,
    },
    {
      feature: "Ad Blocker & Safari ITP Bypass",
      carrothost: "100% First-Party Custom Domain Proxy",
      stape: "Paid custom domain upgrade required",
      gcp: "Requires manual load balancer & DNS",
      isWin: true,
    },
    {
      feature: "Customer Support & Migration",
      carrothost: "24/7 Bangla & English Phone/WhatsApp Support",
      stape: "Email ticket queue (English only)",
      gcp: "Paid enterprise support tiers only",
      isWin: true,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-card border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 border border-brand-green/20 px-3.5 py-1 rounded-full">
            Stape.io & GCP Alternative in Bangladesh
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
            Why Pay Extra Dollars for Tracking When CarrotHost Includes It for Free?
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Most Bangladeshi e-commerce merchants waste thousands of dollars every year on Stape.io
            or Google Cloud Platform just to run Facebook CAPI. Here is how CarrotHost completely
            replaces them.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-border bg-background shadow-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-4 md:p-5 font-bold text-foreground w-1/3">Feature / Benefit</th>
                  <th className="p-4 md:p-5 font-extrabold text-primary bg-primary/10 border-x border-primary/20 w-1/3">
                    <div className="flex items-center gap-1.5 text-base">
                      <Zap className="h-4.5 w-4.5 text-brand-orange" />
                      <span>CarrotHost Cloud</span>
                    </div>
                    <span className="text-[11px] font-normal text-muted-foreground block mt-0.5">
                      100% Node-Free Built-in
                    </span>
                  </th>
                  <th className="p-4 md:p-5 font-semibold text-muted-foreground w-1/6">
                    Stape.io
                    <span className="text-[11px] font-normal text-muted-foreground block mt-0.5">
                      Third-party Hosted
                    </span>
                  </th>
                  <th className="p-4 md:p-5 font-semibold text-muted-foreground w-1/6">
                    Google Cloud (GCP)
                    <span className="text-[11px] font-normal text-muted-foreground block mt-0.5">
                      Self-Managed Server
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonItems.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={`transition hover:bg-secondary/30 ${
                      idx % 2 === 0 ? "bg-card" : "bg-background"
                    }`}
                  >
                    <td className="p-4 md:p-5 font-semibold text-foreground">{row.feature}</td>
                    <td className="p-4 md:p-5 font-bold text-brand-green bg-brand-green/5 border-x border-brand-green/20">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                        <span>{row.carrothost}</span>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                        <span>{row.stape}</span>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                        <span>{row.gcp}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highlight Callout */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-brand-orange/10 via-secondary to-brand-green/10 border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-foreground">
              Ready to save $240 to $1,200/year on tracking subscriptions?
            </h3>
            <p className="text-sm text-muted-foreground">
              Every CarrotHost Webuzo Cloud plan includes our 100% Node-Free tracking setup and
              WordPress plugin at no extra charge.
            </p>
          </div>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-soft hover:opacity-95 transition shrink-0"
          >
            Get Started Now <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function WordPressPluginShowcase() {
  return (
    <section
      id="wordpress-plugin"
      className="py-20 md:py-28 bg-gradient-soft border-b border-border relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-4 py-1.5 text-xs font-semibold text-brand-orange mb-3">
            <FileCode2 className="h-4 w-4" />
            <span>Official WordPress & WooCommerce Plugin</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Carrothost Server-Side Tracker Plugin
          </h2>

          <p className="mt-3 text-lg font-bold text-foreground/90">
            Configure Meta Conversions API & First-Party GTM in under 2 minutes. Zero coding
            required!
          </p>

          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            We developed the dedicated{" "}
            <strong className="text-foreground">Carrothost Server-Side Tracker</strong> WordPress
            plugin specifically for WooCommerce and WordPress store owners in Bangladesh. It links
            your site directly to our kernel-level Nginx tracking proxy to bypass ad blockers,
            retain user cookies for months, and send purchase events with high Event Match Quality
            (EMQ 9+).
          </p>
        </div>

        {/* 2 Equal-Height Columns: Features & Setup Steps */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 4 Key Features */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              {
                t: "1-Click Meta CAPI",
                d: "Enter Pixel ID & Access Token. No complex GTM web-to-server tags or webhook setup.",
              },
              {
                t: "First-Party GTM Proxy",
                d: "Nginx proxies Google Tag Manager through /metrics/gtm.js on your own domain.",
              },
              {
                t: "WooCommerce Auto-Tracking",
                d: "Automatically fires ViewContent, AddToCart, InitiateCheckout & Purchase with exact BDT order value.",
              },
              {
                t: "Live Diagnostics & Test Ping",
                d: "Run test pings and inspect real-time connection status right inside your WordPress admin.",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elegant hover:border-brand-orange transition flex flex-col justify-center"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CheckCheck className="h-4.5 w-4.5 text-brand-green shrink-0" />
                  <span>{f.t}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>

          {/* Right Column: 3-Step Setup Walkthrough */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 md:p-7 shadow-soft flex flex-col justify-between">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-brand-orange" />
              <span>3 Simple Setup Steps</span>
            </h3>

            <div className="space-y-4 py-2">
              <div className="flex gap-3.5">
                <div className="h-7 w-7 rounded-full bg-brand-orange/15 text-brand-orange font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Upload the Plugin</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Download <code>carrothost-server-side-tracker.zip</code> and upload it via{" "}
                    <strong>Plugins &gt; Add New &gt; Upload</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="h-7 w-7 rounded-full bg-brand-green/15 text-brand-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Paste Pixel ID & CAPI Token</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Go to <strong>Carrothost SST</strong>. Enter your GTM Container ID, Meta Pixel
                    ID, and CAPI Access Token.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Verify Connection (200 OK)</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Click <strong>"Run Test Ping Now"</strong> to verify your live 200 OK Nginx
                    proxy and Meta CAPI connection.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/60 border border-border p-3 text-[11px] text-muted-foreground flex items-center gap-2 mt-2">
              <ShieldCheck className="h-4 w-4 text-brand-green shrink-0" />
              <span>Our support team will configure this for you 100% free if requested.</span>
            </div>
          </div>
        </div>

        {/* Full-Width Download Banner */}
        <div className="mt-8 rounded-2xl border-2 border-brand-green/40 bg-card p-6 md:p-8 shadow-elegant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-green animate-pulse" />
              <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">
                Ready to Install on WordPress & WooCommerce
              </span>
            </div>
            <h4 className="text-xl font-extrabold text-foreground">
              carrothost-server-side-tracker.zip
            </h4>
            <p className="text-xs text-muted-foreground">
              Version 1.3.5 • WordPress 5.8 to 6.5+ • WooCommerce Compatible • Included 100% Free
              with all Hosting Plans
            </p>
          </div>

          <a
            href="/carrothost-server-side-tracker.zip"
            download="carrothost-server-side-tracker.zip"
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-brand px-7 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:scale-105 shrink-0 text-sm"
          >
            <Download className="h-5 w-5 animate-bounce" />
            <span>Download Plugin (.zip)</span>
          </a>
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
                Tuned for Maximum Uptime & Zero Dropped Packets
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
                  "Optimized network socket buffers for low-latency transmission (<10ms)",
                  "Fine-tuned CPU scheduling to prioritize high-traffic web requests",
                  "I/O scheduler adjustments for blazing NVMe SSD read/write speeds",
                  "Pre-configured Nginx kernel variables to eliminate packet drops",
                  "Native reverse proxy for 100% Node-free server-side tracking",
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
                  PRODUCTION STABLE
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
                  <span className="text-slate-500">GTM & CAPI Proxies</span>
                  <span className="text-brand-green font-semibold">
                    100% Node-Free Server Tracking
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">WP Plugin Integration</span>
                  <span className="text-brand-green font-semibold">
                    carrothost-server-side-tracker
                  </span>
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
      badge: "Flagship Feature",
      title: "100% Node-Free Server-Side Tracking",
      desc: "If you are a digital marketer or e-commerce owner using Google Tag Manager (GTM) Server-Side Tracking or Meta Conversions API, our hosting is the ultimate solution in Bangladesh. We eliminated heavy, crash-prone Node.js processes and integrated tracking proxies directly into the Nginx C core.",
      benefit:
        "Capture 100% of your customer journey even if ad blockers and iOS 14.5+ ATT are active, without draining your server's RAM or slowing down your website by even a millisecond.",
    },
    {
      icon: FileCode2,
      badge: "Included Free",
      title: "Dedicated WordPress & WooCommerce SST Plugin",
      desc: "No need to pay monthly subscription fees to third-party tools or hire expensive tracking developers. Our official WordPress plugin (carrothost-server-side-tracker.zip) configures Meta CAPI, first-party GTM proxy, and WooCommerce e-commerce events with 1 click.",
      benefit:
        "Boost your Meta Event Match Quality (EMQ) to 9.5+ out of 10, reduce ad acquisition cost (CPA), and maximize return on ad spend (ROAS).",
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
      desc: "Most shared hosting environments crash with '503 Service Unavailable' or 'Resource Limit Reached' during live flash sales or viral ad campaigns.",
      benefit:
        "Engineered with high-throughput Nginx architecture and optimized worker processes to seamlessly handle massive simultaneous visitor spikes with zero slowdown or downtime.",
    },
    {
      icon: Lock,
      badge: "SSL Automation",
      title: "One-Click Custom Subdomains & Auto-SSL",
      desc: "Need a dedicated tracking subdomain (e.g., ss.yourdomain.com) for first-party tracking or isolated landing pages? You don't have to manually deal with complex SSL certificates.",
      benefit:
        "Simply point your DNS to our server, and our background architecture will automatically issue and renew free Let's Encrypt SSL certificates every 90 days.",
    },
    {
      icon: LayoutDashboard,
      badge: "Simple & Lightweight",
      title: "Lightweight Webuzo Control Panel",
      desc: "Say goodbye to bloated, slow, and expensive legacy control panels that eat up half of your server memory.",
      benefit:
        "Our lightweight Webuzo panel gives you an intuitive, lightning-fast interface to manage your file manager, databases, and professional email accounts with zero technical hassle.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/20 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Exclusive Cloud Infrastructure
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Features you only get with CarrotHost
          </h2>
          <p className="mt-3 text-muted-foreground">
            We custom-tuned our hosting platform to provide e-commerce speed and server-side tracking
            capabilities that standard shared hosting cannot match.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className={`rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft hover:shadow-elegant hover:border-brand-orange transition duration-300 flex flex-col justify-between ${
                idx < 2 ? "border-brand-green/35 bg-gradient-to-b from-card to-brand-green/5" : ""
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
    <section className="py-20 md:py-28 bg-card relative overflow-hidden border-b border-border">
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
      title: "E-Commerce & WooCommerce Stores",
      desc: "Businesses running heavy Facebook or TikTok ad campaigns who need maximum uptime, zero dropped checkouts, and 100% accurate conversion data via Meta CAPI.",
    },
    {
      icon: TrendingUp,
      title: "Growth Marketers & Media Buyers",
      desc: "Agencies and performance marketers who demand 9.5+ Event Match Quality (EMQ), extended first-party cookies, and freedom from third-party tracking fees.",
    },
    {
      icon: Users,
      title: "High-Traffic Blogs & Corporate Portals",
      desc: "Publishers requiring seamless page speeds, NVMe SSD caching, and server stability for tens of thousands of simultaneous readers.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/40 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-green">Engineered for Growth</span>
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
      tag: "Best for single stores",
      link: "https://portal.carrothost.com/store/webuzo-hosting/starter",
      features: [
        "5 GB NVMe SSD Storage",
        "250 GB Monthly Bandwidth",
        "1 Website / Domain",
        "100% Node-Free Server-Side Tracking",
        "Free WordPress SST Plugin (.zip)",
        "Meta CAPI & First-Party GTM Proxy",
        "Speedy Cache & Webuzo Panel",
        "Free Auto-SSL & Daily Backups",
      ],
    },
    {
      name: "Standard",
      price: "৳8,400.00",
      period: "/yr",
      tag: "Most Popular",
      highlight: true,
      link: "https://portal.carrothost.com/store/webuzo-hosting/standard",
      features: [
        "10 GB NVMe SSD Storage",
        "500 GB Monthly Bandwidth",
        "1 Website / Domain",
        "100% Node-Free Server-Side Tracking",
        "Free WordPress SST Plugin (.zip)",
        "Meta CAPI & First-Party GTM Proxy",
        "Speedy Cache & Webuzo Panel",
        "Free Auto-SSL & Daily Backups",
        "Priority 24/7 Bangla Support",
      ],
    },
    {
      name: "Advanced",
      price: "৳12,000.00",
      period: "/yr",
      tag: "Power users & scaling brands",
      link: "https://portal.carrothost.com/store/webuzo-hosting/advanced",
      features: [
        "20 GB NVMe SSD Storage",
        "1000 GB Monthly Bandwidth",
        "1 Website / Domain",
        "100% Node-Free Server-Side Tracking",
        "Free WordPress SST Plugin (.zip)",
        "Meta CAPI & First-Party GTM Proxy",
        "Speedy Cache & Webuzo Panel",
        "Free Auto-SSL & Daily Backups",
        "VIP Support & Dedicated IP option",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Transparent Pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            High-Performance Hosting with Tracking Included
          </h2>
          <p className="mt-3 text-muted-foreground">
            Billed annually. All plans include 100% Node-Free Server-Side Tracking, the WordPress
            SST plugin, 24/7 Bangla support, and free site migration.
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
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap shadow-soft">
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
                {p.features.map((f, i) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        i === 3 || i === 4 ? "text-brand-orange font-bold" : "text-brand-green"
                      }`}
                    />
                    <span
                      className={
                        i === 3 || i === 4 ? "font-bold text-foreground" : "text-foreground/90"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex justify-center items-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${
                  p.highlight
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant hover:opacity-95"
                    : "border border-border bg-card hover:border-brand-orange text-foreground"
                }`}
              >
                Order Now <ArrowRight className="h-4 w-4" />
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
      title: "Speedy Cache",
      desc: "Built-in Speedy Cache makes WordPress and static stores load in milliseconds.",
    },
    {
      icon: Shield,
      title: "Free Auto-SSL",
      desc: "Automated Let's Encrypt SSL issuance and auto-renewal for every domain and subdomain.",
    },
    {
      icon: Clock,
      title: "Daily Cloud Backups",
      desc: "Automated incremental backups stored off-site. Restore any file or database in 1 click.",
    },
    {
      icon: HelpCircle,
      title: "24/7 Bangla Support",
      desc: "Talk to real hosting and tracking engineers in Bangla or English via Phone and WhatsApp.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-card border-b border-border">
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
              className="group rounded-2xl border border-border bg-background p-6 hover:border-brand-orange hover:shadow-elegant transition"
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
    <section className="py-20 md:py-28 bg-gradient-soft border-b border-border">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">Frequently Asked Questions</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Everything you need to know
          </h2>
          <p className="mt-3 text-muted-foreground">
            Clear answers about our 100% Node-Free tracking, WordPress plugin, and Webuzo cloud
            hosting.
          </p>
        </div>
        <div className="mt-14 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-bold text-base flex items-start gap-3 text-foreground">
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
              Migrate to CarrotHost Today — 100% Free!
            </h2>
            <p className="mt-4 max-w-2xl mx-auto opacity-95 text-base md:text-lg">
              Don't let migration worries hold you back. Our engineering team will handle your
              entire website transfer completely free of charge, ensuring zero downtime for your
              business and setting up server-side tracking right out of the box.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="https://wa.me/8801787882277"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft"
              >
                WhatsApp Us for Free Migration <ArrowRight className="h-4 w-4" />
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
                <Check className="h-4 w-4" /> SSL & Server-Side Tracking Config
              </span>
            </div>
          </div>
        </div>
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
      <StapeComparison />
      <WordPressPluginShowcase />
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
