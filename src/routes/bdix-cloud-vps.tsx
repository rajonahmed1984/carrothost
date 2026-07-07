import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ArrowRight,
  MapPin,
  Cpu,
  HardDrive,
  Gauge,
  Wifi,
  Server,
  Shield,
  Zap,
  HelpCircle,
  Clock,
  Activity,
} from "lucide-react";
import { BdixNetworkMap, SpeedometerIcon } from "@/components/BdixNetworkMap";

export const Route = createFileRoute("/bdix-cloud-vps")({
  head: () => ({
    meta: [
      { title: "BDIX VPS — Ultra-Fast Local Hosting | CarrottHost" },
      { name: "description", content: "BDIX VPS hosting in Bangladesh. Ultra-low latency local servers with full root access, NVMe storage, and 99.9% uptime SLA." },
      { property: "og:title", content: "BDIX VPS — Ultra-Fast Local Hosting | CarrottHost" },
      { property: "og:description", content: "Bangladesh BDIX VPS with sub-10ms latency, full root access, and local support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VpsPage,
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
          <Link to="/vps" className="text-foreground font-semibold transition">BDIX VPS</Link>
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
              <MapPin className="h-3.5 w-3.5" />
              Dhaka Data Center · BDIX Connected
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
              Ultra-Fast <span className="text-gradient-brand">Local Hosting</span> for Bangladesh
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              BDIX VPS servers located right here in Dhaka deliver sub-10ms latency to Bangladeshi visitors. Perfect for local e-commerce, news portals, and business apps that demand speed.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
              >
                View VPS Plans <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/hosting"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground hover:border-brand-orange transition"
              >
                Compare Shared Hosting
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> Full Root Access</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> 99.9% Uptime SLA</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> bKash Accepted</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
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
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-brand-orange">10 Gbps</div>
                  <div className="text-xs text-muted-foreground mt-1">BDIX Uplink</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-brand-orange">&lt;10 ms</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Latency</div>
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
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-brand-green">The BDIX Advantage</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Why BDIX hosting matters for Bangladesh
          </h2>
          <p className="mt-3 text-muted-foreground">
            The Bangladesh Internet Exchange (BDIX) connects local ISPs directly, bypassing international bandwidth. That means faster, cheaper, and more reliable hosting for local audiences.
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
      name: "VPS Lite",
      price: "৳1,499",
      tag: "For starters",
      cpu: "2 vCPU Cores",
      ram: "2 GB DDR4 RAM",
      storage: "40 GB NVMe SSD",
      bandwidth: "2 TB Bandwidth",
      features: ["Full Root Access", "1 Gbps Port", "DDoS Protection", "Weekly Backups", "Bangla Support"],
    },
    {
      name: "VPS Pro",
      price: "৳2,999",
      tag: "Most popular",
      highlight: true,
      cpu: "4 vCPU Cores",
      ram: "4 GB DDR4 RAM",
      storage: "80 GB NVMe SSD",
      bandwidth: "4 TB Bandwidth",
      features: ["Full Root Access", "1 Gbps Port", "DDoS Protection", "Daily Backups", "Priority Support", "Free Migration"],
    },
    {
      name: "VPS Business",
      price: "৳5,499",
      tag: "For power users",
      cpu: "6 vCPU Cores",
      ram: "8 GB DDR4 RAM",
      storage: "160 GB NVMe SSD",
      bandwidth: "6 TB Bandwidth",
      features: ["Full Root Access", "10 Gbps BDIX", "DDoS Protection", "Daily Backups", "24/7 Phone Support", "Free Migration", "Dedicated IP"],
    },
    {
      name: "VPS Enterprise",
      price: "৳9,999",
      tag: "For heavy workloads",
      cpu: "8 vCPU Cores",
      ram: "16 GB DDR4 RAM",
      storage: "320 GB NVMe SSD",
      bandwidth: "10 TB Bandwidth",
      features: ["Full Root Access", "10 Gbps BDIX", "DDoS Protection", "Hourly Backups", "24/7 Phone Support", "Free Migration", "2 Dedicated IPs", "Custom ISO"],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Pricing</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            BDIX VPS plans that scale with you
          </h2>
          <p className="mt-3 text-muted-foreground">
            All plans include full root access, BDIX connectivity, and our 99.9% uptime SLA. Upgrade anytime with zero downtime.
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

function DataCenter() {
  const features = [
    { icon: MapPin, title: "Dhaka Tier-III Facility", desc: "Located in the heart of Dhaka with redundant power, cooling, and 24/7 physical security." },
    { icon: Shield, title: "Enterprise Security", desc: "Biometric access, CCTV surveillance, and armed guards protect our infrastructure around the clock." },
    { icon: Zap, title: "Redundant Power", desc: "N+1 UPS systems and diesel generators ensure 100% power availability even during grid outages." },
    { icon: Activity, title: "Carrier Neutral", desc: "Connected to multiple upstream providers and BDIX for true redundancy and the best possible routes." },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-brand-green">Data Center</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Bangladesh&apos;s most connected facility
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our Dhaka data center is purpose-built for performance and reliability. With direct BDIX peering, carrier-neutral connectivity, and enterprise-grade infrastructure, your workloads run on the best network in the country.
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

function NetworkPerformance() {
  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Network Performance</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Built for speed and reliability
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our network is engineered to deliver the lowest possible latency to Bangladeshi users while maintaining robust international connectivity.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { value: "10 Gbps", label: "BDIX Uplink Capacity", desc: "Direct, uncongested peering with all major Bangladeshi ISPs." },
            { value: "1 Gbps", label: "International Uplink", desc: "Redundant paths to Singapore, Hong Kong, and Europe." },
            { value: "<10 ms", label: "Local Latency", desc: "Average ping from major Bangladeshi cities to our Dhaka node." },
            { value: "<80 ms", label: "APAC Latency", desc: "Ping to Singapore and major Asian hubs for regional reach." },
            { value: "99.99%", label: "Core Network Uptime", desc: "Fully redundant switching and routing infrastructure." },
            { value: "100 Gbps", label: "DDoS Mitigation", desc: "Always-on protection with automatic traffic scrubbing." },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
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
    { icon: Server, title: "KVM Virtualization", desc: "True hardware-level virtualization with dedicated resources. No overselling, no neighbor noise." },
    { icon: Shield, title: "Free DDoS Protection", desc: "Automatic mitigation filters malicious traffic before it reaches your VPS." },
    { icon: Zap, title: "NVMe Storage", desc: "Blazing-fast read/write speeds with enterprise-grade NVMe SSDs in RAID." },
    { icon: HelpCircle, title: "Bangla Support", desc: "Talk to real humans in Bangla or English — 24 hours a day, 365 days a year." },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand-green">Everything Included</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            The extras that make a difference
          </h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((i) => (
            <div key={i.title} className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-orange hover:shadow-elegant transition">
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
  const faqs = [
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

  return (
    <section className="py-20 md:py-28 bg-gradient-soft border-y border-border">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-brand-green">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">Common questions about BDIX VPS</h2>
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
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl bg-gradient-brand p-10 md:p-14 text-center text-primary-foreground shadow-elegant relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 10% 20%, white 0, transparent 30%), radial-gradient(circle at 90% 80%, white 0, transparent 30%)",
          }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Ready for ultra-fast local hosting?
            </h2>
            <p className="mt-4 max-w-xl mx-auto opacity-90">
              Deploy your BDIX VPS in under 60 seconds and experience the difference local connectivity makes.
            </p>
            <a
              href="#pricing"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-orange hover:bg-white/90 transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </a>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Free migration</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> 30-day guarantee</span>
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

function VpsPage() {
  return (
    <div>
      <PageHeader />
      <Hero />
      <BDIXAdvantage />
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
