import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  RefreshCw,
  Server,
  HardDrive,
  Cpu,
  Network,
  LogIn,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface SubItem {
  label: string;
  href: string;
  icon: React.ElementType;
  tag?: string;
  description: string;
  isRoute?: boolean;
}

interface NavItem {
  label: string;
  href?: string;
  isRoute?: boolean;
  children?: SubItem[];
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", isRoute: true },
  {
    label: "Domains",
    children: [
      { label: "Register Domain", href: "#", icon: Globe, description: "Find and register your perfect .com, .net, .xyz & more" },
      { label: "Transfer Domain", href: "#", icon: RefreshCw, description: "Move your existing domain to us — free & seamless" },
    ],
  },
  {
    label: "Web Hosting",
    children: [
      { label: "Webuzo Hosting", href: "/webuzo-hosting", icon: Server, tag: "Popular", description: "One-click app deployment with 400+ scripts", isRoute: true },
      { label: "cPanel Hosting", href: "/cpanel-hosting", icon: HardDrive, description: "Full-featured cPanel with LiteSpeed & NVMe", isRoute: true },
    ],
  },
  {
    label: "VPS Servers",
    children: [
      { label: "Xeon VPS", href: "/xeon-vps", icon: Cpu, description: "Enterprise Xeon processors with dedicated resources", isRoute: true },
      { label: "BDIX VPS", href: "/bdix-vps", icon: Network, tag: "Fast", description: "Ultra-low latency BDIX peering for Bangladesh", isRoute: true },
    ],
  },
];

const SiteNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const location = useLocation();
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileAccordion(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (item: NavItem): boolean => {
    if (item.href && item.isRoute) return location.pathname === item.href;
    if (item.children) return item.children.some((c) => c.isRoute && location.pathname === c.href);
    return false;
  };

  const isSubActive = (href: string, isRoute?: boolean) => isRoute && location.pathname === href;

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-card/[0.98] backdrop-blur-2xl border-b border-border/50"
            : "bg-card/70 backdrop-blur-md"
        }`}
        style={{
          boxShadow: isScrolled
            ? "0 1px 0 hsl(215 20% 90% / 0.5), 0 4px 20px hsl(220 25% 12% / 0.03)"
            : "none",
        }}
      >
        <div className="container flex items-center justify-between h-16 lg:h-[4.5rem]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
              <span className="text-primary-foreground font-extrabold text-xs">HF</span>
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight hidden sm:block">HostFlow</span>
          </Link>

          {/* Desktop Nav — centered */}
          <div className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && handleMouseEnter(item.label)}
                onMouseLeave={() => item.children && handleMouseLeave()}
              >
                {item.href && item.isRoute ? (
                  <Link
                    to={item.href}
                    className={`relative flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item)
                        ? "text-primary"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {isActive(item) && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-primary rounded-full"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                  </Link>
                ) : (
                  <button
                    className={`relative flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item) || openDropdown === item.label
                        ? "text-primary"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                    onFocus={() => item.children && setOpenDropdown(item.label)}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {item.children && (
                      <ChevronDown
                        className={`relative z-10 w-3.5 h-3.5 transition-transform duration-300 ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    )}
                    {isActive(item) && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-primary rounded-full"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                  </button>
                )}

                {/* Desktop Dropdown */}
                <AnimatePresence>
                  {item.children && openDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[340px] bg-card rounded-2xl border border-border/70 p-1.5 z-50"
                      style={{
                        boxShadow: "0 16px 48px hsl(220 25% 12% / 0.1), 0 2px 8px hsl(220 25% 12% / 0.05)",
                      }}
                    >
                      {/* Dropdown header */}
                      <div className="px-3 pt-2 pb-2 mb-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {item.label}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {item.children.map((sub) => {
                          const Icon = sub.icon;
                          const active = isSubActive(sub.href, sub.isRoute);
                          const content = (
                            <div
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                                active ? "bg-primary/[0.06]" : "hover:bg-muted/50"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  active
                                    ? "bg-primary/12 text-primary"
                                    : "bg-muted/70 text-muted-foreground group-hover:bg-primary/8 group-hover:text-primary"
                                }`}
                              >
                                <Icon className="w-[18px] h-[18px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[13px] font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                                    {sub.label}
                                  </span>
                                  {sub.tag && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-accent/10 text-accent leading-none">
                                      {sub.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{sub.description}</div>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${
                                active ? "text-primary/40" : "text-muted-foreground/0 group-hover:text-muted-foreground/40"
                              }`} />
                            </div>
                          );
                          return sub.isRoute ? (
                            <Link key={sub.label} to={sub.href} onClick={() => setOpenDropdown(null)}>{content}</Link>
                          ) : (
                            <a key={sub.label} href={sub.href} onClick={() => setOpenDropdown(null)}>{content}</a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Client Area
            </a>
            <Link
              to="/webuzo-hosting"
              className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-foreground/5 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-16 left-0 right-0 z-50 lg:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto"
            >
              <div className="bg-card/[0.99] backdrop-blur-xl border-b border-border/50 shadow-xl">
                <div className="container py-4">
                  {/* Nav items */}
                  <div className="space-y-0.5">
                    {navItems.map((item) => (
                      <div key={item.label}>
                        {item.href && item.isRoute ? (
                          <Link
                            to={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                              isActive(item)
                                ? "text-primary bg-primary/[0.05]"
                                : "text-foreground active:bg-muted/50"
                            }`}
                          >
                            {item.label}
                            {isActive(item) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={() => setMobileAccordion(mobileAccordion === item.label ? null : item.label)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                                isActive(item) || mobileAccordion === item.label
                                  ? "text-primary bg-primary/[0.05]"
                                  : "text-foreground active:bg-muted/50"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {item.label}
                                {isActive(item) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                              </span>
                              <motion.div
                                animate={{ rotate: mobileAccordion === item.label ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            </button>

                            <AnimatePresence>
                              {mobileAccordion === item.label && item.children && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mx-2 mt-1 mb-2 space-y-1 border-l-2 border-primary/10 pl-3">
                                    {item.children.map((sub) => {
                                      const Icon = sub.icon;
                                      const active = isSubActive(sub.href, sub.isRoute);
                                      const inner = (
                                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                          active ? "bg-primary/[0.06]" : "active:bg-muted/40"
                                        }`}>
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            active ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
                                          }`}>
                                            <Icon className="w-4 h-4" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className={`text-[13px] font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                                                {sub.label}
                                              </span>
                                              {sub.tag && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                                                  {sub.tag}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">{sub.description}</span>
                                          </div>
                                        </div>
                                      );
                                      return sub.isRoute ? (
                                        <Link key={sub.label} to={sub.href}>{inner}</Link>
                                      ) : (
                                        <a key={sub.label} href={sub.href}>{inner}</a>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mobile CTAs */}
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-2">
                    <a
                      href="#"
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-border bg-card text-foreground active:bg-muted/50 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Client Area
                    </a>
                    <Link
                      to="/webuzo-hosting"
                      className="btn-primary flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
                    >
                      <Sparkles className="w-4 h-4" />
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SiteNavbar;
