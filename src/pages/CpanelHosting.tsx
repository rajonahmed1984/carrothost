import SiteLayout from "@/components/SiteLayout";
import { motion } from "framer-motion";
import {
  HardDrive, Shield, Zap, Globe, Clock, Headphones,
  Check, Sparkles, ShoppingCart, ArrowRight,
  RefreshCw, Mail, Lock, Gauge, Database, Settings
} from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "৳499",
    period: "/mo",
    description: "Great for beginners and personal websites",
    features: [
      "1 Website",
      "10 GB NVMe Storage",
      "100 GB Bandwidth",
      "Free SSL Certificate",
      "Weekly Backups",
      "2 Email Accounts",
      "cPanel Access",
      "Standard Support",
    ],
    cta: "Order Now",
    featured: false,
  },
  {
    name: "Professional",
    price: "৳999",
    period: "/mo",
    description: "Best for businesses and e-commerce stores",
    features: [
      "10 Websites",
      "50 GB NVMe Storage",
      "Unlimited Bandwidth",
      "Free SSL & CDN",
      "Daily Backups",
      "25 Email Accounts",
      "cPanel Access",
      "Softaculous Installer",
      "Staging Environment",
      "Priority Support",
    ],
    cta: "Order Now",
    featured: true,
  },
  {
    name: "Business Plus",
    price: "৳2,499",
    period: "/mo",
    description: "Maximum power for agencies and high-traffic sites",
    features: [
      "Unlimited Websites",
      "200 GB NVMe Storage",
      "Unlimited Bandwidth",
      "Free SSL & CDN",
      "Real-time Backups",
      "Unlimited Email",
      "cPanel Access",
      "Dedicated IP",
      "Imunify360 Security",
      "White-glove Onboarding",
      "24/7 Priority Support",
    ],
    cta: "Order Now",
    featured: false,
  },
];

const features = [
  {
    icon: Settings,
    title: "cPanel Control Panel",
    description: "The world's most trusted hosting panel — manage files, domains, emails, and databases with ease.",
  },
  {
    icon: Zap,
    title: "LiteSpeed Web Server",
    description: "Up to 12× faster than Apache with built-in LSCache for WordPress and dynamic content.",
  },
  {
    icon: HardDrive,
    title: "NVMe SSD Storage",
    description: "Enterprise NVMe drives deliver ultra-low latency and 10× faster I/O than traditional SSDs.",
  },
  {
    icon: Shield,
    title: "Imunify360 Security",
    description: "AI-powered firewall, malware scanning, and intrusion detection protect your sites 24/7.",
  },
  {
    icon: RefreshCw,
    title: "JetBackup Manager",
    description: "Automated daily backups with granular restore — recover individual files, databases, or emails.",
  },
  {
    icon: Lock,
    title: "Free SSL Certificates",
    description: "Auto-provisioned Let's Encrypt SSL on every domain with automatic renewal — zero hassle.",
  },
  {
    icon: Database,
    title: "Softaculous Installer",
    description: "One-click install for WordPress, Joomla, Magento, Laravel, and 400+ applications.",
  },
  {
    icon: Globe,
    title: "Cloudflare CDN",
    description: "Integrated Cloudflare CDN delivers your content from 300+ global edge locations.",
  },
  {
    icon: Mail,
    title: "Professional Email",
    description: "Create branded email addresses with webmail, spam filtering, and IMAP/POP3/SMTP support.",
  },
];

const specs = [
  { label: "Control Panel", value: "cPanel / WHM" },
  { label: "Web Server", value: "LiteSpeed Enterprise" },
  { label: "PHP Versions", value: "7.4 – 8.3 (MultiPHP)" },
  { label: "Database", value: "MySQL 8 / MariaDB 10.6" },
  { label: "Server Location", value: "Bangladesh / Singapore" },
  { label: "Uptime Guarantee", value: "99.99%" },
  { label: "Backup System", value: "JetBackup (Daily)" },
  { label: "SSL", value: "Free (AutoSSL + Let's Encrypt)" },
  { label: "Security", value: "Imunify360 + CSF Firewall" },
  { label: "Support", value: "24/7 Ticket + Live Chat" },
  { label: "Migration", value: "Free (cPanel to cPanel)" },
  { label: "Money-back", value: "30-Day Guarantee" },
];

const CpanelHosting = () => {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="glow-orb w-[500px] h-[500px] bg-primary/5 -top-32 -right-32 absolute" />
        <div className="glow-orb w-[350px] h-[350px] bg-accent/5 bottom-0 -left-16 absolute" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8"
            >
              <HardDrive className="w-4 h-4" />
              cPanel Hosting
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6">
              <span className="text-foreground">Professional Hosting</span>
              <br />
              <span className="text-gradient">With cPanel Power.</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Industry-standard cPanel hosting with LiteSpeed, NVMe storage, and enterprise security — the trusted choice for businesses and developers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="#pricing"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-glow px-8 py-4 rounded-xl text-primary-foreground font-semibold text-base flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                View Plans
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold text-base flex items-center gap-2 hover:bg-secondary transition-colors w-full sm:w-auto justify-center"
              >
                Explore Features
              </motion.a>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
            >
              {[
                { value: "cPanel", label: "Control Panel" },
                { value: "400+", label: "One-Click Apps" },
                { value: "99.99%", label: "Uptime SLA" },
                { value: "NVMe", label: "SSD Storage" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-spacing relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-gradient">
              Enterprise-Grade Hosting Stack
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powered by cPanel, LiteSpeed, and Imunify360 — everything a professional website demands.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="card-premium rounded-xl p-6 md:p-8 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-spacing relative overflow-hidden">
        <div className="glow-orb w-[500px] h-[500px] bg-primary/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20 mb-6">
              Pricing
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-gradient">
              Plans That Grow With You
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transparent pricing with no hidden fees. Start small and scale seamlessly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-2xl p-6 md:p-8 flex flex-col relative ${
                  plan.featured
                    ? "card-featured md:scale-105 md:-my-4"
                    : "card-premium"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                      <Sparkles className="w-3.5 h-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl md:text-5xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-base">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-secondary-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 ${
                    plan.featured
                      ? "btn-glow text-primary-foreground"
                      : "bg-secondary border border-border text-foreground hover:bg-card-hover"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {plan.cta}
                </motion.a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="section-spacing relative overflow-hidden">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
              Specifications
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-gradient">
              Technical Details
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              The full stack behind every cPanel hosting plan.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <div className="card-premium rounded-2xl overflow-hidden">
              {specs.map((spec, index) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className={`flex items-center justify-between px-6 py-4 text-sm ${
                    index !== specs.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="font-medium text-foreground">{spec.label}</span>
                  <span className="text-muted-foreground">{spec.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden px-8 py-16 md:py-20 text-center"
            style={{ background: "var(--gradient-cta)" }}
          >
            <div className="glow-orb w-[400px] h-[400px] bg-white/10 -top-40 -right-40 absolute" />
            <div className="glow-orb w-[300px] h-[300px] bg-white/5 bottom-0 -left-20 absolute" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Switch to cPanel Hosting Today
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Free cPanel-to-cPanel migration, instant provisioning, and a 30-day money-back guarantee.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  href="#pricing"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-xl bg-white text-primary font-semibold text-base flex items-center gap-2 hover:bg-white/90 transition-colors"
                >
                  Get Started Now
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-xl border border-white/30 text-primary-foreground font-semibold text-base flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Headphones className="w-4 h-4" />
                  Contact Sales
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default CpanelHosting;
