import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Globe,
  HardDrive,
  Headphones,
  Layers3,
  LockKeyhole,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const heroHighlights = [
  "NVMe SSD Storage",
  "LiteSpeed Performance",
  "99.9% Uptime",
  "24/7 Support",
];

const trustStrip = [
  {
    title: "NVMe SSD Storage",
    description: "Premium storage for faster loading times and smoother performance.",
  },
  {
    title: "Free SSL Security",
    description: "Trusted SSL certificates included to secure websites and visitors.",
  },
  {
    title: "LiteSpeed Ready",
    description: "Optimized delivery for business websites, stores, and modern apps.",
  },
  {
    title: "BDIX Friendly",
    description: "Better local performance for Bangladesh-focused traffic and users.",
  },
  {
    title: "24/7 Support",
    description: "Dependable support for hosting, VPS, migrations, and uptime issues.",
  },
];

const serviceCards = [
  {
    title: "Webuzo Hosting",
    description:
      "Easy-to-manage hosting with NVMe SSD speed for lightweight websites, landing pages, and growing online projects.",
    icon: Globe,
    href: "/webuzo-hosting",
    cta: "Explore Webuzo",
  },
  {
    title: "cPanel Hosting",
    description:
      "Professional hosting with LiteSpeed, NVMe SSD performance, email hosting, malware scanning, and easy management tools.",
    icon: HardDrive,
    href: "/cpanel-hosting",
    cta: "View cPanel Plans",
  },
  {
    title: "Xeon VPS",
    description:
      "Powerful VPS servers with Xeon processors and NVMe SSD storage for websites, applications, and business workloads.",
    icon: Cpu,
    href: "/xeon-vps",
    cta: "See Xeon VPS",
  },
  {
    title: "BDIX VPS",
    description:
      "Low-latency BDIX connected VPS for fast local performance in Bangladesh.",
    icon: Network,
    href: "/bdix-vps",
    cta: "Discover BDIX VPS",
  },
];

const whyChooseUs = [
  {
    title: "Premium NVMe SSD Storage",
    description:
      "Faster storage performance improves page loading times, dashboard responsiveness, and database activity.",
    icon: Zap,
  },
  {
    title: "Free SSL Certificates",
    description:
      "Secure your website with trusted SSL certificates that improve protection and visitor confidence.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Hosting Environment",
    description:
      "Modern security layers, monitoring, and account protection help keep websites safer.",
    icon: LockKeyhole,
  },
  {
    title: "LiteSpeed on cPanel",
    description:
      "Serve pages faster with LiteSpeed and NVMe SSD hosting for a strong front-end and back-end stack.",
    icon: Rocket,
  },
  {
    title: "BDIX Connectivity",
    description:
      "Deliver lower latency and stronger local performance for Bangladesh-focused traffic and services.",
    icon: Network,
  },
  {
    title: "Scalable VPS Options",
    description:
      "Start with hosting and move to VPS when your applications, traffic, and workloads demand more power.",
    icon: Layers3,
  },
];

const pricingCards = [
  {
    name: "Webuzo Starter",
    price: "BDT 299",
    cycle: "/month",
    description: "Simple hosting with NVMe SSD speed for lightweight sites and new launches.",
    specs: ["1 Website", "10 GB NVMe SSD", "Free SSL", "Webuzo Panel"],
    href: "/webuzo-hosting",
    featured: false,
  },
  {
    name: "cPanel Orange Carrot",
    price: "BDT 499",
    cycle: "/month",
    description: "Balanced NVMe SSD performance for business websites, stores, and agencies.",
    specs: ["LiteSpeed", "20 GB NVMe SSD", "Email Hosting", "Daily Protection"],
    href: "/cpanel-hosting",
    featured: true,
  },
  {
    name: "Xeon NVMe Nano4",
    price: "BDT 1,999",
    cycle: "/month",
    description: "Entry Xeon VPS power with premium NVMe SSD storage for apps and workloads.",
    specs: ["4 vCPU", "4 GB RAM", "80 GB NVMe", "Root Access"],
    href: "/xeon-vps",
    featured: false,
  },
  {
    name: "BDIX Standard",
    price: "BDT 1,499",
    cycle: "/month",
    description: "Local-speed VPS with NVMe storage for Bangladesh traffic and services.",
    specs: ["BDIX Optimized", "4 GB RAM", "NVMe Storage", "Low Latency"],
    href: "/bdix-vps",
    featured: false,
  },
];

const bangladeshBenefits = [
  "BDIX VPS for local traffic and Bangladesh-focused services",
  "Lower latency benefits for local visitors and businesses",
  "Hosting options for startups, agencies, stores, and business websites",
  "Reliable support for long-term growth and infrastructure upgrades",
];

const testimonials = [
  {
    name: "Farhan Rahman",
    role: "Agency Founder, Dhaka",
    quote:
      "Carrothost gave our client websites faster loading times and a much more dependable support experience than our previous provider.",
  },
  {
    name: "Nusrat Jahan",
    role: "eCommerce Owner",
    quote:
      "We moved our online store to Carrothost for better uptime, stronger security, and noticeably better performance.",
  },
  {
    name: "Sabbir Hossain",
    role: "SaaS Developer",
    quote:
      "The Xeon VPS and BDIX options make Carrothost practical for apps that need both flexibility and strong local speed.",
  },
];

const faqs = [
  {
    question: "What is NVMe SSD hosting?",
    answer:
      "NVMe SSD hosting uses high-speed NVMe storage instead of older disk technology. It improves website loading speed, database responsiveness, and overall hosting performance.",
  },
  {
    question: "Why is NVMe SSD hosting faster than regular SSD hosting?",
    answer:
      "NVMe storage communicates more efficiently with the server and can handle more data operations at once. That means better speed for websites, applications, and higher-traffic workloads.",
  },
  {
    question: "Which hosting is best for beginners?",
    answer:
      "Webuzo Hosting is a strong choice for beginners because it is easier to manage and well suited to simple websites, landing pages, and new online projects.",
  },
  {
    question: "What is the difference between cPanel Hosting and Webuzo Hosting?",
    answer:
      "cPanel Hosting is ideal for users who want a more feature-rich environment with LiteSpeed, email tools, and familiar controls. Webuzo Hosting is lighter and simpler for users who prefer an easier panel.",
  },
  {
    question: "What is BDIX VPS?",
    answer:
      "BDIX VPS is a VPS hosting solution optimized for local traffic performance in Bangladesh. It helps reduce latency for local users and is useful for websites, services, and applications targeting Bangladesh.",
  },
  {
    question: "Do you provide SSL certificates?",
    answer:
      "Yes. Carrothost provides free SSL certificates with hosting plans to help secure websites, protect visitor data, and improve trust.",
  },
  {
    question: "Can I upgrade my hosting plan later?",
    answer:
      "Yes. You can upgrade from a starter hosting plan to a larger hosting package or VPS solution as your traffic and resource needs grow.",
  },
  {
    question: "Which hosting plan is best for business websites in Bangladesh?",
    answer:
      "For most business websites, cPanel Hosting is the best starting point because it offers strong performance, security, easy management, and room to scale. For larger workloads, Xeon VPS or BDIX VPS can be a better fit.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Carrothost",
  url: "https://carrothost.com",
  logo: "https://carrothost.com/logo.png",
  description:
    "Carrothost is a web hosting and VPS provider in Bangladesh offering Webuzo Hosting, cPanel Hosting, Xeon VPS, and BDIX VPS.",
  areaServed: "Bangladesh",
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.55 },
};

const cardReveal = (index: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.16 } as const,
  transition: { duration: 0.45, delay: index * 0.06 },
});

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HomePage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#08101f_0%,#0b1426_52%,#eef4fb_100%)] pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-20 h-72 w-72 rounded-full bg-orange-500/12 blur-[90px]" />
          <div className="absolute right-[8%] top-24 h-72 w-72 rounded-full bg-blue-500/14 blur-[100px]" />
          <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_62%)]" />
        </div>

        <div className="container relative z-10 pb-24 md:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="section-pill-badge mx-auto mb-6 border-white/10 bg-white/6 text-orange-300"
            >
              <Sparkles className="section-pill-icon" />
              Premium hosting infrastructure for Bangladesh
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Fast, Secure and Reliable
              <span className="block bg-[linear-gradient(135deg,#f59e0b_0%,#fb923c_35%,#60a5fa_100%)] bg-clip-text text-transparent">
                NVMe SSD Hosting
              </span>
              in Bangladesh
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg"
            >
              Launch your website with confidence using high-performance hosting from Carrothost.
              We provide NVMe SSD powered cPanel Hosting, Webuzo Hosting, Xeon VPS, and BDIX VPS
              for businesses, developers, agencies, and growing brands in Bangladesh.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                to="/cpanel-hosting"
                className="btn-primary inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold md:text-base"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("plans")}
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 md:text-base"
              >
                View Hosting Plans
                <ChevronDown className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3"
            >
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200 backdrop-blur"
                >
                  <CheckCircle2 className="h-4 w-4 text-orange-300" />
                  {item}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.4 }}
              className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {[
                { label: "Storage", value: "NVMe SSD" },
                { label: "Performance", value: "LiteSpeed Ready" },
                { label: "Local Speed", value: "BDIX Optimized" },
                { label: "Support", value: "24/7 Assistance" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-5 text-left backdrop-blur"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-white">
        <div className="container py-6 md:py-7">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {trustStrip.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="rounded-2xl border border-border/70 bg-white px-4 py-4"
              >
                <div className="text-sm font-semibold text-foreground">{item.title}</div>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-white">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <motion.div {...fadeUp}>
              <span className="section-pill-badge">Performance Focused</span>
              <h2 className="mt-5 max-w-3xl text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                Built for speed, stability, and long-term growth
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Carrothost delivers modern hosting solutions designed for speed, uptime, security,
                and scalability. Our NVMe SSD infrastructure helps reduce loading times, improve
                responsiveness, and support websites that need dependable performance in Bangladesh.
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="card-premium rounded-[1.75rem] p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Performance Overview
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Premium NVMe SSD infrastructure
                  </h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Server className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Faster Loading",
                    text: "NVMe SSD storage helps websites load faster and respond better under daily traffic.",
                  },
                  {
                    title: "Control Panel Speed",
                    text: "Faster file access improves dashboard responsiveness and routine hosting tasks.",
                  },
                  {
                    title: "Better Under Load",
                    text: "Stable performance helps business sites, stores, and apps handle traffic more smoothly.",
                  },
                  {
                    title: "Upgrade Path",
                    text: "Move from shared hosting to VPS without rebuilding your whole hosting setup.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/70 bg-white p-4">
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-[linear-gradient(180deg,hsl(215_36%_97%)_0%,hsl(0_0%_100%)_100%)]" id="services">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="section-pill-badge">Hosting Products</span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Explore our hosting and server solutions
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              From beginner-friendly control panels to high-performance VPS infrastructure,
              Carrothost offers reliable hosting powered by premium NVMe SSD storage.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((service, index) => (
              <motion.div
                key={service.title}
                {...cardReveal(index)}
                className="card-premium group flex h-full flex-col rounded-[1.5rem] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                  {service.description}
                </p>
                <Link
                  to={service.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1"
                >
                  {service.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-slate-950 text-white">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="section-pill-badge border-white/10 bg-white/5 text-orange-300">
              Why Carrothost
            </span>
            <h2 className="mt-5 text-3xl font-bold md:text-4xl lg:text-5xl">
              Why choose Carrothost for hosting in Bangladesh?
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              We focus on faster hosting, secure infrastructure, dependable uptime, and a clear
              customer experience for website owners, businesses, agencies, and developers.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={item.title}
                {...cardReveal(index)}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-orange-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-white" id="plans">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="section-pill-badge">Pricing Preview</span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Popular hosting plans
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Simple pricing with clear plan structure, premium NVMe SSD storage, and room to grow.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pricingCards.map((plan, index) => (
              <motion.div
                key={plan.name}
                {...cardReveal(index)}
                className={`relative flex flex-col rounded-[1.6rem] p-6 ${
                  plan.featured ? "card-featured" : "card-premium"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{plan.cycle}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.specs.map((spec) => (
                    <li key={spec} className="flex items-start gap-3 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                    plan.featured ? "btn-primary" : "btn-outline"
                  }`}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-[linear-gradient(180deg,hsl(220_34%_11%)_0%,hsl(220_32%_9%)_100%)] text-white">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <motion.div {...fadeUp}>
              <span className="section-pill-badge border-white/10 bg-white/5 text-orange-300">
                Bangladesh Optimized
              </span>
              <h2 className="mt-5 text-3xl font-bold md:text-4xl lg:text-5xl">
                Web hosting designed for Bangladesh
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Carrothost provides hosting services tailored for the Bangladesh market with
                performance-focused infrastructure, local-friendly connectivity, and scalable
                hosting options for startups, agencies, online stores, and business websites.
              </p>
              <p className="mt-5 text-base leading-8 text-slate-300">
                Our BDIX VPS options help improve local traffic performance and reduce latency for
                Bangladesh users, while our wider hosting range supports websites that need strong
                uptime, practical control panels, and reliable support.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/bdix-vps"
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
                >
                  Explore BDIX VPS
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/cpanel-hosting"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  View Hosting Plans
                </Link>
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="grid gap-4 sm:grid-cols-2">
              {bangladeshBenefits.map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-slate-50">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="section-pill-badge">Testimonials</span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Trusted by businesses and developers
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Performance and consistency are what customers remember most from a hosting provider.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                {...cardReveal(index)}
                className="card-premium rounded-[1.5rem] p-6"
              >
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-base leading-8 text-foreground/85">
                  "{testimonial.quote}"
                </p>
                <div className="mt-6 border-t border-border/70 pt-5">
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-white">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp} className="text-center">
            <span className="section-pill-badge">FAQ</span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Frequently asked questions about hosting in Bangladesh
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Clear answers for customers comparing NVMe SSD hosting, cPanel hosting, Webuzo
              hosting, VPS hosting, and BDIX VPS.
            </p>
          </motion.div>

          <div className="mt-14 space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                className="card-premium overflow-hidden rounded-[1.35rem]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                >
                  <span className="text-base font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                      openFaq === index ? "rotate-180 text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 md:px-6">
                    <p className="text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-slate-950 text-white">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-12 text-center md:px-10 md:py-16"
            style={{
              background:
                "radial-gradient(circle at top left, hsl(25 95% 53% / 0.18), transparent 24%), radial-gradient(circle at 80% 20%, hsl(215 90% 52% / 0.22), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
            }}
          >
            <div className="mx-auto max-w-3xl">
              <span className="section-pill-badge border-white/10 bg-white/5 text-orange-300">
                Ready to Launch
              </span>
              <h2 className="mt-5 text-3xl font-bold md:text-4xl lg:text-5xl">
                Launch your website on clear, performance-focused hosting
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Choose reliable NVMe SSD hosting, secure website infrastructure, and modern server
                solutions designed for businesses and websites in Bangladesh.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/cpanel-hosting"
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold md:text-base"
                >
                  Get Started Today
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/bdix-vps"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 md:text-base"
                >
                  Contact Support
                  <Headphones className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
