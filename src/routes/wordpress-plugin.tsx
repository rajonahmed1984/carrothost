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
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/wordpress-plugin")({
  head: () => {
    const seo = createSeoMeta({
      title: "Server-Side Tracking (GTM & Facebook CAPI) Setup Guide — CarrotHost",
      description:
        "Comprehensive setup guide for CarrotHost Node-Free Server-Side Tracking, WordPress plugin, Google Tag Manager (GTM), Facebook Conversions API (CAPI), and Cloudflare WAF Bypass in Bangla and English.",
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
  "gtm-setup",
  "capi-setup",
  "method-a",
  "method-b",
  "diagnostics",
  "woocommerce-events",
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
      { id: "gtm-setup", label: "১. Google Tag Manager (GTM) সেটআপ" },
      { id: "capi-setup", label: "২. Facebook Conversions API (CAPI) সেটআপ" },
      { id: "method-a", label: "• পদ্ধতি A: Server GTM এর মাধ্যমে" },
      { id: "method-b", label: "• পদ্ধতি B: প্লাগইন দিয়ে ১-ক্লিক সেটআপ" },
      { id: "diagnostics", label: "৩. টেস্ট ও ভেরিফিকেশন (Live Health)" },
      { id: "woocommerce-events", label: "৪. WooCommerce অটো-ইভেন্ট ম্যাপিং" },
      { id: "cloudflare-waf", label: "৫. Cloudflare WAF ও Bot Mode বাইপাস (জরুরি)" },
      { id: "troubleshooting", label: "৬. সাধারণ প্রশ্নোত্তর (FAQ)" },
    ],
    en: [
      { id: "overview", label: "Why Use This Feature?" },
      { id: "gtm-setup", label: "1. Google Tag Manager (GTM) Setup" },
      { id: "capi-setup", label: "2. Facebook Conversions API (CAPI) Setup" },
      { id: "method-a", label: "• Method A: Via Server GTM (Advanced)" },
      { id: "method-b", label: "• Method B: Via Plugin (1-Click Setup)" },
      { id: "diagnostics", label: "3. Testing & Verification" },
      { id: "woocommerce-events", label: "4. WooCommerce Automated Events" },
      { id: "cloudflare-waf", label: "5. Cloudflare WAF & Bot Mode Bypass (Important)" },
      { id: "troubleshooting", label: "6. Frequently Asked Questions (FAQ)" },
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
                <span>{lang === "bn" ? "প্লাগইন ভার্সন:" : "Plugin Version:"} <strong className="text-foreground">1.3.5 (Official)</strong></span>
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
              <h2 className="text-sm font-bold text-foreground">carrothost-server-side-tracker.zip</h2>
              <p className="text-xs text-muted-foreground">
                {lang === "bn"
                  ? "অফিসিয়াল প্লাগইন রিলিজ — ফার্স্ট-পার্টি Nginx প্রক্সি ও WooCommerce CAPI অটো-ম্যাপিং সহ।"
                  : "Official release containing first-party Nginx tracking proxies & WooCommerce automated CAPI hooks."}
              </p>
              <a
                href="/carrothost-server-side-tracker.zip"
                download="carrothost-server-side-tracker.zip"
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

            {/* Section 2: GTM Server-Side Setup */}
            <section id="gtm-setup" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Layers className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn" ? "১. Google Tag Manager (GTM) Server-Side ট্র্যাকিং সেটআপ" : "1. Google Tag Manager (GTM) Server-Side Tracking Setup"}
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
                  {lang === "bn" ? "৩. টেস্ট ও ভেরিফিকেশন (Live Health)" : "3. Testing & Verification"}
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

              {/* Plugin Test Ping Box */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-brand-green" />
                    {lang === "bn" ? "Carrothost SST লাইভ কানেকশন পিং (Live Ping)" : "Carrothost SST Live Connection Health Ping"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "bn"
                      ? "Carrothost SST প্লাগইনের Connection Health & Logs ট্যাবে গিয়ে ⚡ Run Test Ping Now বাটনে ক্লিক করলেই মুহূর্তেই স্ট্যাটাস পেয়ে যাবেন:"
                      : "In the Connection Health & Logs tab of Carrothost SST, click '⚡ Run Test Ping Now' to verify live endpoints:"}
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
                            ৫ নম্বর সেকশন দেখে Cloudflare WAF Bypass রুল
                          </a>{" "}
                          সেট করে নিলেই সমাধান হয়ে যাবে।
                        </>
                      ) : (
                        <>
                          If Cloudflare is enabled, Bot Fight Mode or Turnstile Challenge may block test pings with a 403 Forbidden. Follow{" "}
                          <a href="#cloudflare-waf" className="font-bold text-brand-orange hover:underline">
                            Section 5 below to add a Cloudflare WAF Bypass rule
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
                  {lang === "bn" ? "৪. WooCommerce অটো-ইভেন্ট ম্যাপিং" : "4. WooCommerce Automated Event Mapping"}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "আপনার সাইটে WooCommerce সক্রিয় থাকলে প্লাগইন স্বয়ংক্রিয়ভাবে ই-কমার্স ইভেন্টগুলো সার্ভার-সাইডে ট্রিগার করে এবং গ্রাহকের তথ্য নিরাপদভাবে হ্যাশ করে মেটাতে পাঠায়:"
                  : "If WooCommerce is active on your site, our plugin automatically hooks into standard e-commerce actions and securely hashes customer data for Meta CAPI:"}
              </p>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/60">
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "ইভেন্টের নাম" : "Event Name"}</th>
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "ট্রিগার লোকেশন" : "Trigger Location"}</th>
                      <th className="p-3.5 font-bold text-foreground">{lang === "bn" ? "হ্যাশড প্যারামিটার ও ডেটা" : "Hashed Payload & Parameters"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-brand-green">ViewContent</td>
                      <td className="p-3.5">{lang === "bn" ? "সিঙ্গেল প্রোডাক্ট পেজ" : "Single Product Page"}</td>
                      <td className="p-3.5">content_name, content_type, content_ids, value, currency</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-brand-orange">AddToCart</td>
                      <td className="p-3.5">{lang === "bn" ? "AJAX / কার্ট বাটন ক্লিক" : "AJAX / Single Cart Add"}</td>
                      <td className="p-3.5">content_ids, content_name, value, currency</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-foreground">InitiateCheckout</td>
                      <td className="p-3.5">{lang === "bn" ? "চেকআউট পেজ" : "Checkout Page"}</td>
                      <td className="p-3.5">num_items, value, currency, content_ids</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-primary">Purchase</td>
                      <td className="p-3.5">{lang === "bn" ? "থ্যাংক ইউ / অর্ডার রিসিভড" : "Thank You / Order Received Page"}</td>
                      <td className="p-3.5">order_id, value, currency, SHA-256 (email, phone, IP, User-Agent)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5: Cloudflare WAF & Bot Fight Mode Bypass */}
            <section id="cloudflare-waf" className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Cloud className="h-5 w-5 text-brand-orange" />
                <h2 className="text-2xl font-extrabold text-foreground">
                  {lang === "bn"
                    ? "৫. Cloudflare WAF ও Bot Fight Mode বাইপাস সেটআপ"
                    : "5. Cloudflare WAF & Bot Fight Mode Bypass Setup"}
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
                        <><strong>Connection Health & Logs</strong> ট্যাবে গিয়ে <strong>⚡ Run Test Ping Now</strong> বাটনে ক্লিক করুন।</>
                      ) : (
                        <>Navigate to the <strong>Connection Health & Logs</strong> tab and click <strong>⚡ Run Test Ping Now</strong>.</>
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
                  {lang === "bn" ? "৬. সাধারণ প্রশ্নোত্তর (FAQ)" : "6. Frequently Asked Questions (FAQ)"}
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
                        a: "হ্যাঁ, Cloudflare-এর Bot Fight Mode বা WAF অনেক সময় প্লাগইনের টেস্ট পিং বা সার্ভার ট্র্যাকিং রিকোয়েস্টকে বট মনে করে 403 Forbidden বা Turnstile Challenge দিয়ে আটকে দেয়। সমাধান হলো: Cloudflare Security > WAF > Custom Rules-এ গিয়ে URI Path 'starts with /metrics/' দিয়ে একটি Skip/Bypass রুল তৈরি করে Super Bot Fight Mode এবং WAF Managed Rules স্কিপ করা (বিস্তারিত উপরের ৫ নম্বর সেকশনে দেওয়া আছে)।",
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
                    ]
                  : [
                      {
                        q: "Why do we append /metrics/ to the Transport URL?",
                        a: "Our Nginx web server core configures a native reverse proxy on the /metrics/ path. This forwards requests through your own first-party domain, bypassing ad-blockers and preserving tracking cookies with zero Node.js memory leaks.",
                      },
                      {
                        q: "Will Cloudflare Bot Fight Mode or WAF block tracking or test pings?",
                        a: "Yes, Cloudflare's Bot Fight Mode or Managed WAF might classify tracking test pings or proxy requests as bots (triggering Turnstile Challenge or HTTP 403). To fix this, create a WAF Bypass rule under Cloudflare Security > WAF > Custom Rules: set URI Path 'starts with /metrics/' and Action to Skip/Bypass Super Bot Fight Mode and WAF Managed Rules (detailed in Section 5 above).",
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
