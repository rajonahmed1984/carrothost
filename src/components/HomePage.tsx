import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cpu,
  Globe,
  HardDrive,
  Headphones,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const heroHighlights = [
  "NVMe SSD Storage",
  "Faster Loading Times",
  "Free SSL Certificates",
  "Secure Hosting Environment",
  "99.9% Uptime",
  "High-Performance Infrastructure",
];

const trustPoints = [
  "Premium NVMe SSD performance",
  "Faster website loading times",
  "Reliable website uptime",
  "Easy control panels",
  "Strong website security",
  "Flexible upgrade options",
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
    title: "NVMe SSD Storage",
    description:
      "Premium NVMe SSD storage delivers faster read and write performance for quicker loading times, stronger database responsiveness, and smoother user experiences.",
    icon: Zap,
  },
  {
    title: "Free SSL Certificates",
    description:
      "Secure every website with trusted SSL certificates that protect visitor data and improve trust.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Hosting Environment",
    description:
      "Modern isolation, malware monitoring, brute-force protection, and hardened server layers keep websites safer.",
    icon: LockKeyhole,
  },
  {
    title: "LiteSpeed on cPanel Hosting",
    description:
      "Serve pages faster with LiteSpeed powered cPanel hosting backed by NVMe SSD storage for stronger front-end and back-end performance.",
    icon: Rocket,
  },
  {
    title: "BDIX Connectivity",
    description:
      "Enjoy lower latency and smoother local delivery for Bangladesh-focused applications and audiences.",
    icon: Network,
  },
  {
    title: "Developer-Friendly VPS",
    description:
      "Deploy custom stacks, apps, APIs, and business services with full control and scalable server resources.",
    icon: Server,
  },
  {
    title: "Scalable Resources",
    description:
      "Upgrade hosting or move to VPS as your traffic grows while keeping a high-performance infrastructure built for demanding workloads.",
    icon: Layers3,
  },
  {
    title: "24/7 Support",
    description:
      "Get dependable assistance whenever you need help with hosting, uptime, NVMe SSD performance, or migrations.",
    icon: Headphones,
  },
];

const pricingCards = [
  {
    name: "Webuzo Starter",
    price: "৳299",
    cycle: "/month",
    description: "Simple hosting with fast NVMe SSD storage for lightweight sites and new launches.",
    specs: ["1 Website", "10 GB NVMe SSD", "Free SSL", "Webuzo Panel"],
    href: "/webuzo-hosting",
    featured: false,
  },
  {
    name: "cPanel Orange Carrot",
    price: "৳499",
    cycle: "/month",
    description: "Balanced NVMe SSD performance for business websites, stores, and agencies.",
    specs: ["LiteSpeed", "20 GB NVMe SSD", "Email Hosting", "Daily Protection"],
    href: "/cpanel-hosting",
    featured: true,
  },
  {
    name: "Xeon NVMe Nano4",
    price: "৳1,999",
    cycle: "/month",
    description: "Entry Xeon VPS power with premium NVMe SSD storage for apps, stores, and workloads.",
    specs: ["4 vCPU", "4 GB RAM", "80 GB NVMe", "Root Access"],
    href: "/xeon-vps",
    featured: false,
  },
  {
    name: "BDIX Standard",
    price: "৳1,499",
    cycle: "/month",
    description: "Local-speed VPS with NVMe storage built for Bangladesh traffic and services.",
    specs: ["BDIX Optimized", "4 GB RAM", "NVMe Storage", "Low Latency"],
    href: "/bdix-vps",
    featured: false,
  },
];

const testimonials = [
  {
    name: "Farhan Rahman",
    role: "Agency Founder, Dhaka",
    quote:
      "Carrothost gave our client websites noticeably faster loading times, quicker dashboard responsiveness, and a much more dependable support experience than our previous provider.",
  },
  {
    name: "Nusrat Jahan",
    role: "eCommerce Owner",
    quote:
      "We moved our online store to Carrothost for better uptime and security. The migration was smooth and the performance improvement was immediate.",
  },
  {
    name: "Sabbir Hossain",
    role: "SaaS Developer",
    quote:
      "The Xeon VPS and BDIX-focused options make Carrothost a practical choice for deploying apps that need both flexibility and strong local performance.",
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
      "NVMe storage communicates more efficiently with the server and can handle more data operations at once. That means better speed for websites, applications, and high-traffic workloads.",
  },
  {
    question: "Which hosting is best for beginners?",
    answer:
      "Webuzo Hosting is a strong choice for beginners because it is easy to manage, lightweight, and suitable for simple websites, landing pages, and new online projects.",
  },
  {
    question: "What is the difference between cPanel Hosting and Webuzo Hosting?",
    answer:
      "cPanel Hosting is ideal for users who want a feature-rich professional hosting environment with email tools, LiteSpeed performance, NVMe SSD speed, and familiar controls. Webuzo Hosting is lighter and easier for users who want a simpler hosting panel.",
  },
  {
    question: "What is BDIX VPS?",
    answer:
      "BDIX VPS is a VPS hosting solution connected for strong local traffic performance in Bangladesh. It helps reduce latency for local users and is useful for local applications, services, and websites.",
  },
  {
    question: "Do you provide SSL certificates?",
    answer:
      "Yes. Carrothost provides free SSL certificates with hosting plans to help secure websites, protect visitor data, and improve trust.",
  },
  {
    question: "Can I upgrade my hosting plan later?",
    answer:
      "Yes. You can upgrade from a starter hosting plan to a larger hosting package or VPS solution as your website traffic and resource needs grow.",
  },
  {
    question: "Which hosting plan is best for business websites in Bangladesh?",
    answer:
      "For most business websites, cPanel Hosting is the best starting point because it offers strong performance, security, easy management, and room to scale. For higher workloads, Xeon VPS or BDIX VPS can be a better fit.",
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

const particles = [
  { top: "12%", left: "8%", duration: 6.5, delay: 0.2 },
  { top: "20%", left: "72%", duration: 7.3, delay: 0.8 },
  { top: "58%", left: "16%", duration: 8.1, delay: 1.4 },
  { top: "70%", left: "78%", duration: 6.9, delay: 0.5 },
  { top: "42%", left: "52%", duration: 7.7, delay: 1.1 },
  { top: "78%", left: "44%", duration: 8.4, delay: 0.3 },
];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55 },
};

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HomePage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(25_95%_53%_/_0.12),transparent_30%),radial-gradient(circle_at_80%_20%,hsl(215_90%_52%_/_0.16),transparent_30%),linear-gradient(180deg,hsl(210_33%_99%)_0%,hsl(210_40%_96%)_54%,hsl(0_0%_100%)_100%)]">
        <div className="absolute inset-0 bg-grid opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(215_90%_52%_/_0.06),transparent_48%)]" />
        <motion.div
          className="glow-orb absolute -left-24 top-12 h-[22rem] w-[22rem] bg-primary/20"
          animate={{ x: [0, 30, -10, 0], y: [0, -20, 15, 0], opacity: [0.35, 0.5, 0.32, 0.35] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="glow-orb absolute right-[-4rem] top-[-3rem] h-[28rem] w-[28rem] bg-accent/20"
          animate={{ x: [0, -24, 10, 0], y: [0, 18, -12, 0], opacity: [0.28, 0.45, 0.3, 0.28] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.svg
          viewBox="0 0 1000 500"
          className="absolute inset-x-0 top-10 hidden h-[28rem] w-full opacity-40 lg:block"
          aria-hidden="true"
        >
          <motion.path
            d="M70 140 C 220 60, 320 240, 470 170 S 760 80, 930 190"
            fill="none"
            stroke="url(#networkGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0.2, opacity: 0.35 }}
            animate={{ pathLength: [0.2, 1, 0.85], opacity: [0.35, 0.75, 0.45] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M100 330 C 250 250, 360 410, 520 320 S 760 240, 900 340"
            fill="none"
            stroke="url(#networkGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0.1, opacity: 0.2 }}
            animate={{ pathLength: [0.1, 0.9, 0.7], opacity: [0.2, 0.6, 0.3] }}
            transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <defs>
            <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(25 95% 53%)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(215 90% 52%)" stopOpacity="0.75" />
            </linearGradient>
          </defs>
        </motion.svg>

        {particles.map((particle, index) => (
          <motion.span
            key={`${particle.top}-${particle.left}`}
            className="absolute h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.6)]"
            style={{ top: particle.top, left: particle.left }}
            animate={{ y: [0, -16, 6, 0], opacity: [0.35, 0.85, 0.4, 0.35], scale: [1, 1.15, 0.9, 1] }}
            transition={{ duration: particle.duration, repeat: Infinity, ease: "easeInOut", delay: particle.delay + index * 0.03 }}
          />
        ))}

        <div className="container relative z-10 py-16 md:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Premium hosting infrastructure for Bangladesh
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-[4.2rem]">
                Fast, Secure &amp; Reliable NVMe SSD Web Hosting in Bangladesh
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
                Launch your website with confidence using high-performance hosting from Carrothost. Our premium NVMe SSD hosting infrastructure is built for faster loading times, stronger responsiveness, and dependable uptime across cPanel Hosting, Webuzo Hosting, Xeon VPS, and BDIX VPS in Bangladesh.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/cpanel-hosting"
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection("plans")}
                  className="btn-outline inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold"
                >
                  View Hosting Plans
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur"
                  >
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.15 }}
              className="relative"
            >
              <div className="card-premium relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(25_95%_53%),hsl(215_90%_52%))]" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
                      Infrastructure Snapshot
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-foreground">
                      Premium hosting infrastructure built for speed
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-foreground p-3 text-white shadow-lg">
                    <Server className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Uptime Target", value: "99.9%", tone: "bg-primary/10 text-primary" },
                    { label: "Storage Layer", value: "NVMe SSD", tone: "bg-accent/10 text-accent" },
                    { label: "Hosting Security", value: "Free SSL + Shielding", tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Local Network", value: "BDIX Optimized", tone: "bg-slate-900/10 text-slate-700" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stat.tone}`}>
                        {stat.label}
                      </div>
                      <div className="mt-3 text-xl font-bold text-foreground">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.75rem] bg-slate-950 px-5 py-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-white/60">Popular Stack</p>
                      <h3 className="mt-1 text-xl font-semibold">cPanel + LiteSpeed + NVMe SSD</h3>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Website Speed", value: "Faster NVMe SSD Delivery", width: "w-[92%]" },
                      { label: "Security Readiness", value: "Secure Hosting Environment", width: "w-[81%]" },
                      { label: "Backend Responsiveness", value: "Premium Storage Throughput", width: "w-[86%]" },
                      { label: "Bangladesh Reach", value: "Local-Friendly Delivery", width: "w-[76%]" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between text-sm text-white/80">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className={`h-2 ${item.width} rounded-full bg-[linear-gradient(90deg,hsl(25_95%_53%),hsl(215_90%_52%))]`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                className="card-premium absolute -bottom-8 -left-4 hidden rounded-3xl bg-white/85 px-5 py-4 shadow-xl backdrop-blur md:block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Always-on Support</div>
                    <div className="text-xs text-muted-foreground">Real help for hosting and VPS customers</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-white">
        <div className="container">
          <motion.div {...fadeUp} className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-start">
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Trusted Hosting Solutions for Every Website
              </span>
              <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                Trusted Hosting Solutions for Every Website
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Carrothost delivers modern hosting solutions designed for speed, uptime, security, and scalability. With premium NVMe SSD hosting, your website benefits from faster loading times, quicker file access, and a smoother experience for visitors, businesses, agencies, eCommerce stores, and custom applications.
              </p>
            </div>

            <div className="card-premium rounded-[1.75rem] p-6 md:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {trustPoints.map((point) => (
                  <div key={point} className="rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <span className="text-sm font-medium leading-6 text-foreground">{point}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-spacing bg-[linear-gradient(180deg,hsl(215_40%_97%)_0%,hsl(0_0%_100%)_100%)]" id="services">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              Hosting Products
            </span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Explore Our Hosting &amp; Server Solutions
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              From beginner-friendly hosting panels to performance-oriented VPS infrastructure, Carrothost offers reliable hosting solutions powered by premium NVMe SSD storage for websites and businesses in Bangladesh.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="card-premium group flex h-full flex-col rounded-[1.6rem] p-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(25_95%_53%_/_0.15),hsl(215_90%_52%_/_0.14))] text-primary">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{service.description}</p>
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
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-accent">
              Why Carrothost
            </span>
            <h2 className="mt-5 text-3xl font-bold md:text-4xl lg:text-5xl">
              Why Choose Carrothost for Hosting in Bangladesh?
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              We focus on NVMe SSD speed, fast hosting performance, secure hosting, dependable uptime, and a polished customer experience for website owners, agencies, and developers.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.28)] backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-white">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Customer Feedback
            </span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Trusted by Businesses, Developers &amp; Website Owners
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Credible hosting is built on consistency. These are the kinds of results customers expect from a provider focused on performance and support.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="card-premium rounded-[1.7rem] p-6"
              >
                <div className="flex items-center gap-2 text-accent">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Sparkles key={starIndex} className="h-4 w-4" />
                  ))}
                </div>
                <p className="mt-5 text-base leading-8 text-foreground/88">
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

      <section className="section-spacing bg-[linear-gradient(180deg,hsl(215_30%_97%)_0%,hsl(0_0%_100%)_100%)]">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp} className="text-center">
            <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              SEO-Friendly FAQ
            </span>
            <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Frequently Asked Questions About Hosting in Bangladesh
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Clear answers for customers comparing web hosting in Bangladesh, NVMe SSD hosting, cPanel hosting, Webuzo hosting, and VPS options.
            </p>
          </motion.div>

          <div className="mt-14 space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                className="card-premium overflow-hidden rounded-[1.45rem]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6 md:py-6"
                >
                  <span className="text-base font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 md:px-6 md:pb-6">
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
            className="relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-12 md:px-10 md:py-16"
            style={{
              background:
                "radial-gradient(circle at top left, hsl(25 95% 53% / 0.22), transparent 24%), radial-gradient(circle at 80% 20%, hsl(215 90% 52% / 0.24), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
            }}
          >
            <div className="glow-orb absolute -right-16 top-0 h-52 w-52 bg-primary/20" />
            <div className="glow-orb absolute -left-12 bottom-0 h-44 w-44 bg-accent/20" />
            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-accent">
                Ready to Launch?
              </span>
              <h2 className="mt-5 text-3xl font-bold md:text-4xl lg:text-5xl">
                Ready to Launch Your Website with Carrothost?
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Choose reliable NVMe SSD hosting, faster loading times, secure website infrastructure, and performance-focused server solutions designed for Bangladesh.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/cpanel-hosting"
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold"
                >
                  Get Started Today
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/bdix-vps"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
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
