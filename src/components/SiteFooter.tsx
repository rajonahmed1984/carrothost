import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Facebook,
  Linkedin,
  Youtube,
  Headphones,
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
      { label: "Register Domain", href: "https://portal.carrothost.com/cart.php?a=add&domain=register" },
      { label: "Transfer Domain", href: "https://portal.carrothost.com/cart.php?a=add&domain=transfer" },
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

const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

const FooterLinkItem = ({ link }: { link: FooterLink }) => {
  const inner = (
    <span className="text-[13.5px] text-footer-foreground/65 transition-colors duration-200 leading-none hover:text-footer-heading">
      {link.label}
    </span>
  );

  return link.isRoute ? <Link to={link.href}>{inner}</Link> : <a href={link.href}>{inner}</a>;
};

const SiteFooter = () => {
  return (
    <footer className="relative overflow-hidden bg-footer text-footer-foreground border-t-4 border-orange-500">
      <div className="container relative z-10">
        <div className="border-t border-footer-border/40" />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-14 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:pr-12">
            <Link to="/" className="group mb-5 inline-flex items-center">
              <img
                src={logoSrc}
                alt="Carrothost logo"
                className="h-11 w-auto shrink-0 object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-footer-foreground/65">
              Premium web hosting in Bangladesh with NVMe SSD hosting, cPanel hosting, Webuzo hosting, Xeon VPS, and BDIX VPS built for businesses, developers, and growing websites.
            </p>

            <div className="mb-6 space-y-2.5">
              {[
                { icon: Mail, text: "support@carrothost.com.bd" },
                { icon: Phone, text: "+880 1700-000000" },
                { icon: MapPin, text: "Dhaka, Bangladesh" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-[13px] text-footer-foreground/55">
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-footer-border/30 text-footer-foreground/50 transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-7">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="mb-4 text-[12px] font-bold uppercase tracking-[0.12em] text-footer-heading/70">
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

        <div className="flex flex-col items-center justify-between gap-3 border-t border-footer-border/30 py-6 sm:flex-row">
          <p className="text-[12px] text-footer-foreground/40">
            Copyright 2026 Carrothost. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "SLA"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[12px] text-footer-foreground/40 transition-colors hover:text-footer-heading/70"
              >
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
