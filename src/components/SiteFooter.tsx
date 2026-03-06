import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Facebook,
  Linkedin,
  Youtube,
  Headphones,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  isRoute?: boolean;
}

const footerSections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Products",
    links: [
      { label: "Webuzo Hosting", href: "/webuzo-hosting", isRoute: true },
      { label: "cPanel Hosting", href: "/cpanel-hosting", isRoute: true },
      { label: "Xeon VPS", href: "/xeon-vps", isRoute: true },
      { label: "BDIX VPS", href: "/bdix-vps", isRoute: true },
      { label: "Register Domain", href: "#" },
      { label: "Transfer Domain", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Client Area", href: "#" },
      { label: "Open Ticket", href: "#" },
      { label: "Knowledge Base", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Server Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

const socials = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const FooterLinkItem = ({ link }: { link: FooterLink }) => {
  const inner = (
    <span className="text-[13.5px] text-footer-foreground/65 hover:text-footer-heading transition-colors duration-200 leading-none">
      {link.label}
    </span>
  );
  return link.isRoute ? (
    <Link to={link.href}>{inner}</Link>
  ) : (
    <a href={link.href}>{inner}</a>
  );
};

const SiteFooter = () => {
  return (
    <footer className="bg-footer text-footer-foreground relative overflow-hidden">
      {/* CTA Section */}
      <div className="container relative z-10 pt-16 md:pt-24 pb-14 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-footer-border/40 p-8 md:p-14 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(215 90% 52% / 0.12) 0%, hsl(25 95% 53% / 0.06) 60%, transparent 100%)",
          }}
        >
          <div className="glow-orb w-[350px] h-[350px] bg-primary/8 -top-28 -right-28 absolute" />
          <div className="glow-orb w-[200px] h-[200px] bg-accent/6 -bottom-12 -left-12 absolute" />

          <div className="relative z-10 max-w-lg mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-footer-heading mb-3 tracking-tight">
              Launch Your Website Today
            </h2>
            <p className="text-footer-foreground/80 text-base md:text-lg mb-8 leading-relaxed">
              Trusted by thousands of businesses across Bangladesh. Start with a free trial — no credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/webuzo-hosting"
                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[15px]"
              >
                <Sparkles className="w-4 h-4" />
                Get Started Free
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-footer-border/60 text-footer-heading/90 font-medium text-[15px] hover:bg-footer-border/15 transition-all duration-200"
              >
                <Headphones className="w-4 h-4" />
                Talk to Sales
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Grid */}
      <div className="container relative z-10">
        <div className="border-t border-footer-border/40" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-10 gap-x-8 py-14">
          {/* Brand Column */}
          <div className="lg:col-span-5 lg:pr-12">
            <Link to="/" className="inline-flex items-center gap-2 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center group-hover:shadow-md transition-all">
                <span className="text-primary-foreground font-extrabold text-xs">HF</span>
              </div>
              <span className="font-bold text-footer-heading text-lg tracking-tight">HostFlow</span>
            </Link>
            <p className="text-sm text-footer-foreground/65 leading-relaxed mb-6 max-w-sm">
              Premium web hosting, domain registration, and high-performance VPS solutions built for businesses, developers, and growing websites in Bangladesh.
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                { icon: Mail, text: "support@hostflow.com.bd" },
                { icon: Phone, text: "+880 1700-000000" },
                { icon: MapPin, text: "Dhaka, Bangladesh" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-[13px] text-footer-foreground/55">
                  <item.icon className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-footer-border/30 flex items-center justify-center text-footer-foreground/50 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-6">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-footer-heading/70 mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-footer-border/30 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-footer-foreground/40">
            © 2025 HostFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "SLA"].map((item) => (
              <a key={item} href="#" className="text-[12px] text-footer-foreground/40 hover:text-footer-heading/70 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
