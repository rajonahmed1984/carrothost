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
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { waLink, PHONE_DISPLAY, PHONE_TEL } from "@/lib/contact";
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
    q: "Which plan should I choose?",
    a: "Most single WooCommerce stores do well on Starter. Pick Standard if you run regular Facebook ad campaigns or sales, and Advanced for large catalogues or high traffic. See the visitor capacity table on this page, or message us on WhatsApp and we'll recommend a plan for free.",
  },
  {
    q: "How does CarrotHost serve as a Stape.io alternative in Bangladesh?",
    a: "Stape.io and Google Cloud charge a separate monthly fee in US dollars (roughly $20–$100/mo) and need an international card. CarrotHost includes Node-free server-side tracking in your hosting at no extra monthly cost, and you pay in BDT with bKash, Nagad or a local card.",
  },
  {
    q: "What is 'Node-Free' server-side tracking and why is it better?",
    a: "Standard server-side GTM containers run Node.js or Docker processes that use 1–2 GB of RAM and can slow down during traffic spikes. Our tracking runs as a proxy inside Nginx itself, so there is no extra container eating your RAM and latency stays very low.",
  },
  {
    q: "How do I install the tracking plugin on WordPress?",
    a: "It takes about 2 minutes: 1) Download the plugin .zip from this page, 2) Upload and activate it under Plugins > Add New, 3) Open 'Carrothost SST', enter your Meta Pixel ID and CAPI Access Token, and click 'Run Test Ping'. WooCommerce purchases, add-to-carts and checkouts are then tracked automatically with hashed customer data. Prefer not to do it yourself? Our team will set it up free.",
  },
  {
    q: "Will this bypass Ad Blockers and iOS 14.5+ tracking restrictions?",
    a: "It recovers much of the lost data. Tracking requests go through your own domain (e.g. yourdomain.com/metrics/gtm.js), so most ad blockers, Brave shields and Safari ITP treat them as first-party traffic instead of blocking them as third-party scripts.",
  },
  {
    q: "Can I migrate my existing WordPress site for free?",
    a: "Yes. Our team moves your site free from any cPanel, Webuzo or VPS host. Most migrations are done within 24 hours and planned to avoid downtime. Just send your website address on WhatsApp.",
  },
  {
    q: "What is Webuzo and how does it compare to cPanel?",
    a: "Webuzo is a lightweight control panel, similar to cPanel but using fewer server resources. It lets you manage files, databases, email and SSL, and includes a 1-click installer for WordPress and 450+ apps.",
  },
  {
    q: "Can I pay in BDT using bKash or Nagad?",
    a: "Yes. We accept bKash, Nagad, Rocket, Upay and Bangladeshi debit and credit cards. No USD card or passport endorsement needed.",
  },
];

export const Route = createFileRoute("/hosting")({
  head: () => {
    const seo = createSeoMeta({
      title: "High-Performance Cloud Hosting with Node-Free Server-Side Tracking | CarrotHost",
      description:
        "WordPress & WooCommerce hosting in Bangladesh with free server-side tracking (Meta CAPI & GTM). Stape.io alternative from ৳350/month: free plugin, NVMe SSD, free migration, bKash/Nagad and Bangla support.",
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
      downloadUrl: `${SITE_URL}/carrothost-server-side-tracker-1.5.4.zip`,
      softwareVersion: "1.5.4",
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="min-w-0 lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 border border-brand-green/25 px-4 py-1.5 text-xs font-semibold text-brand-green">
              <Sparkles className="h-4 w-4 animate-pulse text-brand-green" />
              <span>Server-side tracking included free</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-foreground">
              WordPress & WooCommerce Hosting with{" "}
              <span className="text-gradient-brand">Free Server-Side Tracking</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Ad-blockers and iPhone privacy rules hide many of your sales from Facebook and Google.
              Our hosting sends those events to{" "}
              <strong className="text-foreground">Meta CAPI and GTM from your own domain</strong>,
              with a free WordPress plugin. A Stape.io alternative with no extra monthly fee, paid in
              BDT.
            </p>

            {/* Quick value props pill list */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-medium text-foreground/85">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Recover ad-blocked events</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>No Node.js server to run</span>
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
                <span>Meta CAPI EMQ up to 9+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <span>Free Site Migration</span>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="pt-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
                <a
                  href="#pricing"
                  className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 sm:px-6 py-3.5 text-sm sm:text-base font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
                >
                  See Plans · from ৳350/mo <ArrowRight className="h-4.5 w-4.5" />
                </a>

                <a
                  href={waLink("Hello CarrotHost, I want hosting with server-side tracking. Which plan is right for my site?")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 font-bold text-white hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5" /> Ask on WhatsApp
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground pt-0.5">
                <Download className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span>Already hosted elsewhere?</span>
                <a href="#wordpress-plugin" className="font-bold text-brand-green hover:underline">
                  See the free WordPress plugin
                </a>
              </div>
            </div>
          </div>

          {/* Hero Visual: Interactive Mockup Switcher */}
          <div className="min-w-0 lg:col-span-5 relative space-y-3 lg:pt-1">
            {/* View Switcher Bar */}
            <div className="flex items-center justify-center p-1 rounded-xl bg-secondary/80 border border-border w-full max-w-sm mx-auto text-xs font-semibold">
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
          { k: "৳0", v: "Extra Tracking Fee", sub: "Included in every plan" },
          { k: "9+", v: "Meta EMQ Possible", sub: "With hashed customer data" },
          { k: "24h", v: "Free Migration", sub: "Most sites moved within a day" },
          { k: "BDT", v: "Local Payment", sub: "bKash, Nagad, local cards" },
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
      carrothost: "No extra container (runs inside Nginx)",
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
      carrothost: "Up to 9+ / 10 (Deep hashed WooCommerce data)",
      stape: "Varies by setup complexity",
      gcp: "Varies by custom coding",
      isWin: true,
    },
    {
      feature: "Ad Blocker & Safari ITP Bypass",
      carrothost: "Built-in first-party proxy on your own domain",
      stape: "Custom domain must be configured",
      gcp: "Requires manual load balancer & DNS",
      isWin: true,
    },
    {
      feature: "Customer Support & Migration",
      carrothost: "24/7 Bangla & English Phone/WhatsApp Support",
      stape: "Email / ticket support in English",
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
            Why Pay Extra Dollars for Tracking?
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Many Bangladeshi stores pay a monthly USD fee to Stape.io or Google Cloud just to run
            Facebook CAPI. With CarrotHost the same job is part of your hosting.
          </p>
        </div>

        <p className="mb-3 text-xs text-muted-foreground text-right md:hidden">Swipe to compare →</p>

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
              Every CarrotHost Webuzo plan includes Node-free tracking and the WordPress plugin at
              no extra charge.
            </p>
          </div>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-soft hover:opacity-95 transition shrink-0"
          >
            Compare Plans <ArrowRight className="h-4 w-4" />
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
            plugin for WooCommerce and WordPress store owners in Bangladesh. It connects your site
            to our Nginx tracking proxy, keeps first-party cookies longer, and sends purchase events
            with hashed customer data for high Event Match Quality (EMQ up to 9+).
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
                    Download <code>carrothost-server-side-tracker-1.5.4.zip</code> and upload it via{" "}
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
                    Click <strong>"Run Test Ping"</strong> to verify your live 200 OK Nginx proxy
                    and Meta CAPI connection.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/60 border border-border p-3 text-[11px] text-muted-foreground flex items-center gap-2 mt-2">
              <ShieldCheck className="h-4 w-4 text-brand-green shrink-0" />
              <span>Prefer not to do it yourself? Our team will set it up for you free.</span>
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
              carrothost-server-side-tracker-1.5.4.zip
            </h4>
            <p className="text-xs text-muted-foreground">
              Version 1.5.4 • WordPress 5.8 to 6.5+ • WooCommerce Compatible • Included 100% Free
              with all Hosting Plans
            </p>
          </div>

          <a
            href="/carrothost-server-side-tracker-1.5.4.zip"
            download="carrothost-server-side-tracker-1.5.4.zip"
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-brand px-7 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:scale-105 shrink-0 text-sm"
          >
            <Download className="h-5 w-5" />
            <span>Download Plugin (.zip)</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function EverythingIncluded() {
  const items = [
    {
      icon: Activity,
      title: "Server-Side Tracking",
      desc: "Meta CAPI and first-party GTM run inside Nginx on your domain. No Stape.io bill, no Node.js server.",
    },
    {
      icon: FileCode2,
      title: "Free WordPress Plugin & Setup",
      desc: "WooCommerce events tracked automatically. Our team can configure it for you at no cost.",
    },
    {
      icon: Zap,
      title: "Speedy Cache & NVMe SSD",
      desc: "Built-in page caching on fast NVMe storage keeps WordPress and WooCommerce pages quick.",
    },
    {
      icon: Cpu,
      title: "Guaranteed CPU & RAM",
      desc: "Each plan has its own isolated resources, so a busy neighbour doesn't slow your site during a sale.",
    },
    {
      icon: Lock,
      title: "Free Auto-SSL",
      desc: "Let's Encrypt SSL for every domain and subdomain, including tracking subdomains. Renews automatically.",
    },
    {
      icon: Clock,
      title: "Daily Backups",
      desc: "Automatic off-site backups. Restore a file or database in one click.",
    },
    {
      icon: Shield,
      title: "Auto-Unlock Guard",
      desc: "An hourly check fixes broken file permissions, so updates don't leave you stuck on a '403 Forbidden' error.",
    },
    {
      icon: HelpCircle,
      title: "24/7 Bangla Support",
      desc: "Talk to real hosting and tracking engineers in Bangla or English by phone and WhatsApp.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/20 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Included in every plan
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Everything your store needs, no add-ons
          </h2>
          <p className="mt-3 text-muted-foreground">
            Starter, Standard and Advanced all come with these. Plans differ only in storage,
            bandwidth and server resources.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((i) => (
            <div
              key={i.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-brand-orange hover:shadow-elegant transition"
            >
              <div className="h-11 w-11 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center group-hover:bg-gradient-brand group-hover:text-primary-foreground transition">
                <i.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-bold text-foreground">{i.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{i.desc}</p>
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
      desc: "Install WordPress, WooCommerce, Laravel and 450+ other apps in a few clicks. The database and config are created for you.",
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
        "Table optimize & repair tools",
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
      desc: "Manage your website files from your browser. Upload, zip, unzip and edit files in a clean file manager.",
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
            An easy control panel for your site
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Manage WordPress, email, databases, PHP versions and SSL from one lightweight Webuzo
            dashboard. No server commands needed.
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
      desc: "Shops running Facebook or TikTok ads that want every purchase reported to Meta, and a site that stays fast during sales.",
    },
    {
      icon: TrendingUp,
      title: "Growth Marketers & Media Buyers",
      desc: "Agencies and media buyers who want high Event Match Quality, first-party cookies, and no third-party tracking fees for their clients.",
    },
    {
      icon: Users,
      title: "News Sites, Blogs & Business Websites",
      desc: "Publishers and companies that need fast cached pages on NVMe storage, local Bangla support and simple BDT billing.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/40 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-green">Who it is for</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
            Built for Bangladeshi online businesses
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

/**
 * Guaranteed resources per plan, as the server enforces them (cgroup limits and PHP-FPM workers).
 * Keep in step with /var/webuzo/cgroups and /etc/webuzo-plan-limits.json on the hosting server.
 */
const PLAN_RESOURCES: Record<
  string,
  { cpu: string; ram: string; workers: number; processes: number; io: string }
> = {
  Starter: { cpu: "1 CPU Core", ram: "1.5 GB RAM", workers: 10, processes: 75, io: "10 / 5 MB/s" },
  Standard: {
    cpu: "2 CPU Cores",
    ram: "3 GB RAM",
    workers: 20,
    processes: 150,
    io: "25 / 12 MB/s",
  },
  Advanced: {
    cpu: "3 CPU Cores",
    ram: "6 GB RAM",
    workers: 30,
    processes: 250,
    io: "50 / 25 MB/s",
  },
};

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "৳4,200",
      monthly: "৳350",
      tag: "For a new or single store",
      link: "https://portal.carrothost.com/store/webuzo-hosting/starter",
      features: ["5 GB NVMe SSD storage", "250 GB monthly bandwidth", "1 website / domain", "24/7 Bangla support"],
    },
    {
      name: "Standard",
      price: "৳8,400",
      monthly: "৳700",
      tag: "For stores running regular ads",
      highlight: true,
      link: "https://portal.carrothost.com/store/webuzo-hosting/standard",
      features: [
        "10 GB NVMe SSD storage",
        "500 GB monthly bandwidth",
        "1 website / domain",
        "Priority 24/7 Bangla support",
      ],
    },
    {
      name: "Advanced",
      price: "৳12,000",
      monthly: "৳1,000",
      tag: "For large catalogues & high traffic",
      link: "https://portal.carrothost.com/store/webuzo-hosting/advanced",
      features: [
        "20 GB NVMe SSD storage",
        "1,000 GB monthly bandwidth",
        "1 website / domain",
        "VIP support & dedicated IP option",
      ],
    },
  ];

  const allPlans = [
    "Server-side tracking (Meta CAPI & GTM)",
    "Free WordPress tracking plugin",
    "Speedy Cache & Webuzo panel",
    "Free Auto-SSL",
    "Daily backups",
    "Free migration",
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft border-b border-border scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Simple, transparent pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Choose your plan
          </h2>
          <p className="mt-3 text-muted-foreground">
            Billed yearly in BDT. Pay with bKash, Nagad, Rocket or card. 30-day money-back
            guarantee.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-brand-green/30 bg-card p-4 md:p-5 shadow-soft">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-brand-green mb-3">
            Every plan includes
          </p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            {allPlans.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-foreground/90">
                <Check className="h-4 w-4 text-brand-green shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 md:p-8 flex flex-col ${
                p.highlight
                  ? "border-brand-orange bg-card shadow-elegant md:scale-[1.03]"
                  : "border-border bg-card shadow-soft"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap shadow-soft">
                  Most Popular
                </span>
              )}
              <div className="text-lg font-extrabold text-foreground">{p.name}</div>
              <p className="text-sm text-muted-foreground">{p.tag}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-muted-foreground text-sm font-semibold">/year</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-brand-green">≈ {p.monthly} per month</p>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Cpu className="h-3.5 w-3.5 text-brand-orange" /> {PLAN_RESOURCES[p.name].cpu}
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Server className="h-3.5 w-3.5 text-brand-orange" /> {PLAN_RESOURCES[p.name].ram}
                </div>
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <Layers className="h-3.5 w-3.5 text-brand-green" />{" "}
                  {PLAN_RESOURCES[p.name].workers} PHP workers
                </div>
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <Users className="h-3.5 w-3.5 text-brand-green" />{" "}
                  {PLAN_CAPACITY.store[p.name as keyof typeof PLAN_CAPACITY.store].cached} visitors*
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-brand-green" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex justify-center items-center gap-2 rounded-xl px-4 py-3 font-bold transition ${
                  p.highlight
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant hover:opacity-95"
                    : "border border-border bg-card hover:border-brand-orange text-foreground"
                }`}
              >
                Order {p.name} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>Not sure which plan fits?</span>
          <a
            href={waLink("Hello CarrotHost, can you help me choose a hosting plan? My website is: ")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 font-bold text-white hover:opacity-95 transition"
          >
            <WhatsAppIcon className="h-4 w-4" /> Ask us on WhatsApp
          </a>
          <a href="#plan-capacity" className="font-semibold text-brand-orange hover:underline">
            or compare visitor capacity ↓
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          * Store visitors at the same time with page cache. See the capacity estimates below.
        </p>
      </div>
    </section>
  );
}

/**
 * Estimated visitors browsing at the same time, worked out from each plan's CPU, RAM and PHP workers.
 * Assumes ~0.3-0.5 s of CPU per uncached PHP request, ~80-100 MB per worker and one page view per
 * visitor every 10-15 s. These are estimates, not load-test results: themes and plugins change them a lot.
 */
const PLAN_CAPACITY = {
  store: {
    Starter: { cached: "60–100", uncached: "20–30", checkout: "3–5" },
    Standard: { cached: "120–200", uncached: "40–60", checkout: "6–10" },
    Advanced: { cached: "200–300", uncached: "60–100", checkout: "10–15" },
  },
  news: {
    Starter: { cached: "300–500", uncached: "30–50" },
    Standard: { cached: "600–1,000", uncached: "70–100" },
    Advanced: { cached: "1,000–1,500", uncached: "120–180" },
  },
} as const;

function PlanCapacity() {
  const [site, setSite] = useState<"store" | "news">("store");
  const names = ["Starter", "Standard", "Advanced"] as const;
  const sites = [
    { key: "store" as const, icon: ShoppingBag, label: "WooCommerce / Online Store" },
    { key: "news" as const, icon: FileCode2, label: "News, Blog & Business Site" },
  ];

  return (
    <section id="plan-capacity" className="py-20 md:py-28 bg-card border-b border-border scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Which Plan Fits You?</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            How many visitors can each plan handle?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every plan has its own guaranteed CPU, RAM and PHP workers, isolated from other
            accounts, so a busy neighbour doesn't slow your site down. Pick your site type to see how many
            visitors each plan handles at the same time.
          </p>
        </div>

        {/* Guaranteed resources */}
        <div className="mt-12 overflow-x-auto rounded-2xl border border-border bg-background shadow-soft">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left">
                <th className="px-5 py-3 font-semibold">Guaranteed resources</th>
                {names.map((n) => (
                  <th key={n} className="px-5 py-3 font-bold text-center">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: "CPU", value: (n: string) => PLAN_RESOURCES[n].cpu },
                { label: "RAM (max)", value: (n: string) => PLAN_RESOURCES[n].ram },
                {
                  label: "PHP workers (requests at once)",
                  value: (n: string) => String(PLAN_RESOURCES[n].workers),
                },
                {
                  label: "Process limit",
                  value: (n: string) => String(PLAN_RESOURCES[n].processes),
                },
                { label: "Disk read / write speed", value: (n: string) => PLAN_RESOURCES[n].io },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                  {names.map((n) => (
                    <td key={n} className="px-5 py-3 text-center font-semibold">
                      {row.value(n)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Site type switch */}
        <div
          className="mt-12 flex flex-col sm:flex-row justify-center gap-3"
          role="tablist"
          aria-label="Site type"
        >
          {sites.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={site === s.key}
              onClick={() => setSite(s.key)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                site === s.key
                  ? "bg-gradient-brand text-primary-foreground shadow-elegant"
                  : "border border-border bg-background hover:border-brand-orange"
              }`}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {names.map((n) => {
            const c = PLAN_CAPACITY[site][n];

            return (
              <div
                key={n}
                className={`rounded-2xl border p-6 bg-background ${n === "Standard" ? "border-brand-orange shadow-elegant" : "border-border shadow-soft"}`}
              >
                <div className="text-sm font-semibold text-brand-green">{n}</div>
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">
                    Visitors at the same time, with page cache + CDN
                  </div>
                  <div className="mt-1 text-3xl font-extrabold">{c.cached}</div>
                </div>
                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Without cache</span>
                    <span className="font-semibold">{c.uncached}</span>
                  </div>
                  {"checkout" in c && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Checkouts / carts at once</span>
                      <span className="font-semibold">{c.checkout}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-4">
            <Zap className="h-5 w-5 shrink-0 text-brand-orange" />
            <p className="text-foreground/90">
              {site === "store"
                ? "Cart, checkout and logged-in customers are never cached, so they use the most CPU. Plan by how many people buy at the same time, not only by visitors."
                : "Readers mostly hit cached pages, so a breaking-news spike is easy to absorb. Turn on Speedy Cache and a free CDN like Cloudflare to reach the higher numbers."}
            </p>
          </div>
          <div className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-4">
            <TrendingUp className="h-5 w-5 shrink-0 text-brand-green" />
            <p className="text-foreground/90">
              Outgrowing your plan? Upgrade any time from your client area. Your files, emails and
              databases stay where they are.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Estimates, not guarantees. Worked out from each plan's CPU, RAM and PHP workers,
          assuming about 0.3–0.5 s of CPU per uncached page and one page view per visitor every
          10–15 seconds. Heavy themes, page builders and many plugins can lower them by 30–50%.
        </p>
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
            Plans, tracking, migration and payment. Can&apos;t find your answer?{" "}
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-green hover:underline"
            >
              Ask us on WhatsApp
            </a>
            .
          </p>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={faq.q}
              open={idx === 0}
              className="group rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft open:shadow-elegant transition"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-sm md:text-base text-foreground">
                <span className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                  {faq.q}
                </span>
                <span
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 rounded-full bg-secondary text-brand-green flex items-center justify-center transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed pl-8">{faq.a}</p>
            </details>
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
              Move your website to CarrotHost, free
            </h2>
            <p className="mt-4 max-w-2xl mx-auto opacity-95 text-base md:text-lg">
              Send us your website address on WhatsApp. Our team moves your files, database and
              email, usually within 24 hours and planned to avoid downtime, and sets up
              server-side tracking for you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href={waLink("Hello CarrotHost, I want to move my website to your hosting. Please help with free migration.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Start Free Migration
              </a>
              <a
                href={PHONE_TEL}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white hover:bg-white/20 transition"
              >
                <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs opacity-90">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Full Website Transfer
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Planned to Avoid Downtime
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
      <TargetAudience />
      <Pricing />
      <PlanCapacity />
      <StapeComparison />
      <WordPressPluginShowcase />
      <EverythingIncluded />
      <WebuzoFacilities />
      <FAQ />
      <MigrationCTA />
      <Footer />
    </div>
  );
}
