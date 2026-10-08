import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, jsonLdScript } from "@/lib/seo";
import {
  Download,
  CheckCircle2,
  Settings,
  ShieldCheck,
  Zap,
  Phone,
  ArrowRight,
  Copy,
  ExternalLink,
  Code,
  FileCode2,
  Check,
  HelpCircle,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Terminal,
  ShoppingBag,
  Share2,
  Globe,
  Lock,
  Languages,
  Cloud,
  ShieldAlert,
  AlertTriangle,
  Gauge,
  BarChart3,
  Rss,
  Sparkles,
  Fingerprint,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ServerSideTrackerMockup, SST_PLUGIN_VERSION } from "@/components/ServerSideTrackerMockup";

const PLUGIN_ZIP = `carrothost-server-side-tracker-${SST_PLUGIN_VERSION}.zip`;
const GA4_EVENT_REGEX = "view_item|add_to_cart|begin_checkout|purchase";

const WHATS_NEW = [
  {
    icon: Gauge,
    bn: {
      t: "লাইভ ড্যাশবোর্ড",
      d: "Facebook ও Google ঠিকমতো ডেটা পাচ্ছে কিনা এক নজরে — সবুজ/হলুদ/লাল হেলথ ব্যানার, Event Match Quality স্কোর (১০-এর মধ্যে), ডেলিভারি সাকসেস % এবং কত % অর্ডার ট্র্যাক হয়েছে।",
    },
    en: {
      t: "Live Dashboard",
      d: "See at a glance whether Facebook and Google are getting proper data — a green/amber/red health banner, Event Match Quality out of 10, delivery success %, and the % of orders tracked.",
    },
  },
  {
    icon: Fingerprint,
    bn: {
      t: "উন্নত Match Quality",
      d: "হ্যাশ করা ইমেইল, ফোন (8801…), নাম ও শহর, সাথে fbp, fbc, external_id এবং Cloudflare-এর পেছনেও কাস্টমারের আসল IP পাঠানো হয়।",
    },
    en: {
      t: "Higher Match Quality",
      d: "SHA-256 hashed email, phone (8801…), name and city, plus fbp, fbc, external_id and the real visitor IP even behind Cloudflare.",
    },
  },
  {
    icon: RefreshCw,
    bn: {
      t: "ডুপ্লিকেট ছাড়া ট্র্যাকিং",
      d: "ব্রাউজার Pixel ও সার্ভার CAPI একই event_id ব্যবহার করে, তাই Meta একটি ইভেন্ট একবারই গোনে। প্রতিটি অর্ডারের Purchase মাত্র একবার যায়।",
    },
    en: {
      t: "Deduplicated Events",
      d: "Browser Pixel and server CAPI share one event_id so Meta counts each action once. Each order Purchase is sent exactly once.",
    },
  },
  {
    icon: CreditCard,
    bn: {
      t: "bKash / SSLCommerz-এও Purchase",
      d: "কাস্টমার পেমেন্টের পর thank-you পেজে না ফিরলেও অর্ডার processing/completed হলে Purchase ইভেন্ট Facebook-এ চলে যায়।",
    },
    en: {
      t: "Gateway-Safe Purchases",
      d: "Even if the customer never returns to the thank-you page after paying (bKash, SSLCommerz), the Purchase is sent once the order becomes processing/completed.",
    },
  },
  {
    icon: BarChart3,
    bn: {
      t: "GA4 ইকমার্স ইভেন্ট",
      d: "view_item, add_to_cart, begin_checkout ও purchase স্ট্যান্ডার্ড GA4 ফরম্যাটে dataLayer-এ পুশ হয় — GTM-এ শুধু একটি Custom Event trigger দিলেই হবে।",
    },
    en: {
      t: "GA4 Ecommerce Events",
      d: "view_item, add_to_cart, begin_checkout and purchase are pushed to the dataLayer in standard GA4 format — just add one Custom Event trigger in GTM.",
    },
  },
  {
    icon: Rss,
    bn: {
      t: "Facebook Catalog Feed",
      d: "WooCommerce প্রোডাক্ট থেকে অটো-জেনারেটেড ফিড URL। প্রোডাক্ট ID, ইভেন্টের content_ids-এর সাথে মেলে, তাই ডায়নামিক অ্যাড সঠিকভাবে কাজ করে।",
    },
    en: {
      t: "Facebook Catalog Feed",
      d: "Auto-generated feed URL from your WooCommerce products. Product IDs match the content_ids sent in events, so dynamic product ads work correctly.",
    },
  },
  {
    icon: ShieldCheck,
    bn: {
      t: "Expired fbclid ফিক্স",
      d: "৯০ দিনের বেশি পুরনো fbc আর Meta-তে পাঠানো হয় না, ফলে Events Manager-এর “expired fbclid value in fbc parameter” ওয়ার্নিং বন্ধ হয়।",
    },
    en: {
      t: "Expired fbclid Fix",
      d: "fbc values older than 90 days are no longer sent, which clears the “expired fbclid value in fbc parameter” warning in Events Manager.",
    },
  },
  {
    icon: Zap,
    bn: {
      t: "সাইট স্লো হয় না",
      d: "সার্ভার ইভেন্ট পেজ লোড শেষ হওয়ার পরে পাঠানো হয়। ক্যাশড পেজেও PageView ও ViewContent আসল ভিজিটরের ডেটা সহ যায়।",
    },
    en: {
      t: "No Page Slowdown",
      d: "Server events are sent after the page has loaded. PageView and ViewContent work on cached pages too, with the real visitor data.",
    },
  },
];

const DASHBOARD_GUIDE = [
  {
    bn: { t: "Event Match Quality", d: "১০-এর মধ্যে স্কোর। ৮+ Great, ৬+ Good, ৪+ OK, ৪-এর নিচে Poor। Meta থেকে লাইভ স্কোর পাওয়া গেলে সেটা, নইলে পাঠানো ডেটা থেকে আনুমানিক (est.) স্কোর দেখায়।" },
    en: { t: "Event Match Quality", d: "Score out of 10: 8+ Great, 6+ Good, 4+ OK, below 4 Poor. Shows Meta live score when available, otherwise an estimate (est.) from the data sent." },
  },
  {
    bn: { t: "Server delivery to Meta", d: "Facebook কত % সার্ভার ইভেন্ট গ্রহণ করেছে (200 OK)। ৯৮%-এর নিচে নামলে হলুদ/লাল হয়ে যায়।" },
    en: { t: "Server delivery to Meta", d: "Share of server events Facebook accepted (200 OK). Turns amber/red below 98%." },
  },
  {
    bn: { t: "Orders tracked", d: "WooCommerce-এর কত % অর্ডার Facebook ও Google-এ Purchase হিসেবে গেছে। Google সংখ্যা কম হওয়া স্বাভাবিক — কাস্টমার thank-you পেজে না ফিরলে ব্রাউজার ইভেন্ট যায় না।" },
    en: { t: "Orders tracked", d: "Share of WooCommerce orders reported as Purchase to Facebook and Google. Google is naturally lower — browser events do not fire if the customer never returns to the thank-you page." },
  },
  {
    bn: { t: "Customer data sent", d: "প্রতিটি ইভেন্টে Email, Phone, fbp, fbc, IP ইত্যাদি কত % গেছে। fbc শুধু বিজ্ঞাপনে ক্লিক করা ভিজিটরের থাকে, তাই কম হওয়া স্বাভাবিক (নীল রঙ)।" },
    en: { t: "Customer data sent", d: "Share of events that included Email, Phone, fbp, fbc, IP and more. fbc only exists for visitors who clicked an ad, so a low value is normal (blue)." },
  },
];

export const Route = createFileRoute("/wordpress-plugin")({
  head: () => {
    const seo = createSeoMeta({
      title: "Server-Side Tracking (GTM & Facebook CAPI) Setup Guide — CarrotHost",
      description:
        "Download Carrothost Server-Side Tracker v1.5.0 for WordPress: Facebook Conversions API with deduplicated Pixel events, GA4 ecommerce via first-party GTM, live match-quality dashboard, catalog feed, and Cloudflare WAF setup — in Bangla and English.",
      path: "/wordpress-plugin",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-plugin-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "WordPress Plugin", path: "/wordpress-plugin" },
          ]),
        ),
      ],
    };
  },
  component: WordPressPluginDocPage,
});

const sectionIds = [
  "overview",
  "whats-new",
  "gtm-setup",
  "capi-setup",
  "method-a",
  "method-b",
  "diagnostics",
  "woocommerce-events",
  "catalog-feed",
  "cloudflare-waf",
  "troubleshooting",
];

function WordPressPluginDocPage() {
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ScrollSpy to highlight the active section as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140; // offset for sticky navigation header
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Bottom of page detection - automatically select last section
      if (window.scrollY + windowHeight >= documentHeight - 70) {
        setActiveSection("troubleshooting");
        return;
      }

      let currentSection = sectionIds[0];
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            currentSection = id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      try {
        window.history.pushState(null, "", `#${id}`);
      } catch {
        // Safe fallback
      }
    }
  };

  const navItems = {
    bn: [
      { id: "overview", label: "কেন এই ফিচারটি ব্যবহার করবেন?" },
      { id: "whats-new", label: `নতুন কী আছে (v${SST_PLUGIN_VERSION})` },
      { id: "gtm-setup", label: "১. Google Tag Manager ও GA4 সেটআপ" },
      { id: "capi-setup", label: "২. Facebook Conversions API (CAPI) সেটআপ" },
      { id: "method-a", label: "• পদ্ধতি A: Server GTM এর মাধ্যমে" },
      { id: "method-b", label: "• পদ্ধতি B: প্লাগইন দিয়ে ১-ক্লিক সেটআপ" },
      { id: "diagnostics", label: "৩. ড্যাশবোর্ড ও ভেরিফিকেশন" },
      { id: "woocommerce-events", label: "৪. WooCommerce অটো-ইভেন্ট (Meta + GA4)" },
      { id: "catalog-feed", label: "৫. Facebook Catalog Feed" },
      { id: "cloudflare-waf", label: "৬. Cloudflare WAF ও Bot Mode বাইপাস (জরুরি)" },
      { id: "troubleshooting", label: "৭. সাধারণ প্রশ্নোত্তর (FAQ)" },
    ],
    en: [
      { id: "overview", label: "Why Use This Feature?" },
      { id: "whats-new", label: `What's New in v${SST_PLUGIN_VERSION}` },
      { id: "gtm-setup", label: "1. Google Tag Manager & GA4 Setup" },
      { id: "capi-setup", label: "2. Facebook Conversions API (CAPI) Setup" },
      { id: "method-a", label: "• Method A: Via Server GTM (Advanced)" },
      { id: "method-b", label: "• Method B: Via Plugin (1-Click Setup)" },
      { id: "diagnostics", label: "3. Dashboard & Verification" },
      { id: "woocommerce-events", label: "4. WooCommerce Events (Meta + GA4)" },
      { id: "catalog-feed", label: "5. Facebook Catalog Feed" },
      { id: "cloudflare-waf", label: "6. Cloudflare WAF & Bot Mode Bypass (Important)" },
      { id: "troubleshooting", label: "7. Frequently Asked Questions (FAQ)" },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground scroll-smooth">
      <Header />

      {/* Doc Page Header */}
      <header className="relative overflow-hidden bg-gradient-soft py-14 md:py-20 border-b border-border">
        <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-3.5 py-1 text-xs font-semibold text-brand-orange">
                  <FileCode2 className="h-4 w-4" />
                  <span>Knowledgebase • Official Setup Guide</span>
                </div>

                {/* Language Switcher Button */}
                <div className="inline-flex items-center rounded-xl bg-card border border-border p-1 shadow-soft">
                  <button
                    onClick={() => setLang("bn")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      lang === "bn"
                        ? "bg-brand-orange text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🇧🇩 বাংলা
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      lang === "en"
                        ? "bg-brand-orange text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.14]">
                {lang === "bn" ? (
                  <>
                    Server-Side Tracking <span className="text-gradient-brand">(GTM &amp; Facebook CAPI)</span> সেটআপ গাইড
                  </>
                ) : (
                  <>
                    Server-Side Tracking <span className="text-gradient-brand">(GTM &amp; Facebook CAPI)</span> Setup Guide
                  </>
                )}
              </h1>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {lang === "bn" ? (
                  <>
                    আমাদের হোস্টিং প্ল্যাটফর্মে রয়েছে বিল্ট-ইন <strong>Node-Free Server-Side Tracking</strong> প্রযুক্তি।
                    ভারী Node.js প্রসেস বা জটিল ক্লাউড কনফিগারেশন ছাড়াই সরাসরি আমাদের অপ্টিমাইজড Nginx সার্ভার কোরের মাধ্যমে
                    Google Analytics এবং Facebook Conversions API-তে ট্র্যাকিং ডেটা পাঠানো যায়।
                  </>
                ) : (
                  <>
                    CarrotHost features built-in <strong>Node-Free Server-Side Tracking</strong>. Send tracking data directly to
                    Google Analytics and Facebook Conversions API through our optimized Nginx server core without heavy Node.js
                    processes or complex, expensive cloud containers.
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span>{lang === "bn" ? "প্লাগইন ভার্সন:" : "Plugin Version:"} <strong className="text-foreground">{SST_PLUGIN_VERSION} (Official)</strong></span>
                <span>•</span>
                <span>WordPress: <strong className="text-foreground">5.8+</strong></span>
                <span>•</span>
                <span>PHP: <strong className="text-foreground">7.4 to 8.3</strong></span>
                <span>•</span>
                <span className="text-brand-green font-semibold">{lang === "bn" ? "হোস্টিংয়ের সাথে ১০০% ফ্রি" : "100% Free with Hosting"}</span>
              </div>
            </div>

            {/* Quick Download Card */}
            <div className="rounded-2xl border-2 border-brand-green/30 bg-card p-6 shadow-soft space-y-3 shrink-0 md:max-w-xs w-full">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-green animate-pulse" />
                <span className="text-xs font-mono font-bold text-brand-green uppercase">
                  {lang === "bn" ? "প্লাগইন ডাউনলোড" : "Plugin Download"}
                </span>
              </div>
              <h2 className="text-sm font-bold text-foreground break-all">{PLUGIN_ZIP}</h2>
              <p className="text-xs text-muted-foreground">
                {lang === "bn"
                  ? `অফিসিয়াল রিলিজ v${SST_PLUGIN_VERSION} — নতুন ড্যাশবোর্ড, GA4 ইকমার্স ইভেন্ট, Pixel + CAPI ডিডুপ্লিকেশন ও Catalog Feed সহ।`
                  : `Official release v${SST_PLUGIN_VERSION} — new dashboard, GA4 ecommerce events, Pixel + CAPI deduplication and catalog feed.`}
              </p>
              <a
                href={`/${PLUGIN_ZIP}`}
                download={PLUGIN_ZIP}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-3 font-bold text-primary-foreground shadow-soft hover:opacity-95 transition text-xs"
              >
                <Download className="h-4 w-4 animate-bounce" />
                <span>{lang === "bn" ? "ডাউনলোড প্লাগইন (.zip)" : "Download Plugin (.zip)"}</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Documentation Container */}
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12 flex-1 w-full">
        {/* Mobile Sticky Horizontal Table of Contents Bar */}
        <div className="lg:hidden sticky top-16 z-30 -mx-6 px-6 py-2.5 bg-background/95 backdrop-blur-md border-b border-border shadow-sm mb-6 overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="h-3 w-3 text-brand-orange" />
            {lang === "bn" ? "টপিক:" : "Topics:"}
          </span>
          {navItems[lang].map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`text-xs px-3 py-1.5 rounded-full shrink-0 font-medium transition-all ${
                  isActive
                    ? "bg-brand-orange text-white font-bold shadow-soft"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Sticky Left Sidebar Navigation (Desktop) */}
          <aside className="lg:col-span-4 sticky top-24 hidden lg:block space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand-orange" />
                  Table of Contents
                </h3>
                <button
                  onClick={() => setLang(lang === "bn" ? "en" : "bn")}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:underline cursor-pointer"
                >
                  <Languages className="h-3 w-3" />
                  <span>{lang === "bn" ? "English Version" : "বাংলা সংস্করণ"}</span>
                </button>
              </div>
              <nav className="space-y-1 text-xs font-medium">
                {navItems[lang].map((item) => {
                  const isSubItem = item.id === "method-a" || item.id === "method-b";
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => handleNavClick(e, item.id)}
                      className={`group flex items-center justify-between rounded-xl py-2 transition-all duration-200 cursor-pointer ${
                        isSubItem ? "pl-6 pr-3 text-[11px]" : "px-3"
                      } ${
                        isActive
                          ? "bg-brand-orange/10 text-brand-orange font-bold border-l-2 border-brand-orange shadow-sm dark:bg-brand-orange/15"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isActive ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange shrink-0 animate-pulse" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Support Widget in Sidebar */}
            <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-xs space-y-2.5">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                <Phone className="h-4 w-4 text-brand-green" />
                {lang === "bn" ? "ফ্রি সেটআপ সাপোর্ট" : "Free Setup Support"}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "কোনো স্টেপে আটকে গেলে আমাদের সিনিয়র ইঞ্জিনিয়ারিং টিম সম্পূর্ণ ফ্রিতে আপনার সাইটে ট্র্যাকিং সেটআপ করে দেবে।"
                  : "Stuck at any step? Our senior tracking engineers will configure the entire tracking pipeline on your website 100% free."}
              </p>
              <a
                href="https://wa.me/8801787882277?text=Hello%20CarrotHost,%20I%20need%20help%20with%20GTM%20and%20CAPI%20setup."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-brand-green hover:underline pt-1"
              >
                WhatsApp 01787-882277 <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </aside>

          {/* Main Documentation Body */}
          <main className="lg:col-span-8 space-y-16">
            {/* Section 1: Overview / কেন এই ফিচারটি ব্যবহার করবেন? */}
            <section id="overview" className="space-y-5 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Zap className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "কেন এই ফিচারটি ব্যবহার করবেন?" : "Why Use This Feature?"}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn" ? (
                  <>
                    সাধারণ ব্রাউজার-সাইড ট্র্যাকিংয়ে iOS 14.5+, Safari ITP এবং বিভিন্ন অ্যাড-ব্লকারের কারণে ৩০% থেকে ৪০% পর্যন্ত কনভার্সন ডেটা মিসিং হয়ে যায়।
                    CarrotHost-এর Node-Free প্রযুক্তি আপনাকে দিচ্ছে নিখুঁত ট্র্যাকিং সমাধান:
                  </>
                ) : (
                  <>
                    Standard client-side browser tracking loses 30% to 40% of conversion data due to iOS 14.5+, Safari ITP restrictions,
                    and browser ad-blockers. CarrotHost's Node-Free technology delivers 100% accurate, reliable tracking data:
                  </>
                )}
              </p>

              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Globe className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {lang === "bn" ? "১০০% ফার্স্ট-পার্টি ডেটা" : "100% First-Party Data"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "bn"
                      ? "ট্র্যাকিং নিজস্ব ডোমেইন দিয়ে প্রক্সি হওয়ায় Safari ITP ও ব্রাউজার কুকি রেস্ট্রিকশন অনায়াসে বাইপাস হয়।"
                      : "Tracking is proxied through your own domain, bypassing Safari ITP and browser cookie expiration limits."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {lang === "bn" ? "অ্যাড-ব্লকার প্রতিরোধ" : "Ad-Blocker Resistant"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "bn"
                      ? "ডেটা থার্ড-পার্টি গুগল/মেটা ডোমেইনে না গিয়ে সাইটের ইন্টারনাল পাথে পৌঁছায়, ফলে অ্যাড-ব্লকার ট্র্যাকিং আটকাতে পারে না।"
                      : "Data reaches internal endpoints rather than 3rd-party Google/Meta domains, preventing ad-blockers from blocking events."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {lang === "bn" ? "জিরো সার্ভার লোড" : "Zero Server Load"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "bn"
                      ? "ব্যাকগ্রাউন্ডে কোনো ভারী Node.js বা অতিরিক্ত ডকার কনটেইনার চলে না (0 MB RAM Leak), তাই সাইট থাকে সুপার-ফাস্ট।"
                      : "Zero heavy Node.js or Docker containers (0 MB RAM leak). Runs natively in C-level Nginx sockets for maximum speed."}
                  </p>
                </div>
              </div>
            </section>

            {/* Section: What's New */}
            <section id="whats-new" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Sparkles className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? `নতুন কী আছে (v${SST_PLUGIN_VERSION})` : `What's New in v${SST_PLUGIN_VERSION}`}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "প্লাগইনের নতুন ড্যাশবোর্ড থেকে আপনি সরাসরি দেখতে পারবেন Facebook ও Google-এ প্রপার ডেটা যাচ্ছে কিনা এবং কত শতাংশ ডেটা সঠিকভাবে পৌঁছাচ্ছে। নিচের ছবিটি প্লাগইনের আসল ড্যাশবোর্ডের নমুনা:"
                  : "The new plugin dashboard tells you straight away whether Facebook and Google are receiving proper data, and what percentage is arriving correctly. The preview below mirrors the real dashboard:"}
              </p>

              <div className="py-2">
                <ServerSideTrackerMockup />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {WHATS_NEW.map((f) => (
                  <div key={f.en.t} className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{f[lang].t}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f[lang].d}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border-2 border-brand-green/30 bg-card p-6 shadow-soft space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-brand-green" />
                    Changelog
                  </h3>
                  <a
                    href={`/${PLUGIN_ZIP}`}
                    download={PLUGIN_ZIP}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 font-bold text-primary-foreground shadow-soft hover:opacity-95 transition text-xs"
                  >
                    <Download className="h-4 w-4" />
                    <span>{lang === "bn" ? `v${SST_PLUGIN_VERSION} ডাউনলোড করুন` : `Download v${SST_PLUGIN_VERSION}`}</span>
                  </a>
                </div>

                <div className="space-y-3 text-xs text-muted-foreground">
                  <div>
                    <span className="font-mono font-bold text-brand-orange">v1.5.0</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>{lang === "bn" ? "নতুন ড্যাশবোর্ড: হেলথ ব্যানার, Event Match Quality, ডেলিভারি %, অর্ডার কভারেজ, ইভেন্ট ভিত্তিক ডেটা কভারেজ ও রিকমেন্ডেশন।" : "New dashboard: health banner, Event Match Quality, delivery %, order coverage, per-event data coverage and recommendations."}</li>
                      <li>{lang === "bn" ? "GA4 ইকমার্স ইভেন্ট (view_item, add_to_cart, begin_checkout, purchase) dataLayer-এ।" : "GA4 ecommerce events (view_item, add_to_cart, begin_checkout, purchase) in the dataLayer."}</li>
                      <li>{lang === "bn" ? "AJAX ও সাধারণ Add to Cart-এ ব্রাউজার Pixel ও সার্ভার ইভেন্ট ডিডুপ্লিকেট।" : "Deduplicated browser Pixel and server events for both AJAX and standard Add to Cart."}</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-brand-green">v1.4.0</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>{lang === "bn" ? "মেয়াদোত্তীর্ণ fbclid (fbc) ফিক্স, Cloudflare-এর পেছনে আসল ভিজিটর IP।" : "Expired fbclid (fbc) fix and real visitor IP behind Cloudflare."}</li>
                      <li>{lang === "bn" ? "হ্যাশড কাস্টমার ডেটা (ইমেইল, ফোন, নাম, শহর), fbp/fbc/external_id।" : "Hashed customer data (email, phone, name, city), fbp / fbc / external_id."}</li>
                      <li>{lang === "bn" ? "Pixel + CAPI ডিডুপ্লিকেশন; প্রতি অর্ডারে একবার Purchase; পেমেন্ট গেটওয়ে কলব্যাকেও কাজ করে।" : "Pixel + CAPI deduplication; one Purchase per order, also on payment-gateway callbacks."}</li>
                      <li>{lang === "bn" ? "ক্যাশ-সেফ PageView/ViewContent, পেজ লোডের পরে সার্ভার ইভেন্ট, Facebook Catalog Feed।" : "Cache-safe PageView/ViewContent, server events after page load, Facebook Catalog Feed."}</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary/40 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                  <span>
                    {lang === "bn"
                      ? "পুরনো ভার্সন থেকে আপগ্রেড: Plugins > Add New > Upload Plugin-এ নতুন .zip আপলোড করে “Replace current with uploaded” সিলেক্ট করুন। আপনার Pixel ID, Access Token ও GTM সেটিংস আগের মতোই থাকবে। ড্যাশবোর্ডের পরিসংখ্যান আপডেটের পর থেকে জমা হতে শুরু করে।"
                      : "Upgrading from an older version: upload the new .zip via Plugins > Add New > Upload Plugin and choose “Replace current with uploaded”. Your Pixel ID, access token and GTM settings are kept. Dashboard statistics start collecting from the moment you update."}
                  </span>
                </div>
              </div>
            </section>

            {/* Section 2: GTM Server-Side Setup */}
            <section id="gtm-setup" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Layers className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "১. Google Tag Manager (GTM) ও GA4 ট্র্যাকিং সেটআপ" : "1. Google Tag Manager (GTM) & GA4 Tracking Setup"}
                </h2>
              </div>

              {/* Step 1 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-orange/15 text-brand-orange font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn" ? "ধাপ ১: প্লাগইন ইনস্টলেশন" : "Step 1: Plugin Installation"}
                  </h3>
                </div>

                <div className="pl-10 space-y-3 text-xs md:text-sm text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>{lang === "bn" ? "WordPress ড্যাশবোর্ডে লগইন করুন।" : "Log in to your WordPress Admin dashboard."}</li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Plugins</strong> &gt; <strong>Add New</strong>-এ যান।</>
                      ) : (
                        <>Navigate to <strong>Plugins</strong> &gt; <strong>Add New</strong>.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <>
                          আপনি নিচের যেকোনো একটি প্লাগইন ব্যবহার করতে পারেন:
                          <ul className="list-disc pl-5 mt-1.5 space-y-1 text-foreground">
                            <li>
                              <strong>Carrothost Server-Side Tracker</strong> (আমাদের অফিসিয়াল অল-ইন-ওয়ান প্লাগইন — রিকমেন্ডেড)
                            </li>
                            <li>
                              <strong>GTM4WP (Google Tag Manager for WordPress)</strong> অথবা <strong>Stape</strong> প্লাগইন।
                            </li>
                          </ul>
                        </>
                      ) : (
                        <>
                          You can use either of the following plugins:
                          <ul className="list-disc pl-5 mt-1.5 space-y-1 text-foreground">
                            <li>
                              <strong>Carrothost Server-Side Tracker</strong> (Our official all-in-one plugin — Recommended)
                            </li>
                            <li>
                              <strong>GTM4WP (Google Tag Manager for WordPress)</strong> or <strong>Stape</strong> plugin.
                            </li>
                          </ul>
                        </>
                      )}
                    </li>
                    <li>{lang === "bn" ? "প্লাগইনটি ইনস্টল করে Activate করুন।" : "Install and Activate the plugin."}</li>
                  </ol>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-green/15 text-brand-green font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn" ? "ধাপ ২: কন্টেইনার ও প্রক্সি পাথ কনফিগারেশন" : "Step 2: Container & Transport URL Configuration"}
                  </h3>
                </div>

                <div className="pl-10 space-y-3 text-xs md:text-sm text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-3">
                    <li>
                      {lang === "bn" ? (
                        <><strong>Settings</strong> &gt; <strong>Google Tag Manager</strong> (অথবা <strong>Carrothost SST</strong>)-এ প্রবেশ করুন।</>
                      ) : (
                        <>Go to <strong>Settings</strong> &gt; <strong>Google Tag Manager</strong> (or <strong>Carrothost SST</strong>).</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Google Tag Manager ID</strong> বক্সে আপনার Web GTM কন্টেইনার আইডি বসান (যেমন: <code className="text-brand-orange bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">GTM-XXXXXXX</code>)।</>
                      ) : (
                        <>In the <strong>Google Tag Manager ID</strong> field, input your Web GTM Container ID (e.g. <code className="text-brand-orange bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">GTM-XXXXXXX</code>).</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Advanced</strong> বা <strong>Server-side tracking</strong> ট্যাবে যান।</>
                      ) : (
                        <>Switch to the <strong>Advanced</strong> or <strong>Server-side tracking</strong> tab.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Server Container URL / Transport URL</strong> বক্সে আপনার নিজস্ব ডোমেইনের সাথে <code className="text-foreground font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">/metrics/</code> যুক্ত করে লিখুন:</>
                      ) : (
                        <>In the <strong>Server Container URL / Transport URL</strong> box, enter your own domain followed by <code className="text-foreground font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">/metrics/</code>:</>
                      )}
                    </li>
                  </ol>

                  {/* Copyable Code Box */}
                  <div className="mt-2 rounded-2xl border border-border bg-slate-950 text-slate-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Server Container URL / Transport URL:</span>
                      <button
                        onClick={() => handleCopy("https://yourdomain.com/metrics/", "transport-url")}
                        className="inline-flex items-center gap-1 text-brand-orange hover:text-brand-orange/80 transition font-medium cursor-pointer"
                      >
                        {copiedKey === "transport-url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "transport-url" ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs sm:text-sm text-brand-green select-all break-all">
                      https://yourdomain.com/metrics/
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic pl-1">
                    {lang === "bn"
                      ? "*(নোট: yourdomain.com-এর স্থলে আপনার ওয়েবসাইটের মূল ডোমেইন বসান)*"
                      : "*(Note: Replace yourdomain.com with your actual primary website domain)*"}
                  </p>

                  <div className="pt-1 pl-1">
                    {lang === "bn" ? (
                      <><strong>Save Changes</strong> বাটনে ক্লিক করে সেটিংস সেভ করুন।</>
                    ) : (
                      <>Click <strong>Save Changes</strong> to store your configuration.</>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: GA4 ecommerce events */}
              <div className="rounded-2xl border-2 border-brand-green/30 bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-orange/15 text-brand-orange font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn" ? "ধাপ ৩: GA4 ইকমার্স ইভেন্ট ট্যাগ (GTM-এ)" : "Step 3: GA4 Ecommerce Event Tag (in GTM)"}
                  </h3>
                </div>

                <div className="pl-10 space-y-3 text-xs md:text-sm text-muted-foreground">
                  <p>
                    {lang === "bn"
                      ? "WooCommerce সক্রিয় থাকলে প্লাগইন নিজে থেকেই নিচের ইভেন্টগুলো GA4 ফরম্যাটে dataLayer-এ পুশ করে। GTM-এ একবার ট্যাগ বানালেই GA4-এ ইকমার্স রিপোর্ট চালু হয়ে যাবে:"
                      : "With WooCommerce active, the plugin pushes the events below to the dataLayer in GA4 format. Create the tag once in GTM and your GA4 ecommerce reports come alive:"}
                  </p>

                  <ol className="list-decimal pl-4 space-y-2">
                    <li>
                      {lang === "bn" ? (
                        <><strong>Triggers</strong> &gt; <strong>New</strong> &gt; <strong>Custom Event</strong> সিলেক্ট করুন।</>
                      ) : (
                        <>Go to <strong>Triggers</strong> &gt; <strong>New</strong> &gt; <strong>Custom Event</strong>.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Event name</strong>-এ নিচের টেক্সটটি বসিয়ে <strong>Use regex matching</strong> চেকবক্সে টিক দিন।</>
                      ) : (
                        <>Paste the text below into <strong>Event name</strong> and tick <strong>Use regex matching</strong>.</>
                      )}
                    </li>
                  </ol>

                  <div className="rounded-2xl border border-border bg-slate-950 text-slate-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Event name (regex):</span>
                      <button
                        onClick={() => handleCopy(GA4_EVENT_REGEX, "ga4-regex")}
                        className="inline-flex items-center gap-1 text-brand-orange hover:text-brand-orange/80 transition font-medium cursor-pointer"
                      >
                        {copiedKey === "ga4-regex" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "ga4-regex" ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs sm:text-sm text-brand-green select-all break-all">{GA4_EVENT_REGEX}</div>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2" start={3}>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Tags</strong> &gt; <strong>New</strong> &gt; <strong>Google Analytics: GA4 Event</strong> বানান। Measurement ID দিন এবং Event Name-এ <code className="text-foreground font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">{"{{Event}}"}</code> ভেরিয়েবল বসান।</>
                      ) : (
                        <>Create <strong>Tags</strong> &gt; <strong>New</strong> &gt; <strong>Google Analytics: GA4 Event</strong>. Enter your Measurement ID and set Event Name to the built-in <code className="text-foreground font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">{"{{Event}}"}</code> variable.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>More Settings</strong> &gt; <strong>Ecommerce</strong> থেকে <strong>Send Ecommerce data</strong> চালু করে সোর্স হিসেবে <strong>Data Layer</strong> সিলেক্ট করুন।</>
                      ) : (
                        <>Under <strong>More Settings</strong> &gt; <strong>Ecommerce</strong>, enable <strong>Send Ecommerce data</strong> and choose <strong>Data Layer</strong> as the source.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <>উপরের Trigger সংযুক্ত করে <strong>Submit / Publish</strong> করুন।</>
                      ) : (
                        <>Attach the trigger above, then <strong>Submit / Publish</strong>.</>
                      )}
                    </li>
                  </ol>

                  <div className="grid sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    {[
                      ["view_item", lang === "bn" ? "প্রোডাক্ট পেজ" : "Product page"],
                      ["add_to_cart", lang === "bn" ? "কার্টে যোগ" : "Add to cart"],
                      ["begin_checkout", lang === "bn" ? "চেকআউট শুরু" : "Checkout started"],
                      ["purchase", lang === "bn" ? "অর্ডার সম্পন্ন (transaction_id, tax, shipping সহ)" : "Order complete (with transaction_id, tax, shipping)"],
                    ].map(([ev, desc]) => (
                      <div key={ev} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                        <span className="font-bold text-brand-green">{ev}</span>
                        <span className="font-sans text-muted-foreground text-right">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Facebook CAPI Setup */}
            <section id="capi-setup" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Share2 className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn"
                    ? "২. Facebook Conversions API (CAPI) ট্র্যাকিং সেটআপ"
                    : "2. Facebook Conversions API (CAPI) Tracking Setup"}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "Facebook CAPI সেটআপ করার জন্য আপনি নিচের যেকোনো একটি পদ্ধতি বেছে নিতে পারেন:"
                  : "You can choose either of the two methods below to set up Facebook CAPI:"}
              </p>

              {/* Method A */}
              <div id="method-a" className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4 scroll-mt-28">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
                      {lang === "bn" ? "পদ্ধতি A" : "Method A"}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-foreground">
                      {lang === "bn"
                        ? "Server GTM এর মাধ্যমে (প্রফেশনাল ও নির্ভুল)"
                        : "Via Server GTM Container (Advanced & Clean)"}
                    </h3>
                  </div>
                  <span className="text-xs font-mono bg-secondary px-2.5 py-1 rounded-lg text-muted-foreground">
                    Advanced
                  </span>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground">
                  {lang === "bn"
                    ? "আপনি যদি ইতিমধ্যে উপরে বর্ণিত GTM মেথডটি সেট করে থাকেন:"
                    : "If you have already configured the GTM Transport URL method above:"}
                </p>

                <ol className="list-decimal pl-5 space-y-2.5 text-xs md:text-sm text-muted-foreground">
                  <li>
                    {lang === "bn"
                      ? "আপনার Server GTM কন্টেইনারে প্রবেশ করুন।"
                      : "Open your Server GTM container in Google Tag Manager."}
                  </li>
                  <li>
                    {lang === "bn"
                      ? <><strong>Tags</strong> &gt; <strong>New</strong>-এ গিয়ে <strong>Facebook Conversions API</strong> ট্যাগ সিলেক্ট করুন।</>
                      : <>Go to <strong>Tags</strong> &gt; <strong>New</strong> and select the <strong>Facebook Conversions API</strong> tag template.</>}
                  </li>
                  <li>
                    {lang === "bn"
                      ? <>Meta Events Manager থেকে সংগৃহীত আপনার <strong>Pixel ID</strong> এবং <strong>API Access Token</strong> বসান।</>
                      : <>Input your <strong>Pixel ID</strong> and <strong>API Access Token</strong> retrieved from Meta Events Manager.</>}
                  </li>
                  <li>
                    {lang === "bn"
                      ? <>Trigger হিসেবে <strong>All Events</strong> অথবা <strong>GA4 Client Events</strong> সিলেক্ট করে কন্টেইনারটি <strong>Submit / Publish</strong> করে দিন।</>
                      : <>Set the trigger to <strong>All Events</strong> or <strong>GA4 Client Events</strong> and click <strong>Submit / Publish</strong>.</>}
                  </li>
                </ol>
              </div>

              {/* Method B */}
              <div id="method-b" className="rounded-2xl border-2 border-brand-green/30 bg-card p-6 shadow-soft space-y-4 scroll-mt-28">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                      {lang === "bn" ? "পদ্ধতি B" : "Method B"}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-foreground">
                      {lang === "bn"
                        ? "Carrothost SST প্লাগইন বা PixelYourSite দিয়ে (১-ক্লিক সেটআপ)"
                        : "Via Carrothost SST Plugin or PixelYourSite (1-Click Setup)"}
                    </h3>
                  </div>
                  <span className="text-xs font-mono bg-brand-green/15 text-brand-green px-2.5 py-1 rounded-lg font-bold">
                    Recommended
                  </span>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground">
                  {lang === "bn"
                    ? "GTM ছাড়া সরাসরি প্লাগইন দিয়ে সহজে ট্র্যাকিং করতে:"
                    : "To track directly via plugin without needing a separate Server GTM container:"}
                </p>

                <ol className="list-decimal pl-5 space-y-2.5 text-xs md:text-sm text-muted-foreground">
                  <li>
                    {lang === "bn"
                      ? <>WordPress ড্যাশবোর্ড থেকে <strong>Carrothost Server-Side Tracker</strong> (বা PixelYourSite) প্লাগইনটি ওপেন করুন।</>
                      : <>In your WordPress admin dashboard, navigate to <strong>Carrothost SST</strong>.</>}
                  </li>
                  <li>
                    {lang === "bn"
                      ? <>প্লাগইনের <strong>Configuration</strong> ট্যাবে যান।</>
                      : <>Open the <strong>Configuration</strong> tab.</>}
                  </li>
                  <li>
                    {lang === "bn"
                      ? <>আপনার <strong>Pixel ID</strong> বসান এবং <strong>Conversions API</strong> সক্রিয় করুন।</>
                      : <>Enter your <strong>Meta Pixel ID</strong> and enable Conversions API.</>}
                  </li>
                  <li>
                    {lang === "bn"
                      ? <>Meta Events Manager থেকে পাওয়া <strong>Access Token</strong> পেস্ট করে নিচে <strong>Save Settings</strong> দিন।</>
                      : <>Paste your Meta <strong>Access Token</strong> and click <strong>Save Changes</strong>.</>}
                  </li>
                </ol>

                <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs space-y-2">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-brand-orange" />
                    {lang === "bn" ? "কিভাবে Meta CAPI Access Token সংগ্রহ করবেন?" : "How to get your Meta CAPI Access Token?"}
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {lang === "bn" ? (
                      <>
                        Facebook Events Manager &gt; Data Sources &gt; Pixel সিলেক্ট করুন &gt; <strong>Settings</strong> ট্যাবে স্ক্রোল করে <em>Conversions API</em> সেকশনে গিয়ে <strong>Generate access token</strong> লিংকে ক্লিক করলেই লম্বা টোকেনটি পেয়ে যাবেন।
                      </>
                    ) : (
                      <>
                        Go to Facebook Events Manager &gt; Data Sources &gt; Select your Pixel &gt; Click the <strong>Settings</strong> tab &gt; Scroll to the <em>Conversions API</em> section and click <strong>Generate access token</strong> under Set up manually.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Diagnostics & Testing */}
            <section id="diagnostics" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Activity className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "৩. ড্যাশবোর্ড ও ভেরিফিকেশন" : "3. Dashboard & Verification"}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "সেটআপ সম্পন্ন করার পর ট্র্যাকিং সঠিকভাবে সার্ভার থেকে ডেটা গ্রহণ করছে কি না তা নিশ্চিত করতে নিচের স্টেপগুলো ফলো করুন:"
                  : "After completing your configuration, follow these steps to verify that server-side events are firing properly:"}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2.5">
                  <div className="flex items-center gap-2 text-brand-green font-bold text-sm">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Google Analytics 4 (GA4)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "bn"
                      ? "Google Analytics 4 ড্যাশবোর্ডে গিয়ে Realtime Overview চেক করুন। আপনার ওয়েবসাইটের লাইভ ভিজিটর ও পেজভিউ ফার্স্ট-পার্টি প্রক্সি দিয়ে আসছে কি না লক্ষ্য করুন।"
                      : "Check GA4 Realtime Overview. Verify that active users and pageviews are flowing through your first-party proxy without adblocker interference."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2.5">
                  <div className="flex items-center gap-2 text-brand-green font-bold text-sm">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Meta Events Manager</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "bn"
                      ? "Meta Events Manager > Test Events ট্যাবে গিয়ে ব্রাউজারে একটি টেস্ট প্রোডাক্ট ভিউ বা অর্ডার করুন এবং সার্ভার ইভেন্ট (`Server`) রিসিভ হচ্ছে কি না পরীক্ষা করুন।"
                      : "In Meta Events Manager > Test Events tab, place a test order on your store and verify that the event source shows as 'Server' with high match quality."}
                  </p>
                </div>
              </div>

              {/* Dashboard guide */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-brand-green" />
                  {lang === "bn" ? "ড্যাশবোর্ডের সংখ্যাগুলো কীভাবে পড়বেন" : "How to read the dashboard"}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {DASHBOARD_GUIDE.map((g) => (
                    <div key={g.en.t} className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1">
                      <span className="text-xs font-bold text-foreground">{g[lang].t}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{g[lang].d}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "bn"
                    ? "দ্রষ্টব্য: পরিসংখ্যান প্লাগইন আপডেট করার পর থেকে জমা হয়, তাই প্রথম এক-দুই দিন সংখ্যা কম দেখাতে পারে। উপরে Today / Last 7 days / Last 30 days বেছে নিতে পারবেন।"
                    : "Note: statistics are collected from the moment you update the plugin, so numbers may look small for the first day or two. Use Today / Last 7 days / Last 30 days at the top to change the period."}
                </p>
              </div>

              {/* Plugin Test Ping Box */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-brand-green" />
                    {lang === "bn" ? "Carrothost SST লাইভ কানেকশন পিং (Live Ping)" : "Carrothost SST Live Connection Health Ping"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "bn"
                      ? "Carrothost SST প্লাগইনের Dashboard-এ উপরের ডানদিকের ⚡ Run Test Ping বাটনে ক্লিক করলেই মুহূর্তেই স্ট্যাটাস পেয়ে যাবেন, ফলাফল Activity Log ট্যাবেও দেখা যাবে:"
                      : "In the Carrothost SST Dashboard, click ⚡ Run Test Ping (top right) to verify live endpoints — results are also listed in the Activity Log tab:"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Google Nginx Proxy (/metrics/):</span>
                    <span className="font-bold text-brand-green flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK (First-Party Data)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="text-foreground">Meta CAPI Connection:</span>
                    <span className="font-bold text-brand-green flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected (200 OK)
                    </span>
                  </div>
                </div>

                {/* Cloudflare Ping Tip */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-foreground">
                      {lang === "bn" ? "Cloudflare ব্যবহারকারীদের জন্য জরুরি তথ্য:" : "Important for Cloudflare Users:"}
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {lang === "bn" ? (
                        <>
                          আপনার সাইটে Cloudflare থাকলে Bot Fight Mode বা Turnstile Challenge-এর কারণে টেস্ট পিং ব্লক (403 Forbidden) হতে পারে। নিচে{" "}
                          <a href="#cloudflare-waf" className="font-bold text-brand-orange hover:underline">
                            ৬ নম্বর সেকশন দেখে Cloudflare WAF Bypass রুল
                          </a>{" "}
                          সেট করে নিলেই সমাধান হয়ে যাবে।
                        </>
                      ) : (
                        <>
                          If Cloudflare is enabled, Bot Fight Mode or Turnstile Challenge may block test pings with a 403 Forbidden. Follow{" "}
                          <a href="#cloudflare-waf" className="font-bold text-brand-orange hover:underline">
                            Section 6 below to add a Cloudflare WAF Bypass rule
                          </a>{" "}
                          to fix this instantly.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: WooCommerce Event Mapping */}
            <section id="woocommerce-events" className="space-y-5 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <ShoppingBag className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "৪. WooCommerce অটো-ইভেন্ট ম্যাপিং (Meta + GA4)" : "4. WooCommerce Automated Event Mapping (Meta + GA4)"}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "আপনার সাইটে WooCommerce সক্রিয় থাকলে প্লাগইন স্বয়ংক্রিয়ভাবে ই-কমার্স ইভেন্টগুলো সার্ভার-সাইডে ট্রিগার করে এবং গ্রাহকের তথ্য নিরাপদভাবে হ্যাশ করে মেটাতে পাঠায়:"
                  : "If WooCommerce is active on your site, our plugin automatically hooks into standard e-commerce actions and securely hashes customer data for Meta CAPI:"}
              </p>

              <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-soft">
                <table className="w-full min-w-[640px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/60">
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "ইভেন্ট (Meta / GA4)" : "Event (Meta / GA4)"}</th>
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "ট্রিগার লোকেশন" : "Trigger Location"}</th>
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "পাঠানো ডেটা" : "Payload"}</th>
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "কোথায় যায়" : "Sent via"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-brand-green">ViewContent<br /><span className="text-muted-foreground font-normal">view_item</span></td>
                      <td className="p-3.5">{lang === "bn" ? "সিঙ্গেল প্রোডাক্ট পেজ" : "Single Product Page"}</td>
                      <td className="p-3.5">content_ids, content_name, content_type, value, currency</td>
                      <td className="p-3.5">{lang === "bn" ? "Pixel + CAPI (ডিডুপ্লিকেটেড), GA4 dataLayer" : "Pixel + CAPI (deduplicated), GA4 dataLayer"}</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-brand-orange">AddToCart<br /><span className="text-muted-foreground font-normal">add_to_cart</span></td>
                      <td className="p-3.5">{lang === "bn" ? "AJAX ও সাধারণ Add to Cart" : "AJAX & standard Add to Cart"}</td>
                      <td className="p-3.5">content_ids, contents (id, quantity, price), value, currency</td>
                      <td className="p-3.5">{lang === "bn" ? "Pixel + CAPI (ডিডুপ্লিকেটেড), GA4 dataLayer" : "Pixel + CAPI (deduplicated), GA4 dataLayer"}</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-foreground">InitiateCheckout<br /><span className="text-muted-foreground font-normal">begin_checkout</span></td>
                      <td className="p-3.5">{lang === "bn" ? "চেকআউট পেজ" : "Checkout Page"}</td>
                      <td className="p-3.5">content_ids, contents, num_items, value, currency</td>
                      <td className="p-3.5">{lang === "bn" ? "Pixel + CAPI (ডিডুপ্লিকেটেড), GA4 dataLayer" : "Pixel + CAPI (deduplicated), GA4 dataLayer"}</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-primary">Purchase<br /><span className="text-muted-foreground font-normal">purchase</span></td>
                      <td className="p-3.5">{lang === "bn" ? "থ্যাংক ইউ পেজ + পেমেন্ট সম্পন্ন (processing/completed)" : "Thank-you page + payment complete (processing/completed)"}</td>
                      <td className="p-3.5">{lang === "bn" ? "order_id, value, currency, contents; হ্যাশড email, phone, নাম, শহর; IP, User-Agent, fbp, fbc" : "order_id, value, currency, contents; hashed email, phone, name, city; IP, User-Agent, fbp, fbc"}</td>
                      <td className="p-3.5">{lang === "bn" ? "প্রতি অর্ডারে একবার: CAPI সার্ভার থেকে, Pixel ও GA4 ব্রাউজার থেকে" : "Once per order: CAPI from the server, Pixel & GA4 from the browser"}</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-brand-green">PageView</td>
                      <td className="p-3.5">{lang === "bn" ? "সব পেজ (ক্যাশড পেজেও)" : "All pages (cache-safe)"}</td>
                      <td className="p-3.5">{lang === "bn" ? "fbp, fbc, external_id, আসল IP ও User-Agent" : "fbp, fbc, external_id, real IP & User-Agent"}</td>
                      <td className="p-3.5">{lang === "bn" ? "Pixel + CAPI (ডিডুপ্লিকেটেড)" : "Pixel + CAPI (deduplicated)"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section: Facebook Catalog Feed */}
            <section id="catalog-feed" className="space-y-5 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Rss className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "৫. Facebook Catalog Feed (ডায়নামিক প্রোডাক্ট অ্যাড)" : "5. Facebook Catalog Feed (Dynamic Product Ads)"}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "প্লাগইন আপনার WooCommerce প্রোডাক্ট থেকে স্বয়ংক্রিয়ভাবে একটি Facebook ক্যাটালগ ফিড (XML) তৈরি করে। ফিডের প্রোডাক্ট ID এবং ইভেন্টের content_ids একই, তাই Meta আপনার ইভেন্টের সাথে ক্যাটালগের প্রোডাক্ট মিলিয়ে ডায়নামিক অ্যাড চালাতে পারে।"
                  : "The plugin automatically builds a Facebook catalog feed (XML) from your WooCommerce products. Product IDs in the feed match the content_ids sent with events, so Meta can match events to catalog items for dynamic ads."}
              </p>

              <div className="rounded-2xl border border-border bg-slate-950 text-slate-100 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Scheduled Feed URL:</span>
                  <button
                    onClick={() => handleCopy("https://yourdomain.com/?chnf_feed=facebook", "feed-url")}
                    className="inline-flex items-center gap-1 text-brand-orange hover:text-brand-orange/80 transition font-medium cursor-pointer"
                  >
                    {copiedKey === "feed-url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "feed-url" ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-xs sm:text-sm text-brand-green select-all break-all">
                  https://yourdomain.com/?chnf_feed=facebook
                </div>
              </div>

              <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm text-muted-foreground">
                <li>
                  {lang === "bn" ? (
                    <>Meta <strong>Commerce Manager</strong> &gt; আপনার Catalog &gt; <strong>Data sources</strong> &gt; <strong>Add items</strong> &gt; <strong>Data feed</strong> সিলেক্ট করুন।</>
                  ) : (
                    <>In Meta <strong>Commerce Manager</strong> &gt; your Catalog &gt; <strong>Data sources</strong> &gt; <strong>Add items</strong> &gt; choose <strong>Data feed</strong>.</>
                  )}
                </li>
                <li>
                  {lang === "bn" ? (
                    <><strong>Scheduled feed</strong> সিলেক্ট করে উপরের URL-টি (নিজের ডোমেইন সহ) পেস্ট করুন। ফিড URL প্লাগইনের Dashboard-এও কপি বাটন সহ দেওয়া আছে।</>
                  ) : (
                    <>Choose <strong>Scheduled feed</strong> and paste the URL above (with your own domain). The same URL, with a copy button, is shown in the plugin Dashboard.</>
                  )}
                </li>
                <li>
                  {lang === "bn" ? (
                    <>ফ্রিকোয়েন্সি <strong>Hourly</strong> বা <strong>Daily</strong> সেট করে সেভ করুন।</>
                  ) : (
                    <>Set the frequency to <strong>Hourly</strong> or <strong>Daily</strong> and save.</>
                  )}
                </li>
              </ol>

              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground space-y-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-brand-orange" />
                  {lang === "bn" ? "ফিড সম্পর্কে জেনে রাখুন" : "Good to know"}
                </span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{lang === "bn" ? "ভ্যারিয়েবল প্রোডাক্টের প্রতিটি ভ্যারিয়েশন আলাদা আইটেম হিসেবে যায়, একই item_group_id সহ।" : "Each variation of a variable product is listed as its own item with a shared item_group_id."}</li>
                  <li>{lang === "bn" ? "ছবি বা দাম নেই এমন প্রোডাক্ট এবং catalog visibility “hidden” প্রোডাক্ট ফিডে আসে না।" : "Products without an image or price, and products hidden from the catalog, are left out."}</li>
                  <li>{lang === "bn" ? "ফিড ১ ঘণ্টা ক্যাশ হয় এবং প্রোডাক্ট আপডেট করলে নিজে থেকেই রিফ্রেশ হয়।" : "The feed is cached for 1 hour and refreshes automatically when a product is updated."}</li>
                  <li>{lang === "bn" ? "ফিডের ব্র্যান্ড হিসেবে আপনার সাইটের নাম ব্যবহৃত হয়।" : "Your site name is used as the brand."}</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Cloudflare WAF & Bot Fight Mode Bypass */}
            <section id="cloudflare-waf" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Cloud className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn"
                    ? "৬. Cloudflare WAF ও Bot Fight Mode বাইপাস সেটআপ"
                    : "6. Cloudflare WAF & Bot Fight Mode Bypass Setup"}
                </h2>
              </div>

              {/* Notice / Explanation Box */}
              <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6 shadow-soft space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span>
                    {lang === "bn"
                      ? "কেন এই বাইপাস রুলটি প্রয়োজন?"
                      : "Why is this WAF Bypass Rule Required?"}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {lang === "bn" ? (
                    <>
                      আপনার ওয়েবসাইট যদি <strong>Cloudflare</strong> দিয়ে পরিচালিত হয় (যেমন: <em>enagor.com</em> বা ক্লাউডফ্লেয়ার যুক্ত যেকোনো সাইট), তবে Cloudflare-এর <strong>Bot Fight Mode</strong>, <strong>Managed WAF</strong> বা <strong>Turnstile Challenge</strong> আপনার প্লাগইন টেস্ট রিকোয়েস্ট বা লোকাল টার্মিনালকে বট হিসেবে শনাক্ত করে ব্লক (Cloudflare Turnstile Challenge / 403 Forbidden) দিতে পারে।
                      <br /><br />
                      ক্লাউডফ্লেয়ারকে বাইপাস করে প্রক্সি এন্ডপয়েন্ট <code className="text-brand-orange bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">/metrics/</code> কে সকল ট্র্যাকিং স্ক্রিপ্ট ও সাইটের জন্য উন্মুক্ত করতে নিচের পদক্ষেপগুলো সম্পন্ন করুন:
                    </>
                  ) : (
                    <>
                      If your website uses <strong>Cloudflare</strong> (such as <em>enagor.com</em> or any site behind Cloudflare proxy), Cloudflare&apos;s <strong>Bot Fight Mode</strong>, <strong>Managed WAF</strong>, or <strong>Turnstile Challenge</strong> may identify server/terminal test requests and tracking pings as bot traffic and block them (Cloudflare Turnstile Challenge / HTTP 403).
                      <br /><br />
                      To bypass Cloudflare and allow the proxy endpoint <code className="text-brand-orange bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">/metrics/</code> to seamlessly receive tracking data without interfering with the rest of your site&apos;s security, follow the steps below:
                    </>
                  )}
                </p>
              </div>

              {/* Step 1: Open Cloudflare & Navigate to WAF */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-orange/15 text-brand-orange font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn"
                      ? "ধাপ ১: Cloudflare ড্যাশবোর্ডে WAF Custom Rules-এ যান"
                      : "Step 1: Navigate to Cloudflare WAF Custom Rules"}
                  </h3>
                </div>

                <div className="pl-10 space-y-2 text-xs md:text-sm text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>
                      {lang === "bn" ? (
                        <>
                          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-brand-orange font-bold hover:underline inline-flex items-center gap-1">
                            Cloudflare ড্যাশবোর্ডে <ExternalLink className="h-3 w-3" />
                          </a> লগইন করুন এবং আপনার ডোমেইনটি সিলেক্ট করুন (যেমন: <em>enagor.com</em> বা আপনার সাইট)।
                        </>
                      ) : (
                        <>
                          Log in to the{" "}
                          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-brand-orange font-bold hover:underline inline-flex items-center gap-1">
                            Cloudflare Dashboard <ExternalLink className="h-3 w-3" />
                          </a>{" "}
                          and select your domain (e.g., <em>enagor.com</em> or your target domain).
                        </>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <>বামপাশের মেনু থেকে <strong>Security</strong> &gt; <strong>WAF</strong> &gt; <strong>Custom rules</strong> (অথবা Page Rules)-এ যান।</>
                      ) : (
                        <>In the left sidebar, navigate to <strong>Security</strong> &gt; <strong>WAF</strong> &gt; <strong>Custom rules</strong> (or Page Rules).</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <>নীল রঙের <strong>Create rule</strong> বাটনে ক্লিক করুন।</>
                      ) : (
                        <>Click the <strong>Create rule</strong> button.</>
                      )}
                    </li>
                  </ol>
                </div>
              </div>

              {/* Step 2: Configure Rule Conditions */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-green/15 text-brand-green font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn"
                      ? "ধাপ ২: WAF Bypass রুল ফিল্ড নির্ধারণ করুন"
                      : "Step 2: Define WAF Bypass Rule Fields"}
                  </h3>
                </div>

                <div className="pl-10 space-y-3 text-xs md:text-sm text-muted-foreground">
                  <p>
                    {lang === "bn"
                      ? "রুল তৈরির ফর্মে নিচের ফিল্ডগুলো হুবহু সেট করুন:"
                      : "In the rule creation builder, fill in the following parameters:"}
                  </p>

                  <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 border-b border-border/60">
                      <span className="text-muted-foreground font-semibold font-sans">{lang === "bn" ? "Rule name (রুলের নাম):" : "Rule name:"}</span>
                      <div className="sm:col-span-2 flex items-center justify-between text-foreground">
                        <span className="text-brand-orange font-bold">Bypass GTM Proxy</span>
                        <button
                          onClick={() => handleCopy("Bypass GTM Proxy", "rule-name")}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
                        >
                          {copiedKey === "rule-name" ? <Check className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedKey === "rule-name" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 border-b border-border/60">
                      <span className="text-muted-foreground font-semibold font-sans">{lang === "bn" ? "Field (ফিল্ড):" : "Field:"}</span>
                      <span className="sm:col-span-2 text-foreground font-bold">URI Path</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 border-b border-border/60">
                      <span className="text-muted-foreground font-semibold font-sans">{lang === "bn" ? "Operator (অপারেটর):" : "Operator:"}</span>
                      <span className="sm:col-span-2 text-foreground font-bold">starts with</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                      <span className="text-muted-foreground font-semibold font-sans">{lang === "bn" ? "Value (মান):" : "Value:"}</span>
                      <div className="sm:col-span-2 flex items-center justify-between text-foreground">
                        <span className="text-brand-green font-bold">/metrics/</span>
                        <button
                          onClick={() => handleCopy("/metrics/", "rule-value")}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
                        >
                          {copiedKey === "rule-value" ? <Check className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedKey === "rule-value" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expression Preview */}
                  <div className="rounded-xl border border-border bg-slate-950 text-slate-100 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{lang === "bn" ? "Cloudflare Expression Preview (এক্সপ্রেশন ভিউ):" : "Cloudflare Expression Preview:"}</span>
                      <button
                        onClick={() => handleCopy('(http.request.uri.path starts_with "/metrics/")', "cf-expr")}
                        className="inline-flex items-center gap-1 text-brand-orange hover:text-brand-orange/80 transition font-medium cursor-pointer"
                      >
                        {copiedKey === "cf-expr" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedKey === "cf-expr" ? "Copied!" : "Copy Expression"}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-brand-green select-all break-all">
                      (http.request.uri.path starts_with &quot;/metrics/&quot;)
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Action & Skip Settings */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-orange/15 text-brand-orange font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn"
                      ? "ধাপ ৩: Action হিসেবে Bypass বা Skip সিলেক্ট করুন"
                      : "Step 3: Select Action as Skip / Bypass"}
                  </h3>
                </div>

                <div className="pl-10 space-y-3 text-xs md:text-sm text-muted-foreground">
                  <p>
                    {lang === "bn" ? (
                      <>
                        <strong>Then take action...</strong> সেকশন থেকে <strong>Action</strong> ড্রপডাউনে <strong>Skip</strong> (বা <strong>Bypass</strong>) সিলেক্ট করুন এবং নিচের ৩টি চেকবক্সে টিক দিন:
                      </>
                    ) : (
                      <>
                        Under <strong>Then take action...</strong>, set <strong>Action</strong> to <strong>Skip</strong> (or <strong>Bypass</strong>) and check all 3 boxes:
                      </>
                    )}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-3 rounded-xl border border-brand-green/30 bg-brand-green/5 p-3.5">
                      <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground text-xs md:text-sm font-bold block">
                          ☑️ All remaining custom rules
                        </strong>
                        <span className="text-[11px] text-muted-foreground">
                          {lang === "bn"
                            ? "সাইটের অন্যান্য সিকিউরিটি রুল এই পাথে কার্যকর হবে না।"
                            : "Prevents other custom firewall rules from blocking /metrics/ requests."}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-brand-green/30 bg-brand-green/5 p-3.5">
                      <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground text-xs md:text-sm font-bold block">
                          ☑️ WAF Managed Rules
                        </strong>
                        <span className="text-[11px] text-muted-foreground">
                          {lang === "bn"
                            ? "ক্লাউডফ্লেয়ারের ম্যানেজড রুলসেট স্কিপ হবে যাতে ট্র্যাকিং পেলোড নিরাপদে পাস হতে পারে।"
                            : "Bypasses Managed WAF rule packs for tracking endpoints."}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-brand-green/30 bg-brand-green/5 p-3.5">
                      <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground text-xs md:text-sm font-bold block">
                          ☑️ Super Bot Fight Mode / Bot Management
                        </strong>
                        <span className="text-[11px] text-muted-foreground">
                          {lang === "bn"
                            ? "বট ফাইট মোডের কারণে আসা Turnstile Challenge ও 403 Forbidden পুরোপুরি বন্ধ হবে।"
                            : "Prevents Bot Fight Mode Turnstile Challenges and automated 403 blocks."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Deploy & Verify */}
              <div className="rounded-2xl border-2 border-brand-green/30 bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-brand-green/15 text-brand-green font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "bn"
                      ? "ধাপ ৪: Deploy করুন এবং লাইভ টেস্ট দিন"
                      : "Step 4: Deploy Rule & Test Connection"}
                  </h3>
                </div>

                <div className="pl-10 space-y-3 text-xs md:text-sm text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>
                      {lang === "bn" ? (
                        <>Cloudflare ড্যাশবোর্ডের নিচে <strong>Deploy</strong> বাটনে ক্লিক করে রুলটি এক্টিভ করুন।</>
                      ) : (
                        <>Click the <strong>Deploy</strong> button at the bottom of the Cloudflare page.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <>WordPress ড্যাশবোর্ডে <strong>Carrothost SST</strong> প্লাগইনে ফিরে যান।</>
                      ) : (
                        <>Go back to your WordPress Admin dashboard and open <strong>Carrothost SST</strong>.</>
                      )}
                    </li>
                    <li>
                      {lang === "bn" ? (
                        <><strong>Dashboard</strong> ট্যাবে গিয়ে <strong>⚡ Run Test Ping</strong> বাটনে ক্লিক করুন।</>
                      ) : (
                        <>Navigate to the <strong>Dashboard</strong> tab and click <strong>⚡ Run Test Ping</strong>.</>
                      )}
                    </li>
                  </ol>

                  <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-3.5 text-xs text-brand-green flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {lang === "bn"
                        ? "অভিনন্দন! আপনার প্রক্সি এন্ডপয়েন্টটি এখন ক্লাউডফ্লেয়ারের চ্যালেঞ্জ ছাড়াই ১০০% সাকসেসফুল 200 OK রেসপন্স দিচ্ছে।"
                        : "Success! Your tracking proxy endpoint is now bypassing Cloudflare challenges with a clean 200 OK status."}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: FAQ */}
            <section id="troubleshooting" className="space-y-5 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <HelpCircle className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "৭. সাধারণ প্রশ্নোত্তর (FAQ)" : "7. Frequently Asked Questions (FAQ)"}
                </h2>
              </div>

              <div className="space-y-4">
                {(lang === "bn"
                  ? [
                      {
                        q: "Transport URL-এ /metrics/ দেওয়ার কারণ কি?",
                        a: "আমাদের Nginx ওয়েব সার্ভার কোরে /metrics/ পাথে একটি বিশেষ রিভার্স প্রক্সি কনফিগার করা রয়েছে। এটি কোনো ভারী নোড ইঞ্জিন ছাড়াই গুগল এবং মেটার রিকোয়েস্ট নিজের ডোমেইনের মাধ্যমে প্রক্সি করে ফার্স্ট-পার্টি কুকি হিসেবে ব্রাউজারে ফিরিয়ে দেয়।",
                      },
                      {
                        q: "আমার সাইট Cloudflare-এ থাকলে কি ট্র্যাকিং বা টেস্ট পিং ব্লক হতে পারে?",
                        a: "হ্যাঁ, Cloudflare-এর Bot Fight Mode বা WAF অনেক সময় প্লাগইনের টেস্ট পিং বা সার্ভার ট্র্যাকিং রিকোয়েস্টকে বট মনে করে 403 Forbidden বা Turnstile Challenge দিয়ে আটকে দেয়। সমাধান হলো: Cloudflare Security > WAF > Custom Rules-এ গিয়ে URI Path 'starts with /metrics/' দিয়ে একটি Skip/Bypass রুল তৈরি করে Super Bot Fight Mode এবং WAF Managed Rules স্কিপ করা (বিস্তারিত উপরের ৬ নম্বর সেকশনে দেওয়া আছে)।",
                      },
                      {
                        q: "আমার সাইটে কি Stape বা Google Cloud Container প্রয়োজন আছে?",
                        a: "একদমই না! Stape বা GCP-তে প্রতি মাসে $20 থেকে $100 ডলার পর্যন্ত খরচ হয় এবং মেমোরি লিক করে। CarrotHost-এর Node-Free প্রযুক্তি সম্পূর্ণ ফ্রি এবং সরাসরি হোস্টিং অ্যাকাউন্টের সাথে বিল্ট-ইন থাকে।",
                      },
                      {
                        q: "ডুপ্লিকেট ইভেন্ট (Deduplication) রোধ হবে কিভাবে?",
                        a: "আমাদের প্লাগইন স্বয়ংক্রিয়ভাবে ব্রাউজার পিক্সেল এবং সার্ভার CAPI উভয়ের জন্য একই event_id জেনারেট করে। ফলে ফেসবুক স্বয়ংক্রিয়ভাবে ইভেন্ট ডিডুপ্লিকেট করে ফেলে এবং ডাবল কাউন্টিং হয় না।",
                      },
                      {
                        q: "সেটআপ করতে কোনো সমস্যা হলে কি সাপোর্ট পাওয়া যাবে?",
                        a: "হ্যাঁ, আমাদের সিনিয়র ট্র্যাকিং ইঞ্জিনিয়াররা সম্পূর্ণ ফ্রিতে WhatsApp বা AnyDesk-এর মাধ্যমে আপনার ড্যাশবোর্ডে কানেক্ট হয়ে পুরো সেটআপ সম্পন্ন করে দেবে।",
                      },
                      {
                        q: "Meta Events Manager-এ “expired fbclid value in fbc parameter” ওয়ার্নিং আসছে কেন?",
                        a: "কোনো কাস্টমার ৯০ দিনের বেশি আগে বিজ্ঞাপনে ক্লিক করেছিলেন এবং তার ব্রাউজারে পুরনো fbc কুকি থেকে গেছে — ফিরে এসে অর্ডার করলে সেই পুরনো মান সার্ভার থেকে Meta-তে চলে যেত। v1.4.0 থেকে প্লাগইন ৯০ দিনের পুরনো fbc পাঠায় না। ওয়ার্নিংটি Meta-র ডায়াগনস্টিকসে সর্বশেষ ৩ দিনের ডেটা দেখায়, তাই আপডেটের ৩ দিন পর নিজে থেকেই মুছে যাবে।",
                      },
                      {
                        q: "Meta ডায়াগনস্টিকসে invalid.invalid বা fb.com ডোমেইন allowlist করতে বলছে — করব?",
                        a: "না। এগুলো আপনার সার্ভার থেকে আসে না — Facebook-এর নিজস্ব crawler/প্রিভিউ আপনার পেজ লোড করার সময় Pixel ফায়ার হয়। Events Manager > Settings > Traffic permissions-এ শুধু আপনার নিজের ডোমেইন allowlist করুন।",
                      },
                      {
                        q: "ড্যাশবোর্ডে Google-এর অর্ডার % Facebook-এর চেয়ে কম কেন?",
                        a: "Facebook Purchase সার্ভার থেকে যায় (পেমেন্ট সম্পন্ন হলেই), আর Google Purchase যায় ব্রাউজার থেকে thank-you পেজ লোড হলে। কাস্টমার পেমেন্টের পর পেজে না ফিরলে (যেমন bKash/SSLCommerz-এ ট্যাব বন্ধ করলে) Google-এ সেই অর্ডার যায় না। তাই Google-এর % কিছুটা কম হওয়া স্বাভাবিক।",
                      },
                      {
                        q: "ড্যাশবোর্ডে Email-এর % কম দেখাচ্ছে, সমস্যা কি?",
                        a: "অনেক বাংলাদেশি শপে চেকআউটে ইমেইল ঐচ্ছিক বা লুকানো থাকে। ফোন নম্বর (৮৮০ কান্ট্রি কোড সহ) থাকলেও Match Quality ভালো থাকে। তবে ইমেইল ফিল্ড দৃশ্যমান রাখলে স্কোর আরও বাড়ে — ড্যাশবোর্ডের Recommendations সেকশনেও এই পরামর্শ দেখাবে।",
                      },
                    ]
                  : [
                      {
                        q: "Why do we append /metrics/ to the Transport URL?",
                        a: "Our Nginx web server core configures a native reverse proxy on the /metrics/ path. This forwards requests through your own first-party domain, bypassing ad-blockers and preserving tracking cookies with zero Node.js memory leaks.",
                      },
                      {
                        q: "Will Cloudflare Bot Fight Mode or WAF block tracking or test pings?",
                        a: "Yes, Cloudflare's Bot Fight Mode or Managed WAF might classify tracking test pings or proxy requests as bots (triggering Turnstile Challenge or HTTP 403). To fix this, create a WAF Bypass rule under Cloudflare Security > WAF > Custom Rules: set URI Path 'starts with /metrics/' and Action to Skip/Bypass Super Bot Fight Mode and WAF Managed Rules (detailed in Section 6 above).",
                      },
                      {
                        q: "Do I need a paid Stape.io or Google Cloud Platform (GCP) container?",
                        a: "Not at all! Stape and GCP cost $20 to $100+/month and suffer from container memory crashes. CarrotHost's Node-Free tracking is 100% free and native to all our Webuzo hosting plans.",
                      },
                      {
                        q: "How does event deduplication work between Pixel and CAPI?",
                        a: "The plugin generates a shared unique event_id for both the browser pixel and the server-side Conversions API. Meta automatically deduplicates them, ensuring accurate reporting without double counting.",
                      },
                      {
                        q: "Can CarrotHost support help me configure the setup?",
                        a: "Yes! Our senior engineers provide free white-glove setup over WhatsApp or AnyDesk for all CarrotHost clients.",
                      },
                      {
                        q: "Why does Meta Events Manager show “expired fbclid value in fbc parameter”?",
                        a: "A customer clicked an ad more than 90 days ago and still has the old fbc cookie in their browser — when they returned to order, that stale value was sent from the server to Meta. Since v1.4.0 the plugin no longer sends fbc values older than 90 days. Meta diagnostics cover the last 3 days, so the warning disappears on its own about 3 days after updating.",
                      },
                      {
                        q: "Meta diagnostics asks me to allowlist invalid.invalid or fb.com domains — should I?",
                        a: "No. These do not come from your server — they appear when Facebook's own crawler or link preview loads your page and the Pixel fires. In Events Manager > Settings > Traffic permissions, allowlist only your own domain.",
                      },
                      {
                        q: "Why is Google's order % lower than Facebook's on the dashboard?",
                        a: "The Facebook Purchase is sent from the server as soon as payment completes, while the Google Purchase fires in the browser when the thank-you page loads. If a customer never returns after paying (for example closes the tab on bKash/SSLCommerz), Google misses that order. A somewhat lower Google percentage is normal.",
                      },
                      {
                        q: "The dashboard shows a low Email percentage — is that a problem?",
                        a: "Many Bangladeshi stores make the email field optional or hidden at checkout. Match Quality can still be good if the phone number (with the 880 country code) is present, but keeping the email field visible raises the score further — the dashboard Recommendations box will suggest it too.",
                      },
                    ]
                ).map((item) => (
                  <div key={item.q} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <h4 className="font-bold text-sm text-foreground flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                      {item.q}
                    </h4>
                    <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed pl-6">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom Support Banner */}
            <div className="rounded-2xl bg-gradient-brand p-8 text-primary-foreground shadow-elegant flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-bold">
                  {lang === "bn" ? "সেটআপে সহায়তা প্রয়োজন?" : "Need Help with Setup?"}
                </h3>
                <p className="text-xs opacity-90 max-w-md">
                  {lang === "bn"
                    ? "আমাদের ট্র্যাকিং টিম সম্পূর্ণ ফ্রিতে আপনার ওয়ার্ডপ্রেস বা সার্ভার-সাইড ট্র্যাকিং কনফিগার করে দিতে প্রস্তুত।"
                    : "Our senior tracking engineers will connect and configure your WordPress GTM and Meta CAPI tracking 100% free."}
                </p>
              </div>
              <a
                href="https://wa.me/8801787882277?text=Hello%20CarrotHost,%20I%20need%20help%20setting%20up%20Server-Side%20Tracking%20and%20Facebook%20CAPI."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shrink-0 text-xs shadow-soft"
              >
                <Phone className="h-4 w-4" /> Message on WhatsApp
              </a>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
