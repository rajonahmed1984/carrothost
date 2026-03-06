import { motion } from "framer-motion";
import { Server, Shield, Zap, Globe, Clock, Headphones } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "NVMe SSD storage with LiteSpeed servers deliver sub-second load times for your visitors.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Free SSL, DDoS protection, and daily backups keep your data safe around the clock.",
  },
  {
    icon: Server,
    title: "99.99% Uptime",
    description: "Redundant infrastructure across multiple data centers guarantees maximum availability.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    description: "Content delivered from 200+ edge locations worldwide for lightning-fast global access.",
  },
  {
    icon: Clock,
    title: "Instant Setup",
    description: "One-click installs for WordPress, Node.js, Python, and 100+ other platforms.",
  },
  {
    icon: Headphones,
    title: "24/7 Expert Support",
    description: "Our hosting specialists are available around the clock via chat, phone, and email.",
  },
];

const Features = () => {
  return (
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
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-gradient">
            Built for Performance
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to host, scale, and secure your online presence — without compromise.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="card-premium rounded-xl p-6 md:p-8 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
