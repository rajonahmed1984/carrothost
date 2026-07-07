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
  HeadphonesIcon,
  Clock,
  Award,
  Star,
  Quote,
  Lock,
  Building2,
} from "lucide-react";
import { CloudStackIllustration } from "@/components/CloudStackIllustration";

export const Route = createFileRoute("/cloud-vps")({
  head: () => ({
    meta: [
      { title: "Cloud VPS — High-Performance Global Hosting | CarrottHost" },
      { name: "description", content: "Scalable Cloud VPS with full root access, choice of OS, and global infrastructure. NVMe SSD, 99.9% uptime SLA, and 24/7 expert support." },
      { property: "og:title", content: "Cloud VPS — High-Performance Global Hosting | CarrottHost" },
      { property: "og:description", content: "Scalable Cloud VPS with full root access, choice of OS, and global infrastructure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CloudVpsPage,
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
          <Link to="/domains" className="hover:text-foreground transition">Domains</Link>
          <Link to="/hosting" className="hover:text-foreground transition">Hosting</Link>
          <Link to="/vps" className="hover:text-foreground transition">BDIX VPS</Link>
          <Link to="/cloud-vps" className="text-foreground font-semibold transition">Cloud VPS</Link>
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

function Hero() {
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
              <Cloud className="h-3.5 w-3.5" />
              Global Cloud Infrastructure
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
              Performance, Scalability, and <span className="text-gradient-brand">Total Flexibility</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Cloud VPS hosting that puts you in full control. Choose your OS, scale resources on demand, and deploy across a global network built for speed and reliability.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
              >
                View Cloud Plans <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/vps"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground hover:border-brand-orange transition"
              >
                Compare BDIX VPS
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> Full Root Access</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> Choice of OS</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> bKash Accepted</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg border border-border bg-background text-brand-orange flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Scalable Cloud Infrastructure</p>
                <p className="text-xs text-muted-foreground">Elastic layers, global reach</p>
              </div>
            </div>
            <CloudStackIllustration />
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-brand-orange">8+</div>
                  <div className="text-xs text-muted-foreground mt-1">Global Regions</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-brand-orange">40 Gbps</div>
                  <div className="text-xs text-muted-foreground mt-1">Network Uplink</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-brand-orange">99.99%</div>
                  <div className="text-xs text-muted-foreground mt-1">Core Uptime</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function WhyCloud() {
  const points = [
    {
      icon: Server,
      title: "Full Root Access",
      desc: "Complete administrative control over your server. Install custom software, modify kernel settings, and configure the environment exactly how you need it.",
    },
    {
      icon: Monitor,
      title: "Choice of OS",
      desc: "Deploy Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux, or Windows Server. Bring your own custom ISO for specialized workloads.",
    },
    {
      icon: Layers,
      title: "Instant Scalability",
      desc: "Upgrade CPU, RAM, and storage on demand with zero downtime. Scale up during traffic spikes and down during quiet periods.",
    },
    {
      icon: Globe,
      title: "Global Edge Network",
      desc: "Deploy close to your audience with cloud nodes across Asia, Europe, and North America. Reduce latency and improve user experience worldwide.",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-brand-green">Why Cloud VPS</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Total control meets effortless scaling
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our Cloud VPS platform combines the power of dedicated resources with the flexibility of the cloud. You get guaranteed compute, full isolation, and the freedom to build anything.
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

function Pricing() {
  const plans = [
    {
      name: "Cloud Starter",
      price: "৳1,999",
      tag: "For developers",
      cpu: "2 vCPU Cores",
      ram: "4 GB DDR4 RAM",
      storage: "80 GB NVMe SSD",
      bandwidth: "3 TB Bandwidth",
      features: ["Full Root Access", "1 Gbps Port", "DDoS Protection", "Weekly Backups", "Linux OS Choice", "Bangla Support"],
    },
    {
      name: "Cloud Pro",
      price: "৳3,999",
      tag: "Most popular",
      highlight: true,
      cpu: "4 vCPU Cores",
      ram: "8 GB DDR4 RAM",
      storage: "160 GB NVMe SSD",
      bandwidth: "5 TB Bandwidth",
      features: ["Full Root Access", "1 Gbps Port", "DDoS Protection", "Daily Backups", "Linux & Windows OS", "Priority Support", "Free Migration"],
    },
    {
      name: "Cloud Business",
      price: "৳7,499",
      tag: "For power users",
      cpu: "6 vCPU Cores",
      ram: "16 GB DDR4 RAM",
      storage: "320 GB NVMe SSD",
      bandwidth: "8 TB Bandwidth",
      features: ["Full Root Access", "10 Gbps Port", "DDoS Protection", "Daily Backups", "Any OS", "24/7 Phone Support", "Free Migration", "Dedicated IP"],
    },
    {
      name: "Cloud Enterprise",
      price: "৳14,999",
      tag: "For heavy workloads",
      cpu: "8 vCPU Cores",
      ram: "32 GB DDR4 RAM",
      storage: "640 GB NVMe SSD",
      bandwidth: "12 TB Bandwidth",
      features: ["Full Root Access", "10 Gbps Port", "DDoS Protection", "Hourly Backups", "Custom ISO", "24/7 Phone Support", "Free Migration", "2 Dedicated IPs", "Load Balancer Ready"],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Cloud VPS plans built to scale
          </h2>
          <p className="mt-3 text-muted-foreground">
            All plans include full root access, your choice of operating system, and our 99.9% uptime SLA. Upgrade resources anytime without rebooting.
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
                <span className="text-3xl font-extrabold">{p.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              {!p.highlight && <p className="mt-1 text-xs text-muted-foreground">{p.tag}</p>}

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>{p.cpu}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>{p.ram}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>{p.storage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>{p.bandwidth}</span>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-xs flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#signup"
                className={`mt-6 inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant hover:opacity-95"
                    : "border border-border hover:border-brand-orange"
                }`}
              >
                Choose {p.name}
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
    { icon: Server, title: "Enterprise Hardware", desc: "AMD EPYC & Intel Xeon processors with ECC memory and enterprise NVMe SSD arrays for consistent performance." },
    { icon: Shield, title: "DDoS Protection", desc: "Always-on mitigation up to 100 Gbps keeps your services online even during large-scale attacks." },
    { icon: Zap, title: "Redundant Power", desc: "N+1 UPS and diesel generators at every facility ensure uninterrupted power for critical workloads." },
    { icon: Globe, title: "Multi-Region Redundancy", desc: "Replicate backups across Singapore, Amsterdam, and Dallas for geographic disaster recovery." },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-brand-green">Infrastructure</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Built on world-class infrastructure
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our cloud platform runs on Tier-III+ data centers with carrier-neutral networking, redundant power, and 24/7 physical security. Every node is monitored in real time for optimal performance.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Pure SSD/NVMe storage with RAID-10 redundancy",
              "10 Gbps+ network uplinks with multiple carriers",
              "Automated failover between hypervisors",
              "Real-time resource monitoring and alerting",
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
            <div key={f.title} className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:border-brand-orange hover:shadow-elegant transition">
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

function ExpertSupport() {
  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Expert Support</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            We&apos;re with you every step of the way
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our support team is made up of experienced system administrators who understand Linux, Windows Server, networking, and cloud architecture.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: HeadphonesIcon, title: "24/7 Live Chat", desc: "Get instant help via live chat any time of day. Average response under 2 minutes." },
            { icon: Clock, title: "15-Min SLA", desc: "Critical issues are acknowledged within 15 minutes, with most resolved within the hour." },
            { icon: Monitor, title: "Remote Hands", desc: "Need a rescue kernel or ISO mounted? Our team can perform hands-on tasks for you." },
            { icon: Globe, title: "Bangla & English", desc: "Communicate in the language you prefer. Our local team speaks both Bangla and English fluently." },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-card border border-border p-6 shadow-soft hover:border-brand-orange hover:shadow-elegant transition">
              <div className="h-12 w-12 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center">
                <s.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Included() {
  const items = [
    { icon: Shield, title: "DDoS Protection", desc: "Automatic mitigation for every VPS. No extra configuration needed." },
    { icon: Zap, title: "Instant Provisioning", desc: "Your server is ready within 60 seconds of checkout." },
    { icon: HardDrive, title: "NVMe SSD Storage", desc: "Blazing-fast storage that dramatically improves database and app performance." },
    { icon: Cloud, title: "Snapshots & Backups", desc: "Take point-in-time snapshots and schedule automated backups with one click." },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">What&apos;s Included</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Everything you need to run your cloud
          </h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((i) => (
            <div key={i.title} className="rounded-2xl bg-card border border-border p-6 shadow-soft hover:border-brand-orange hover:shadow-elegant transition">
              <div className="h-10 w-10 rounded-lg bg-gradient-brand text-primary-foreground flex items-center justify-center">
                <i.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-sm">{i.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "What operating systems can I install?", a: "We offer Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux, and Windows Server out of the box. You can also upload your own custom ISO for specialized distributions." },
    { q: "How quickly can I scale resources?", a: "Scaling is instant for CPU and RAM upgrades — no reboot required. Storage expansions are provisioned within minutes." },
    { q: "Do you offer managed Cloud VPS?", a: "Yes. Our managed add-on includes proactive monitoring, security patching, and monthly optimization reports so you can focus on your business." },
    { q: "Can I migrate from another cloud provider?", a: "Absolutely. We offer free migration assistance from AWS, DigitalOcean, Linode, and other providers. Our team handles the entire transfer." },
    { q: "Is there a money-back guarantee?", a: "Yes. All Cloud VPS plans include a 7-day money-back guarantee so you can test the platform risk-free." },
  ];

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-card p-5 open:shadow-soft transition"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {f.q}
                <span className="ml-4 h-6 w-6 rounded-full bg-secondary text-brand-green flex items-center justify-center group-open:rotate-45 transition">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 md:p-16 shadow-elegant">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="text-primary-foreground max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Ready to deploy in the cloud?
              </h2>
              <p className="mt-3 opacity-90">
                Launch your Cloud VPS in under 60 seconds. Full root access, your choice of OS, and expert support included.
              </p>
            </div>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 font-semibold text-foreground hover:bg-secondary transition"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div
            aria-hidden
            className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-brand-green/30 blur-3xl"
          />
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
              Reliable domain & hosting for Bangladesh. Cloud and BDIX-optimized, locally supported, and built to scale.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/domains" className="hover:text-foreground transition">Domain Registration</Link></li>
              <li><Link to="/hosting" className="hover:text-foreground transition">Shared Hosting</Link></li>
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

function TrustUptime() {
  const stats = [
    { value: "99.9%", label: "Uptime SLA", desc: "Backed by our service level agreement with pro-rata credits for any downtime." },
    { value: "15 min", label: "Critical Response", desc: "All critical support tickets are acknowledged within 15 minutes, 24/7." },
    { value: "7-Day", label: "Money-Back Guarantee", desc: "Try Cloud VPS risk-free. Full refund if you are not satisfied within 7 days." },
    { value: "60s", label: "Provisioning Time", desc: "Servers are provisioned and ready to use within 60 seconds of checkout." },
  ];

  return (
    <section className="py-14 md:py-20 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2 text-brand-green mb-3">
                <Gauge className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="text-3xl font-extrabold text-gradient-brand">{s.value}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustCertifications() {
  const standards = [
    {
      icon: Building2,
      title: "Tier-III+ Facilities",
      desc: "Our primary facility meets Tier-III standards with N+1 redundancy, dual power feeds, and 24/7 on-site security.",
    },
    {
      icon: Lock,
      title: "Physical Security",
      desc: "Biometric access control, CCTV surveillance, and manned security ensure only authorized personnel enter the data floor.",
    },
    {
      icon: Shield,
      title: "Network Resilience",
      desc: "Carrier-neutral networking with multiple upstream providers and automatic failover protects against single-path outages.",
    },
    {
      icon: Award,
      title: "Enterprise Standards",
      desc: "We operate under strict internal policies for change management, incident response, and regular infrastructure audits.",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Trust & Compliance</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Enterprise-grade facilities you can rely on
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our infrastructure is housed in certified facilities with rigorous security, redundancy, and operational protocols.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standards.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-brand-orange hover:shadow-elegant transition">
              <div className="h-12 w-12 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center">
                <s.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      quote: "We moved our e-commerce platform to CarrottHost Cloud VPS and saw an immediate improvement in page load times. The BDIX routing for Bangladesh customers is a game changer.",
      author: "Rafiq Hossain",
      role: "CTO, DhakaCart Ltd.",
      rating: 5,
    },
    {
      quote: "The 15-minute response SLA actually holds up. When we had a kernel issue at 2 AM, their team had it resolved before our morning standup. That level of local support is rare.",
      author: "Nusrat Jahan",
      role: "DevOps Lead, CloudNext BD",
      rating: 5,
    },
    {
      quote: "Scaling from 4 to 16 GB RAM during our flash sale took under a minute with zero downtime. CarrottHost makes cloud hosting feel effortless for growing businesses.",
      author: "Tanvir Ahmed",
      role: "Founder, TechBazaar",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Customer Stories</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Trusted by Bangladesh businesses
          </h2>
          <p className="mt-3 text-muted-foreground">
            See why developers, agencies, and e-commerce brands choose CarrottHost Cloud VPS.
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.author}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant transition flex flex-col"
            >
              <Quote className="h-8 w-8 text-brand-orange/30 absolute top-6 right-6" />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-orange text-brand-orange" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="mt-6 pt-5 border-t border-border">
                <p className="font-semibold text-sm">{r.author}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CloudVpsPage() {
  return (
    <div>
      <PageHeader />
      <Hero />
      <TrustUptime />
      <WhyCloud />
      <Pricing />
      <Infrastructure />
      <TrustCertifications />
      <Testimonials />
      <ExpertSupport />
      <Included />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
