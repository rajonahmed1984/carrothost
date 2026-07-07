import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Globe,
  ArrowRight,
  Search,
  Shield,
  Zap,
  Clock,
  HelpCircle,
} from "lucide-react";
import { DomainSearchIllustration } from "@/components/DomainSearchIllustration";

export const Route = createFileRoute("/domains")({
  head: () => ({
    meta: [
      { title: "Domain Registration — CarrottHost" },
      { name: "description", content: "Register domains at CarrottHost. Search .com, .com.bd, .net, .bd and 300+ TLDs with free DNS, WHOIS privacy, and instant activation." },
      { property: "og:title", content: "Domain Registration — CarrottHost" },
      { property: "og:description", content: "Search and register domains with free DNS, WHOIS privacy, and instant activation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DomainsPage,
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
          <Link to="/domains" className="text-foreground font-semibold transition">Domains</Link>
          <Link to="/hosting" className="hover:text-foreground transition">Hosting</Link>
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

function SearchHero() {
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
              <Globe className="h-3.5 w-3.5" />
              300+ TLDs available
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
              Find the perfect <span className="text-brand-orange">domain name</span> for your brand
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Search .com, .com.bd, .net, .bd and more. Every domain includes free DNS, email forwarding, and instant activation.
            </p>
            <form
              className="mt-8 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1 flex items-center rounded-xl border border-input bg-background px-4 focus-within:ring-2 focus-within:ring-ring transition">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="yourbusiness"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />
              </div>
              <button className="rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition">
                Search Domain
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
              {[".com", ".com.bd", ".net", ".bd", ".org", ".xyz"].map((tld) => (
                <span key={tld} className="rounded-full bg-secondary/70 px-3 py-1">{tld}</span>
              ))}
            </div>
          </div>
          <DomainSearchIllustration />
        </div>
      </div>

    </section>
  );
}

function PriceTable() {
  const domains = [
    { tld: ".com", price: "৳1,190", renew: "৳1,190", badge: "Popular" },
    { tld: ".com.bd", price: "৳1,800", renew: "৳1,800", badge: "Local" },
    { tld: ".net", price: "৳1,290", renew: "৳1,290", badge: null },
    { tld: ".bd", price: "৳2,500", renew: "৳2,500", badge: "Bangladesh" },
    { tld: ".org", price: "৳1,390", renew: "৳1,390", badge: null },
    { tld: ".xyz", price: "৳290", renew: "৳1,190", badge: "Budget" },
    { tld: ".info", price: "৳1,490", renew: "৳1,490", badge: null },
    { tld: ".co", price: "৳1,990", renew: "৳2,490", badge: "Trending" },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">Transparent domain pricing</h2>
          <p className="mt-3 text-muted-foreground">
            No hidden fees. Registration and renewal prices are clearly listed upfront.
          </p>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Extension</th>
                  <th className="px-6 py-4">Registration</th>
                  <th className="px-6 py-4">Renewal</th>
                  <th className="px-6 py-4">Included</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {domains.map((d) => (
                  <tr key={d.tld} className="bg-card hover:bg-secondary/20 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground text-base">{d.tld}</span>
                        {d.badge && (
                          <span className="inline-flex rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
                            {d.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-orange">{d.price}/yr</td>
                    <td className="px-6 py-4 text-muted-foreground">{d.renew}/yr</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {["DNS", "SSL", "WHOIS", "Email"].map((f, i) => (
                          <span key={f} className="inline-flex items-center gap-1">
                            <GlowCheck delay={i * 0.15} />
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition">
                        Register <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlowCheck({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="glow-check relative inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-green"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="absolute inset-0 rounded-full bg-brand-green/25 blur-[3px] glow-check-halo" />
      <svg viewBox="0 0 16 16" className="relative h-3 w-3">
        <path
          d="M3 8.5 L6.5 12 L13 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="glow-check-path"
          style={{ animationDelay: `${delay}s` }}
        />
      </svg>
      <style>{`
        .glow-check-halo { animation: glow-halo 2.6s ease-in-out infinite; }
        @keyframes glow-halo { 0%,100% { opacity: .35 } 50% { opacity: .9 } }
        .glow-check-path { stroke-dasharray: 20; stroke-dashoffset: 20; animation: glow-draw 2.6s ease-in-out infinite; }
        @keyframes glow-draw {
          0% { stroke-dashoffset: 20 }
          30%,100% { stroke-dashoffset: 0 }
        }
        @media (prefers-reduced-motion: reduce) {
          .glow-check-halo, .glow-check-path { animation: none !important; stroke-dashoffset: 0 !important; opacity: 1 !important }
        }
      `}</style>
    </span>
  );
}


function Benefits() {
  const benefits = [
    {
      icon: Shield,
      title: "Free WHOIS Privacy",
      desc: "Keep your personal information private with free WHOIS privacy protection on eligible domains.",
    },
    {
      icon: Zap,
      title: "Instant Activation",
      desc: "Your domain is registered and ready to use within minutes — no waiting, no hassle.",
    },
    {
      icon: Clock,
      title: "Free DNS Management",
      desc: "Full control over your DNS records, nameservers, and redirects from our easy dashboard.",
    },
    {
      icon: HelpCircle,
      title: "Local Support",
      desc: "Our Bangladesh-based team helps you choose, register, and manage domains in Bangla or English.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Why Choose CarrottHost</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Domains built for Bangladeshi businesses
          </h2>
          <p className="mt-3 text-muted-foreground">
            We combine global reach with local understanding — from .com.bd registrations to bKash payments.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-orange hover:shadow-elegant transition"
            >
              <div
                className="glow-icon relative h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-brand-orange"
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                <span className="absolute inset-0 rounded-xl bg-brand-orange/20 blur-md glow-icon-halo" />
                <b.icon className="relative h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <style>{`
          .glow-icon-halo { opacity: .25; animation: glow-icon-pulse 3s ease-in-out infinite; }
          @keyframes glow-icon-pulse { 0%,100% { opacity: .15; transform: scale(.9) } 50% { opacity: .55; transform: scale(1.1) } }
          .group:hover .glow-icon-halo { opacity: .7; }
          @media (prefers-reduced-motion: reduce) { .glow-icon-halo { animation: none } }
        `}</style>

      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "How long does domain registration take?",
      a: "Most domains are registered and active within minutes. Some country-code domains like .com.bd may require additional verification and can take 24–48 hours.",
    },
    {
      q: "Can I transfer my existing domain to CarrottHost?",
      a: "Yes. Domain transfers are simple and we guide you through the process. Your domain stays online throughout the transfer with zero downtime.",
    },
    {
      q: "Do you offer email with domains?",
      a: "Every domain includes free email forwarding. You can also upgrade to full-featured professional email hosting with your own @yourdomain.com addresses.",
    },
    {
      q: "What happens if I forget to renew?",
      a: "We send multiple renewal reminders before expiration. If a domain does expire, most TLDs include a 30-day grace period where you can still renew at standard rates.",
    },
    {
      q: "Is WHOIS privacy really free?",
      a: "Yes — on all eligible TLDs we include WHOIS privacy protection at no extra cost. This keeps your personal contact details hidden from public WHOIS lookups.",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">Common questions about domains</h2>
        </div>
        <div className="mt-14 space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
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
              Ready to claim your domain?
            </h2>
            <p className="mt-4 max-w-xl mx-auto opacity-90">
              Search now and secure your brand name before someone else does.
            </p>
            <form
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1 flex items-center rounded-xl bg-white/20 backdrop-blur px-4 border border-white/20 focus-within:ring-2 focus-within:ring-white/40 transition">
                <Search className="h-5 w-5 text-white/70" />
                <input
                  type="text"
                  placeholder="yourbusiness"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm text-white placeholder:text-white/60"
                />
              </div>
              <button className="rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-orange hover:bg-white/90 transition">
                Search Domain
              </button>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Free DNS</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Instant activation</span>
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
              <li><Link to="/" className="hover:text-foreground transition">Domain Registration</Link></li>
              <li><Link to="/" className="hover:text-foreground transition">Shared Hosting</Link></li>
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

function DomainsPage() {
  return (
    <div>
      <PageHeader />
      <SearchHero />
      <PriceTable />
      <Benefits />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}