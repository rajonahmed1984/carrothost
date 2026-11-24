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
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { waLink, PHONE_DISPLAY, PHONE_TEL } from "@/lib/contact";

const HOME_FAQS = [
  {
    q: "Is server-side tracking really included for free?",
    a: "Yes. Our Webuzo hosting plans include Node-free server-side tracking for Meta Conversions API and GTM, plus our free WordPress plugin. You don't need a separate Stape.io subscription or cloud server.",
  },
  {
    q: "Which plan is right for my online shop?",
    a: "Most WooCommerce shops start on Shared Webuzo hosting. If you have high traffic or mostly local visitors, a BDIX VPS gives faster local speed. Message us on WhatsApp and we'll suggest a plan for free.",
  },
  {
    q: "Do you give support in Bangla?",
    a: "Yes. Our team supports you in Bangla and English by phone and WhatsApp.",
  },
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
      title: "CarrotHost — WooCommerce Hosting with Free Server-Side Tracking in Bangladesh",
      description:
        "Fast WordPress & WooCommerce hosting with free Meta CAPI & GTM server-side tracking, BDIX VPS, free migration, bKash/Nagad payment and Bangla support.",
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
              Bangladeshi hosting · Since 2014
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Hosting for Online Shops That{" "}
              <span className="text-gradient-brand">Run Facebook Ads</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Fast WordPress & WooCommerce hosting with{" "}
              <strong className="text-foreground">free server-side tracking</strong> for Meta CAPI
              and GTM built in. No Stape.io bill, no extra server. Plus BDIX VPS for local speed and
              Bangla support on WhatsApp.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <Link
                to="/hosting"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
              >
                See Plans · from ৳350/mo <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <a
                href={waLink("Hello CarrotHost, I want to move my website to your hosting. Please help with free migration.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-bold text-white hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
              >
                <WhatsAppIcon className="h-4.5 w-4.5" /> Free Migration on WhatsApp
              </a>
            </div>
            <div className="pt-4 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground border-t border-border/50">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> Free migration
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> bKash & Nagad
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> 30-day money-back
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> Bangla support
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

function TrackingSpotlight() {
  const points = [
    {
      title: "The problem",
      body: "Ad-blockers and iPhone privacy rules stop your Facebook Pixel from seeing many orders. Meta optimizes on missing data, so your cost per purchase goes up.",
    },
    {
      title: "What we do",
      body: "Your hosting sends purchase, add-to-cart and checkout events to Meta CAPI and GTM from your own domain, server-side, with hashed customer data.",
    },
    {
      title: "What you get",
      body: "More of your real sales reported to Meta, Event Match Quality up to 9+, and no separate Stape.io or cloud server bill.",
    },
  ];

  return (
    <section id="tracking" className="py-20 md:py-28 bg-card border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Free with Webuzo hosting
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
            Facebook showing fewer orders than you really got?
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Server-side tracking fixes that, and with CarrotHost it is already included.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p, i) => (
            <div key={p.title} className="rounded-3xl border border-border bg-gradient-soft p-6 md:p-8 shadow-soft">
              <div className="h-9 w-9 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center font-extrabold">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/wordpress-plugin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            How tracking works <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={waLink("Hello CarrotHost, I want server-side tracking for my WooCommerce store.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-bold text-foreground hover:bg-secondary/40 transition"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Ask us to set it up
          </a>
        </div>
      </div>
    </section>
  );
}

function HowToSwitch() {
  const steps = [
    { title: "Message us", body: "Send your website address on WhatsApp. We suggest the right plan for free." },
    { title: "We move your site", body: "Our team migrates your files, database and email, usually within 24 hours." },
    { title: "You go live", body: "Point your domain, pay with bKash, Nagad or card, and you are done." },
  ];

  return (
    <section className="py-20 md:py-24 bg-card border-y border-border/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Switch to CarrotHost in 3 steps
          </h2>
          <p className="mt-3 text-muted-foreground">Free migration. You don't need to touch any server settings.</p>
        </div>
        <ol className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="text-5xl font-extrabold text-brand-orange/15 absolute top-4 right-5" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="font-bold text-foreground">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <a
            href={waLink("Hello CarrotHost, I want to move my website to your hosting. Please help with free migration.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-7 py-3.5 font-bold text-white hover:opacity-95 transition"
          >
            <WhatsAppIcon className="h-5 w-5" /> Start free migration
          </a>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    {
      icon: Globe,
      title: "Shared Webuzo Hosting",
      desc: "NVMe storage and caching tuned for WordPress and WooCommerce, with free server-side tracking for Meta CAPI and GTM. Best for most online shops and business sites.",
      to: "/hosting",
      price: "From ৳4,200/year (≈ ৳350/mo)",
    },
    {
      icon: Network,
      title: "BDIX Cloud VPS",
      desc: "Your own virtual server in Dhaka, connected directly to BDIX. Very fast for visitors in Bangladesh. Best for busy shops, news portals and local apps.",
      to: "/bdix-cloud-vps",
      price: "From ৳1,550/month",
    },
    {
      icon: Cpu,
      title: "Cloud VPS",
      desc: "Affordable global cloud servers on Intel Xeon and AMD EPYC with full root access. Best for developers, apps and international visitors.",
      to: "/cloud-vps",
      price: "From ৳750/month",
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
      desc: "Talk to local engineers in Bangla or English over phone or WhatsApp.",
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
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-6 py-3 font-bold text-white hover:opacity-95 transition"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={PHONE_TEL}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-6 py-3 font-bold text-foreground hover:bg-secondary/40 transition"
            >
              <Phone className="h-4 w-4 text-brand-green" /> {PHONE_DISPLAY}
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
  // Client names only. We do not publish a quote for these unless the client
  // has approved the wording in writing.
  const clients = [
    "Foring",
    "Newcastle Law Academy",
    "Dhaka Stream",
    "ACNABIN Chartered Accountants",
    "Amrai Kingbadanti Foundation",
    "Insight Dhaka",
  ];

  // Add an entry only once that person has approved their own wording.
  // Awaiting approved quotes from:
  //   Mahabubur Rahaman Masum - Foring
  //   Barrister M A Muntakim - Newcastle Law Academy
  //   Md. Reajul Islam FCA - ACNABIN Chartered Accountants
  // Public Google reviews of Carrothost, quoted verbatim (the reviewers published this wording
  // themselves). Where Google truncated a review, only the visible part is used.
  const quotes: { name: string; role: string; body: string }[] = [
    {
      name: "Posterwood",
      role: "Business · Google review, Apr 2021",
      body: "The best hosting support team I know. I usually work at night and the support is always just 2 minutes away. I highly recommended domain & hosting from them. Thanks a lot to the Carrot Host team.",
    },
    {
      name: "Azizul Shakil",
      role: "Customer · Google review, Sep 2021",
      body: "I am getting good service from them. Their customer support is much better than other hosting providers in Bangladesh. I recommend you to use Carrothost hosting services",
    },
    {
      name: "A A M Muzahid",
      role: "Website owner · Google review, Jan 2022",
      body: "আমি আমার সাইটটা ক্যারটহোস্টে হোস্ট করেছি। যখনই কোনো সাহায্যের দরকার হয়েছে তারা দ্রুত আমাকে হেল্প করেছেন। তাদের সার্ভিস ভালো। আমি তাদের সফলতা কামনা করছি।",
    },
    {
      name: "DTerms",
      role: "Business · Google review, Sep 2021",
      body: "We are using Carrothost, will continue in the future. Carrothost is our best choice for our ecommerce and business…",
    },
    {
      name: "Shariful Islam",
      role: "Customer · Google review, Sep 2021",
      body: "I am a user of Carrothost and so far I have received very good support from them. Their hosting packages are affordable for me.",
    },
    {
      name: "Md. Momtazur Rashid",
      role: "Local Guide · Google review, Apr 2020",
      body: "I have been using CarrotHost Server for quite some time and I can truly say they are offering outstanding service and customer support.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            What our customers say on Google
          </h2>
          <p className="mt-3 text-muted-foreground">Real, unedited reviews from shop owners and businesses we host.</p>
        </div>

        <div className={quotes.length > 0 ? "mb-16" : ""}>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Trusted by
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {clients.map((c) => (
              <li
                key={c}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground/75 shadow-soft transition duration-300 hover:text-foreground hover:shadow-elegant"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>

        {quotes.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
        )}
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
              Move your website to CarrotHost today
            </h2>
            <p className="opacity-95 text-base md:text-lg">
              Free migration, free server-side tracking, and Bangla support on WhatsApp. Plans
              from ৳350/month with a 30-day money-back guarantee.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/hosting"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft"
              >
                View Hosting Plans <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-bold text-white hover:opacity-95 transition"
              >
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp Us
              </a>
              <a
                href={PHONE_TEL}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white hover:bg-white/20 transition"
              >
                <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
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
      <TrackingSpotlight />
      <Services />
      <HowToSwitch />
      <Testimonials />
      <WhyUs />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
