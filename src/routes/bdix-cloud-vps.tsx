import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ArrowRight,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Zap,
  Clock,
  HelpCircle,
  Server,
  Star,
  Activity,
  Lock,
  Phone,
  Settings,
  RefreshCw,
  Sliders,
  Terminal,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { BdixNetworkMap, SpeedometerIcon } from "@/components/BdixNetworkMap";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  breadcrumbSchema,
  createSeoMeta,
  faqSchema,
  jsonLdScript,
  webHostingServiceSchema,
} from "@/lib/seo";

const BDIX_FAQS = [
  {
    q: "What is BDIX and why does it matter?",
    a: "BDIX (Bangladesh Internet Exchange) is a local internet exchange point where Bangladeshi ISPs peer directly. Traffic between BDIX-connected servers and local users never leaves the country, resulting in much lower latency and cost.",
  },
  {
    q: "Can I upgrade my VPS resources later?",
    a: "Yes. You can upgrade CPU, RAM, and storage anytime with just a reboot — no data migration needed. Downgrades are also available on request.",
  },
  {
    q: "Which operating systems are available?",
    a: "We offer Ubuntu, Debian, AlmaLinux, and CentOS out of the box. You can also upload your own ISO for custom operating systems.",
  },
  {
    q: "Do you offer managed VPS services?",
    a: "Our VPS plans are self-managed by default. We also offer a managed add-on where our team handles security patches, monitoring, and routine maintenance for you.",
  },
];

export const Route = createFileRoute("/bdix-cloud-vps")({
  head: () => {
    const seo = createSeoMeta({
      title: "BDIX VPS Hosting — CarrotHost",
      description:
        "Ultra-fast BDIX VPS hosting in Bangladesh. Low latency Intel Xeon servers with full root access, control panel, DDoS protection, and 24/7 support.",
      path: "/bdix-cloud-vps",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-bdix-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "BDIX VPS", path: "/bdix-cloud-vps" },
          ]),
        ),
        jsonLdScript(
          "ld-bdix-service",
          webHostingServiceSchema({
            name: "BDIX VPS Hosting",
            description:
              "Bangladesh BDIX VPS with sub-10ms latency, full root access, KVM virtualization, DDoS protection, and local support.",
            path: "/bdix-cloud-vps",
            serviceType: "BDIX Cloud VPS Hosting",
            priceFrom: "1550",
          }),
        ),
        jsonLdScript(
          "ld-bdix-faq",
          faqSchema(BDIX_FAQS.map((item) => ({ question: item.q, answer: item.a }))),
        ),
      ],
    };
  },
  component: VpsPage,
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
              <MapPinIcon className="h-4.5 w-4.5" />
              Dhaka Data Center · BDIX Connected
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Ultra-Fast <span className="text-gradient-brand">Local Hosting</span> for Bangladesh
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              BDIX VPS servers located right here in Dhaka deliver sub-10ms latency to Bangladeshi
              visitors. Perfect for local e-commerce, news portals, and business apps that demand
              speed.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
              >
                View VPS Plans <ArrowRight className="h-4.5 w-4.5" />
              </a>
              <Link
                to="/xeon-cloud-vps"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-4 font-bold text-foreground hover:border-brand-orange hover:bg-secondary/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                Compare Xeon VPS
              </Link>
            </div>
            <div className="pt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-t border-border/50">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> Full Root Access
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> 99.9% Uptime SLA
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> bKash Accepted
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-orange/5 blur-3xl" />
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg border border-border bg-background text-brand-orange flex items-center justify-center">
                <SpeedometerIcon size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">BDIX Network Map</p>
                <p className="text-xs text-muted-foreground">Ultra-low latency across Bangladesh</p>
              </div>
            </div>
            <BdixNetworkMap />
          </div>
        </div>
      </div>
    </section>
  );
}

function BDIXAdvantage() {
  const points = [
    {
      icon: Zap,
      title: "Lightning-Fast Local Speeds",
      desc: "BDIX-connected servers in Dhaka mean your Bangladeshi visitors experience page loads in milliseconds, not seconds. No international routing hops.",
    },
    {
      icon: Shield,
      title: "BDIX Peering Advantage",
      desc: "Direct peering with all major Bangladeshi ISPs ensures consistent, uncongested paths for your traffic — even during peak hours.",
    },
    {
      icon: Server,
      title: "Full Root & Custom Stacks",
      desc: "Deploy any OS, any stack. Ubuntu, Debian, AlmaLinux, or bring your own ISO. Full SSH root access with no restrictions.",
    },
    {
      icon: Clock,
      title: "Instant Provisioning",
      desc: "Your VPS is ready in under 60 seconds. Automated deployment with instant IP assignment and DNS setup.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            The BDIX Advantage
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Why BDIX hosting matters for Bangladesh
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The Bangladesh Internet Exchange (BDIX) connects local ISPs directly, bypassing
            international bandwidth. That means faster, cheaper, and more reliable hosting for local
            audiences.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-orange hover:shadow-elegant transition"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-brand-green group-hover:bg-gradient-brand group-hover:text-primary-foreground transition">
                <p.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VpsFacilities() {
  const [activeTab, setActiveTab] = useState(0);

  const facilities = [
    {
      icon: Terminal,
      title: "Full Root Access",
      subtitle: "Complete Server Autonomy",
      desc: "Unlock absolute control over your server environment. Run custom software, modify core kernel settings, manage packages, and optimize configuration files exactly how your application needs.",
      details: [
        "Full SSH access credentials",
        "No restrictions on background processes",
        "Install any database or language runtime",
        "Enable custom networking modules",
      ],
    },
    {
      icon: Cpu,
      title: "Intel Xeon Hardware",
      subtitle: "Dedicated Enterprise Power",
      desc: "Experience zero lag with 100% dedicated hardware resources. We use high-performance Intel Xeon E5 processors (2.40 GHz) coupled with server-grade ECC memory to ensure consistent, stable workloads.",
      details: [
        "Pure Intel Xeon computing cores",
        "Enterprise-grade RAM allocations",
        "No CPU stealing or overselling",
        "Optimized virtual cores for high I/O",
      ],
    },
    {
      icon: Sliders,
      title: "VPS Management Panel",
      subtitle: "Remote Server Control",
      desc: "Manage your VPS entirely from a visual control dashboard. Reboot, shut down, check bandwidth usage, or reinstall the operating system in just a few clicks.",
      details: [
        "1-click remote reboot & boot",
        "Real-time CPU & RAM monitoring graphs",
        "Instant OS rebuild tool",
        "VNC console access in browser",
      ],
    },
    {
      icon: Settings,
      title: "Flexible OS Options",
      subtitle: " CentOS, Ubuntu & Debian",
      desc: "Choose the operating system environment that fits your workflow. We offer standard installations for the most popular Linux distributions, or you can mount custom ISOs.",
      details: [
        "Ubuntu 20.04 & 22.04 LTS templates",
        "AlmaLinux & Rocky Linux support",
        "CentOS Stream & Debian templates",
        "Custom ISO installation interface",
      ],
    },
    {
      icon: Shield,
      title: "Advanced Uptime & Security",
      subtitle: "DDoS Guard & Off-site Backups",
      desc: "Protect your database and applications from malicious attacks. Our VPS plans feature network-level DDoS traffic scrubbing, along with cPGuard integration and customizable auto backups.",
      details: [
        "Always-on DDoS mitigation layer",
        "Isolated network environment",
        "Off-site backup automation options",
        "Malware protection & security patches",
      ],
    },
    {
      icon: Activity,
      title: "Seamless Resource Scaling",
      subtitle: "No-Downtime Upgrades",
      desc: "As your project grows, your server resources should scale with it. Upgrade your CPU cores, RAM, and NVMe SSD storage instantly through our portal, without complex data migrations.",
      details: [
        "Instant resource upgrade requests",
        "Zero data migration or transfer required",
        "Keep your IP addresses and DNS configuration",
        "Pay only for the resources you scale to",
      ],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            VPS Facilities & Features
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
            Enterprise-grade virtual servers
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Manage your websites, applications, and database nodes with dedicated virtual machine
            control, backed by premium hardware and local sub-10ms network routing.
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
          <div className="lg:col-span-8 bg-card rounded-3xl border border-border p-6 md:p-10 flex flex-col justify-between shadow-soft hover:shadow-elegant transition duration-300">
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
                {facilities[activeTab].details.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 text-sm font-semibold text-foreground/80"
                  >
                    <div className="h-5 w-5 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-brand-green" />
                    </div>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border/50 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
              <span>Standard features on all BDIX VPS packages</span>
              <a
                href="https://portal.carrothost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-brand-orange hover:underline"
              >
                Launch VPS Manager <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "BDIX Standard",
      price: "৳1,550.00",
      period: "/mo",
      tag: "Best for start",
      cpu: "2 Cores CPU",
      ram: "2 GB RAM",
      storage: "25 GB Storage",
      bandwidth: "1000 GB/m Bandwidth",
      link: "https://portal.carrothost.com/store/bdix-vps/bdix-standard",
      features: [
        "1 Gbps BDIX Speed",
        "100 Mbps Internet Speed",
        "Full Root Access",
        "DDoS Protection",
        "KVM Virtualization",
        "24/7 Live Support",
      ],
    },
    {
      name: "BDIX Enhanced",
      price: "৳2,700.00",
      period: "/mo",
      tag: "Most popular",
      highlight: true,
      cpu: "4 Cores CPU",
      ram: "4 GB RAM",
      storage: "50 GB Storage",
      bandwidth: "1500 GB/m Bandwidth",
      link: "https://portal.carrothost.com/store/bdix-vps/bdix-enhanced",
      features: [
        "1 Gbps BDIX Speed",
        "100 Mbps Internet Speed",
        "Full Root Access",
        "DDoS Protection",
        "KVM Virtualization",
        "Priority Support",
      ],
    },
    {
      name: "BDIX Premium",
      price: "৳4,900.00",
      period: "/mo",
      tag: "For power users",
      cpu: "6 Cores CPU",
      ram: "8 GB RAM",
      storage: "100 GB Storage",
      bandwidth: "2000 GB/m Bandwidth",
      link: "https://portal.carrothost.com/store/bdix-vps/bdix-premium",
      features: [
        "1 Gbps BDIX Speed",
        "100 Mbps Internet Speed",
        "Full Root Access",
        "DDoS Protection",
        "KVM Virtualization",
        "Dedicated Resources",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            BDIX VPS plans that scale with you
          </h2>
          <p className="mt-3 text-muted-foreground">
            All plans include full root access, BDIX connectivity, and our 99.9% uptime SLA. Upgrade
            anytime with zero downtime.
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

              <div className="mt-6 space-y-3.5 text-sm border-y border-border/60 py-5 my-5">
                <div className="flex items-center gap-3">
                  <Cpu className="h-4.5 w-4.5 text-brand-orange shrink-0" />
                  <span className="text-foreground/90 font-medium">{p.cpu}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-4.5 w-4.5 text-brand-orange shrink-0" />
                  <span className="text-foreground/90 font-medium">{p.ram}</span>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4.5 w-4.5 text-brand-orange shrink-0" />
                  <span className="text-foreground/90 font-medium">{p.storage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Wifi className="h-4.5 w-4.5 text-brand-orange shrink-0" />
                  <span className="text-foreground/90 font-medium">{p.bandwidth}</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm flex-1">
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
                className={`mt-8 inline-flex justify-center items-center gap-2 rounded-xl px-4 py-3.5 font-bold transition ${
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

function DataCenter() {
  const features = [
    {
      icon: MapPinIcon,
      title: "Dhaka Tier-III Facility",
      desc: "Located in the heart of Dhaka with redundant power, cooling, and 24/7 physical security.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      desc: "Biometric access, CCTV surveillance, and armed guards protect our infrastructure around the clock.",
    },
    {
      icon: Zap,
      title: "Redundant Power",
      desc: "N+1 UPS systems and diesel generators ensure 100% power availability even during grid outages.",
    },
    {
      icon: Activity,
      title: "Carrier Neutral",
      desc: "Connected to multiple upstream providers and BDIX for true redundancy and the best possible routes.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Data Center
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Bangladesh&apos;s most connected facility
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our Dhaka data center is purpose-built for performance and reliability. With direct BDIX
            peering, carrier-neutral connectivity, and enterprise-grade infrastructure, your
            workloads run on the best network in the country.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "24/7 on-site network operations center (NOC)",
              "Multiple 10 Gbps fiber paths to BDIX",
              "ISO 27001 certified security practices",
              "Real-time DDoS mitigation up to 100 Gbps",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <Check className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:border-brand-orange hover:shadow-elegant transition"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-brand text-primary-foreground flex items-center justify-center">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-sm">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NetworkPerformance() {
  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Network Performance
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Built for speed and reliability
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our network is engineered to deliver the lowest possible latency to Bangladeshi users
            while maintaining robust international connectivity.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              value: "10 Gbps",
              label: "BDIX Uplink Capacity",
              desc: "Direct, uncongested peering with all major Bangladeshi ISPs.",
            },
            {
              value: "1 Gbps",
              label: "International Uplink",
              desc: "Redundant paths to Singapore, Hong Kong, and Europe.",
            },
            {
              value: "<10 ms",
              label: "Local Latency",
              desc: "Average ping from major Bangladeshi cities to our Dhaka node.",
            },
            {
              value: "<80 ms",
              label: "APAC Latency",
              desc: "Ping to Singapore and major Asian hubs for regional reach.",
            },
            {
              value: "99.99%",
              label: "Core Network Uptime",
              desc: "Fully redundant switching and routing infrastructure.",
            },
            {
              value: "100 Gbps",
              label: "DDoS Mitigation",
              desc: "Always-on protection with automatic traffic scrubbing.",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="text-3xl font-extrabold text-gradient-brand">{stat.value}</div>
              <div className="mt-2 font-semibold text-sm">{stat.label}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{stat.desc}</p>
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
      icon: Server,
      title: "KVM Virtualization",
      desc: "True hardware-level virtualization with dedicated resources. No overselling, no neighbor noise.",
    },
    {
      icon: Shield,
      title: "Free DDoS Protection",
      desc: "Automatic mitigation filters malicious traffic before it reaches your VPS.",
    },
    {
      icon: Zap,
      title: "NVMe Storage",
      desc: "Blazing-fast read/write speeds with enterprise-grade NVMe SSDs in RAID.",
    },
    {
      icon: HelpCircle,
      title: "Bangla Support",
      desc: "Talk to real humans in Bangla or English — 24 hours a day, 365 days a year.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Everything Included
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
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
  const faqs = BDIX_FAQS;

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Common questions about BDIX VPS
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

function CTA() {
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
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready for ultra-fast local hosting?
            </h2>
            <p className="mt-4 max-w-xl mx-auto opacity-95 text-base md:text-lg">
              Deploy your BDIX VPS in under 60 seconds and experience the difference local
              connectivity makes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft animate-bounce"
              >
                View BDIX VPS Plans <ArrowRight className="h-4 w-4" />
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
                <Check className="h-4 w-4" /> Free migration
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> 30-day guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> bKash accepted
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MapPinIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TrustBar() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-3 gap-8 text-center">
        {[
          { k: "10 Gbps", v: "BDIX Uplink" },
          { k: "<10 ms", v: "Avg Latency" },
          { k: "99.99%", v: "Core Uptime" },
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

function VpsPage() {
  return (
    <div>
      <Header />
      <Hero />
      <TrustBar />
      <BDIXAdvantage />
      <VpsFacilities />
      <Pricing />
      <DataCenter />
      <NetworkPerformance />
      <Included />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
