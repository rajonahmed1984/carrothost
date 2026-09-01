import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  breadcrumbSchema,
  createSeoMeta,
  faqSchema,
  jsonLdScript,
} from "@/lib/seo";
import {
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Phone,
  Server,
  Database,
  Mail,
  Lock,
  Clock,
  HelpCircle,
  Sparkles,
  Send,
} from "lucide-react";
import { useState } from "react";

const MIGRATION_FAQS = [
  {
    q: "Will my website experience any downtime during migration?",
    a: "No! We provide a 100% Zero Downtime Guarantee. We migrate and thoroughly test your entire website, database, and emails on our temporary server environment before switching your DNS. Your visitors will experience uninterrupted service.",
  },
  {
    q: "How much does the website migration service cost?",
    a: "It is 100% completely FREE. Every CarrotHost Webuzo Cloud Hosting and VPS plan includes full white-glove site migration handled by our senior engineers.",
  },
  {
    q: "How long does a website migration usually take?",
    a: "Most standard WordPress, WooCommerce, and cPanel websites are fully transferred, configured, and verified within 2 to 4 hours.",
  },
  {
    q: "Will my email accounts and past inbox messages be preserved?",
    a: "Yes! All email addresses, passwords, inbox folders, sent history, and forwarders are copied over completely with zero loss.",
  },
  {
    q: "Will you configure Server-Side Tracking for my store during migration?",
    a: "Yes! If you run an e-commerce or lead generation store, our team will install and configure the CarrotHost Server-Side Tracker plugin and first-party Nginx GTM proxy free of charge.",
  },
];

export const Route = createFileRoute("/migrate-to-us")({
  head: () => {
    const seo = createSeoMeta({
      title: "100% Free Website Migration with Zero Downtime — CarrotHost",
      description:
        "Switch to CarrotHost with zero downtime. Free expert migration for WordPress, WooCommerce, cPanel, and custom websites with emails, databases, and Server-Side Tracking setup included.",
      path: "/migrate-to-us",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-migrate-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Migrate to Us", path: "/migrate-to-us" },
          ]),
        ),
        jsonLdScript(
          "ld-migrate-faq",
          faqSchema(MIGRATION_FAQS.map((item) => ({ question: item.q, answer: item.a }))),
        ),
      ],
    };
  },
  component: MigrateToUsPage,
});

function MigrateToUsPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    domain: "",
    currentHost: "cPanel",
    plan: "Webuzo Hosting",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-soft py-16 md:py-24 border-b border-border">
        <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/15 border border-brand-green/30 px-4 py-1.5 text-xs font-bold text-brand-green">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Free Website Migration • Zero Downtime Guarantee</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Switch to CarrotHost with <span className="text-gradient-brand">Zero Downtime</span>
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Frustrated by slow loading speeds, random server crashes, and missing ad conversions?
            Let our senior engineering team move your entire website, databases, emails, and SSL to
            our high-speed cloud servers — completely free!
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <a
              href="#migration-form"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
            >
              Request Free Migration <ArrowRight className="h-4.5 w-4.5" />
            </a>
            <a
              href="https://wa.me/8801787882277?text=Hello%20CarrotHost,%20I%20want%20to%20migrate%20my%20website%20to%20your%20server."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-4 font-bold text-foreground hover:border-brand-orange hover:bg-secondary/40 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Phone className="h-4.5 w-4.5 text-brand-green animate-bounce" /> WhatsApp Specialist
            </a>
          </div>

          {/* Quick Perks Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-foreground/80 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-green" /> 100% Free Service
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-green" /> No Data or File Loss
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-green" /> Complete Email Transfer
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-green" /> Done in 2–4 Hours
            </span>
          </div>
        </div>
      </section>

      {/* What We Migrate For Free */}
      <section className="py-20 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
              Full-Stack Transfer
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              Everything we transfer for your website
            </h2>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              You won't have to reconfigure databases, recreate emails, or reinstall plugins. We handle the entire process.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Server,
                title: "Complete Website Files",
                desc: "Every WordPress, WooCommerce, Laravel, or custom PHP file transferred with intact permissions and zero corruption.",
              },
              {
                icon: Database,
                title: "MySQL Databases",
                desc: "All database tables, users, and collations migrated cleanly with optimized database connection configurations.",
              },
              {
                icon: Mail,
                title: "Email Inboxes & History",
                desc: "We migrate your @yourdomain.com email accounts, passwords, past inbox history, and forwarders with zero lost messages.",
              },
              {
                icon: Lock,
                title: "SSL & DNS Configuration",
                desc: "Auto-issuance of Let's Encrypt SSL certificates and assistance in updating A/CNAME/MX records seamlessly.",
              },
              {
                icon: Zap,
                title: "100% Node-Free Tracking Setup",
                desc: "We configure the CarrotHost Server-Side Tracker plugin and first-party Nginx proxy for your store right after migration.",
              },
              {
                icon: Sparkles,
                title: "Speedy Cache Tuning",
                desc: "We configure server-level Speedy Cache so your transferred website loads noticeably faster than your old host.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-background p-6 shadow-soft hover:shadow-elegant hover:border-brand-orange transition flex flex-col justify-between"
              >
                <div>
                  <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-brand-orange mb-4">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-green">
                  <Check className="h-3.5 w-3.5" />
                  <span>100% Included Free</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Simple Steps Process */}
      <section className="py-20 bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-3.5 py-1 rounded-full">
              Hassle-Free Workflow
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              How the migration works
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sit back and relax while our migration engineers take care of the heavy lifting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Choose Your Plan",
                desc: "Order any Webuzo Cloud or VPS hosting plan that fits your business needs.",
              },
              {
                step: "02",
                title: "Provide Current Access",
                desc: "Submit your cPanel login or full backup link via our form or WhatsApp.",
              },
              {
                step: "03",
                title: "Zero-Downtime Launch",
                desc: "We copy files, verify databases, and point DNS. Your site runs faster instantly.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft relative overflow-hidden"
              >
                <span className="text-4xl font-black text-secondary font-mono absolute top-4 right-4">
                  {s.step}
                </span>
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-gradient-brand text-primary-foreground font-bold text-xs flex items-center justify-center mb-4">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Migration Request Form */}
      <section id="migration-form" className="py-20 md:py-28 bg-card border-b border-border">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-3xl border border-border bg-background p-8 md:p-12 shadow-elegant space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                Quick Request Form
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Submit Your Migration Details
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Fill in the details below and our team will get in touch within 15 minutes.
              </p>
            </div>

            {formSubmitted ? (
              <div className="rounded-2xl bg-brand-green/10 border border-brand-green/30 p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-foreground">Migration Request Received!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you, <strong>{formData.name || "Customer"}</strong>. Our technical migration
                  team has received your request for <strong>{formData.domain || "your website"}</strong>.
                  We will contact you via WhatsApp/Phone shortly!
                </p>
                <div className="pt-3">
                  <a
                    href="https://wa.me/8801787882277"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 font-bold text-white shadow-soft text-xs"
                  >
                    <Phone className="h-4 w-4" /> Message Us on WhatsApp for Instant Priority
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@domain.com"
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Website Domain *</label>
                    <input
                      type="text"
                      required
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="example.com"
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Current Host</label>
                    <select
                      value={formData.currentHost}
                      onChange={(e) => setFormData({ ...formData, currentHost: e.target.value })}
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="cPanel">cPanel Host (Any)</option>
                      <option value="Hostinger">Hostinger</option>
                      <option value="Namecheap">Namecheap</option>
                      <option value="GoDaddy">GoDaddy</option>
                      <option value="Bluehost">Bluehost</option>
                      <option value="Other">Other / Custom VPS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">CarrotHost Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="Webuzo Hosting">Webuzo Cloud Hosting (Starter / Standard / Adv)</option>
                      <option value="BDIX Cloud VPS">BDIX Cloud VPS</option>
                      <option value="Xeon Cloud VPS">Xeon Cloud VPS</option>
                      <option value="Need Recommendation">Need Advice from Team</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Special Notes / Backup Details</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Provide any details like cPanel backup link, login details, or questions..."
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition"
                >
                  <Send className="h-4.5 w-4.5" /> Submit Free Migration Request
                </button>

                <p className="text-[11px] text-center text-muted-foreground">
                  🔒 Your credentials and data are handled with strict NDA confidentiality.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Migration FAQ */}
      <section className="py-20 bg-gradient-soft border-b border-border">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
              Migration FAQ
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {MIGRATION_FAQS.map((faq) => (
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

      {/* Direct Contact Banner */}
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Prefer talking directly to our migration team?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            You can also send your backup link directly on WhatsApp or call our support line.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/8801787882277"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-6 py-3.5 font-bold text-white shadow-soft hover:opacity-95 transition text-sm"
            >
              <Phone className="h-4 w-4" /> Message on WhatsApp (01787-882277)
            </a>
            <a
              href="tel:01787882277"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 font-semibold text-foreground hover:border-brand-orange transition text-sm"
            >
              Call 01787-882277
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
