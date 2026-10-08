import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ArrowRight,
  Cpu,
  HardDrive,
  Gauge,
  Wifi,
  Server,
  Shield,
  Zap,
  HelpCircle,
  Cloud,
  Globe,
  Monitor,
  Layers,
  Activity,
  Phone,
  HeadphonesIcon,
  Clock,
  Award,
  Star,
  Quote,
  Lock,
  Building2,
  Mail,
  FolderOpen,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { CloudStackIllustration } from "@/components/CloudStackIllustration";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  breadcrumbSchema,
  createSeoMeta,
  faqSchema,
  jsonLdScript,
  webHostingServiceSchema,
} from "@/lib/seo";

const XEON_FAQS = [
  {
    q: "What processors power the Xeon VPS?",
    a: "Our virtual servers are powered 100% by high-end Intel Xeon Platinum series processors, which are optimized for dynamic server workloads and concurrent tasks.",
  },
  {
    q: "Can I upgrade my Xeon resources later?",
    a: "Yes. Scaling up cores, memory, or storage is instant and can be requested directly from our portal with no data migration required.",
  },
  {
    q: "Which operating systems are available?",
    a: "We offer pre-configured templates for Ubuntu, Debian, CentOS, AlmaLinux, and Rocky Linux. You can also upload your own ISO.",
  },
  {
    q: "Do you offer transactional email integrations?",
    a: "Yes, our Xeon VPS packages support sending transactional emails directly through secure ports, letting you execute transactional mail services without third-party tools.",
  },
];

export const Route = createFileRoute("/xeon-cloud-vps")({
  head: () => {
    const seo = createSeoMeta({
      title: "Intel Xeon VPS Hosting — CarrotHost",
      description:
        "High-performance Intel Xeon Cloud VPS with full root access, unmetered port, and NVMe SSD storage. Deploy in under 60 seconds with 99.9% uptime.",
      path: "/xeon-cloud-vps",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-xeon-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Xeon Cloud VPS", path: "/xeon-cloud-vps" },
          ]),
        ),
        jsonLdScript(
          "ld-xeon-service",
          webHostingServiceSchema({
            name: "Intel Xeon VPS Hosting",
            description:
              "High-performance Intel Xeon Cloud VPS with full root access, unmetered port, NVMe SSD storage, and scalable cloud resources.",
            path: "/xeon-cloud-vps",
            serviceType: "Xeon Cloud VPS Hosting",
            priceFrom: "607",
          }),
        ),
        jsonLdScript(
          "ld-xeon-faq",
          faqSchema(XEON_FAQS.map((item) => ({ question: item.q, answer: item.a }))),
        ),
      ],
    };
  },
  component: XeonVpsPage,
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
              <Cpu className="h-4.5 w-4.5" />
              Intel® Xeon® Platinum Infrastructure
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              High-Performance <span className="text-gradient-brand">Xeon Cloud VPS</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Power your workloads, sites, and applications with enterprise-grade Intel Xeon
              Platinum virtual servers. Get blazing performance, dedicated NVMe storage, and 100%
              cloud scalability.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5"
              >
                View Xeon Plans <ArrowRight className="h-4.5 w-4.5" />
              </a>
              <Link
                to="/bdix-cloud-vps"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-4 font-bold text-foreground hover:border-brand-orange hover:bg-secondary/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                Compare BDIX VPS
              </Link>
            </div>
            <div className="pt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-t border-border/50">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> Full Root Access
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> 100% NVMe RAID SSD
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-green" /> Scalable On-Demand
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-orange to-brand-green opacity-10 blur-xl" />
            <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
              <CloudStackIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function XeonFacilities() {
  const [activeTab, setActiveTab] = useState(0);

  const facilities = [
    {
      icon: Cpu,
      title: "Xeon Platinum CPUs",
      subtitle: "Enterprise Processing Power",
      desc: "Run compute-heavy applications, compilation pipelines, or massive databases effortlessly. We use latest-generation Intel Xeon Platinum nodes with dedicated execution threads.",
      features: [
        "High single-core CPU clock speeds",
        "Dedicated vCPU allocation per instance",
        "Optimized for database & high-traffic nodes",
        "AVX-512 vector acceleration support",
      ],
    },
    {
      icon: HardDrive,
      title: "Pure NVMe SSD Storage",
      subtitle: "Blistering Disk I/O Speeds",
      desc: "Standard SSDs choke under heavy database operations. Our servers are backed 100% by enterprise NVMe SSD arrays in RAID-10 configuration, offering up to 10x higher IOPs.",
      features: [
        "Up to 3,500 MB/s read/write speeds",
        "RAID-10 hardware redundancy",
        "No disk-throttling constraints",
        "Ideal for content-heavy and dynamic sites",
      ],
    },
    {
      icon: Wifi,
      title: "1 Gbit/s Network Ports",
      subtitle: "High Bandwidth Transfers",
      desc: "Connect your applications with a high-capacity network pipeline. All Xeon VPS packages receive dedicated 1 Gbps port allocations with generous monthly outgoing transfer quotas.",
      features: [
        "1 Gbit/s burstable port capacity",
        "Unmetered incoming data transfer",
        "Redundant upstream carrier paths",
        "Sub-ms latency to major global exchanges",
      ],
    },
    {
      icon: Monitor,
      title: "Visual Control Dashboard",
      subtitle: "Rebuild & Remote Reboot",
      desc: "You don't need shell access for basic tasks. Our interactive portal lets you reboot, stop, re-provision, install OS images, or monitor resource stats visually.",
      features: [
        "1-click VPS reboot/boot/shutdown",
        "Automated OS re-installation panel",
        "VNC terminal console in your browser",
        "Real-time bandwidth, RAM & CPU graphs",
      ],
    },
    {
      icon: Shield,
      title: "Always-On Security",
      subtitle: "DDoS Mitigation & Malware Guard",
      desc: "Keep your production environments secure. Every VPS benefits from network-level DDoS traffic scrubbing, combined with isolated virtualization guards.",
      features: [
        "Inbound DDoS scrubbers",
        "Isolated virtual machine hypervisors",
        "Configurable firewalls & SSH keys",
        "Regular malware scans and updates",
      ],
    },
    {
      icon: Clock,
      title: "Auto Backup Snapshots",
      subtitle: "1-Click Full System Restores",
      desc: "Never worry about configuration mistakes or lost databases again. Configure daily or weekly background snapshot backups and restore your server in seconds.",
      features: [
        "Incremental snapshot technology",
        "Restore entire VM in 1-click",
        "Keep up to 7 snapshots history",
        "Download backups locally anytime",
      ],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Xeon Cloud VPS Facilities
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
            Built for performance & control
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Manage your apps, systems, and staging pipelines on dedicated virtual nodes backed by
            Webdock-powered technologies.
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
                {facilities[activeTab].features.map((point) => (
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
              <span>Standard facilities on all Xeon VPS instances</span>
              <a
                href="https://portal.carrothost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-brand-orange hover:underline"
              >
                Deploy Xeon Server <ArrowUpRight className="h-3.5 w-3.5" />
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
      name: "NVMe Nano4",
      price: "৳607.00",
      period: "/mo",
      tag: "Budget entry",
      cpu: "1 Thread / vCPU",
      ram: "2 GB RAM",
      storage: "15 GB On-Board NVMe",
      bandwidth: "1 TB Outgoing Limit",
      link: "https://portal.carrothost.com/store/xeon-vps/nvme-nano4",
      features: [
        "Xeon Platinum CPUs",
        "1 Gbit/s Network Port",
        "Free SSL Certificates",
        "Root Access & Dedicated IP",
        "Weekly Backup Snapshots",
      ],
    },
    {
      name: "NVMe Bit",
      price: "৳3,035.00",
      period: "/mo",
      tag: "Most popular",
      highlight: true,
      cpu: "10 Threads / vCPU",
      ram: "10 GB RAM",
      storage: "100 GB On-Board NVMe",
      bandwidth: "5 TB Outgoing Limit",
      link: "https://portal.carrothost.com/store/xeon-vps/nvme-bit",
      features: [
        "Xeon Platinum CPUs",
        "1 Gbit/s Network Port",
        "Free SSL Certificates",
        "Transactional Emails",
        "Email Forwarding Control",
        "WordPress Management Panel",
      ],
    },
    {
      name: "Intel Xeon Custom Profile",
      price: "৳5,800.00",
      period: "/mo",
      tag: "Custom allocation",
      cpu: "5 CPU Threads",
      ram: "5 GB Memory",
      storage: "50 GB Storage",
      bandwidth: "1 Gbit/s-Port",
      link: "https://portal.carrothost.com/store/xeon-vps/intel-xeon-custom-profile",
      features: [
        "Custom CPU allocation",
        "Custom RAM allocation",
        "Custom storage limit",
        "Dedicated network port",
        "Configured on demand",
      ],
    },
    {
      name: "NVMe Premium",
      price: "৳12,140.00",
      period: "/mo",
      tag: "Enterprise power",
      cpu: "30 Threads / vCPU",
      ram: "64 GB RAM",
      storage: "500 GB On-Board NVMe",
      bandwidth: "23 TB Outgoing Limit",
      link: "https://portal.carrothost.com/store/xeon-vps/nvme-premium",
      features: [
        "Xeon Platinum CPUs",
        "1 Gbit/s Network Port",
        "Free SSL Certificates",
        "Transactional Emails",
        "Email Forwarding Control",
        "WordPress Management Panel",
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
            Xeon VPS hosting plans built to scale
          </h2>
          <p className="mt-3 text-muted-foreground">
            All plans include dedicated Intel Xeon Platinum cores, full root access, and unmetered
            ports.
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
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

function Infrastructure() {
  const features = [
    {
      icon: Server,
      title: "Enterprise Hardware",
      desc: "Latest Intel Xeon Platinum processors with ECC memory and enterprise NVMe SSD arrays for consistent performance.",
    },
    {
      icon: Shield,
      title: "DDoS Protection",
      desc: "Always-on mitigation up to 100 Gbps keeps your services online even during large-scale attacks.",
    },
    {
      icon: Zap,
      title: "Redundant Power",
      desc: "N+1 UPS and diesel generators at every facility ensure uninterrupted power for critical workloads.",
    },
    {
      icon: Globe,
      title: "Multi-Region Redundancy",
      desc: "Replicate backups across multiple secure facilities for geographic disaster recovery.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-brand-green bg-brand-green/10 px-3.5 py-1 rounded-full">
            Infrastructure
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            High-availability cloud environment
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our cloud stack is engineered from the ground up to prevent single points of failure.
            With enterprise Xeon processors, redundant network paths, and automatic backup systems,
            your virtual servers stay secure and online.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Burstable 1 Gbps ports on all Xeon virtual servers",
              "Hot-swappable enterprise NVMe SSD disk arrays",
              "Biometric access control and 24/7 video monitoring",
              "Dual active-active fiber lines to global internet gateways",
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
            Engineered for global reach
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our networking routes traffic through the lowest latency paths available, ensuring fast
            page load speeds across all target user geographies.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              value: "1 Gbit/s",
              label: "Port Speed Capacity",
              desc: "Dedicated high-bandwidth ports on all virtual server instances.",
            },
            {
              value: "Unmetered",
              label: "Incoming Transfer",
              desc: "Receive unlimited data uploads to your server with zero charges.",
            },
            {
              value: "99.9% Uptime",
              label: "Network SLA",
              desc: "Guaranteed network availability backed by service SLAs.",
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
      title: "LXD & KVM Hypervisors",
      desc: "Full hardware-level isolated environments. No resource contention or neighbor impact.",
    },
    {
      icon: Shield,
      title: "Malware Scans",
      desc: "Automatic background scans detect security vulnerabilities before they threaten your database.",
    },
    {
      icon: Zap,
      title: "Fast NVMe RAID",
      desc: "RAID SSD architectures ensure maximum read/write rates for all files.",
    },
    {
      icon: HelpCircle,
      title: "Bangla Support",
      desc: "Talk to real support engineers in Bangla or English — 24 hours a day, 365 days a year.",
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
  const faqs = XEON_FAQS;

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Common questions about Xeon VPS
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
              Ready for high-performance Xeon hosting?
            </h2>
            <p className="mt-4 max-w-xl mx-auto opacity-95 text-base md:text-lg">
              Deploy your Intel Xeon VPS server instance in under 60 seconds and gain full control
              over your cloud resources.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-orange hover:bg-white/95 transition shadow-soft animate-bounce"
              >
                View Xeon VPS Plans <ArrowRight className="h-4 w-4" />
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

function XeonVpsPage() {
  return (
    <div>
      <Header />
      <Hero />
      <XeonFacilities />
      <Pricing />
      <Infrastructure />
      <NetworkPerformance />
      <Included />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
