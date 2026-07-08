import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Home, Globe, Server, Cpu, Database } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/"
            activeProps={{ className: "text-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground transition" }}
          >
            Home
          </Link>
          <a
            href="https://portal.carrothost.com/cart.php?a=add&domain=register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition"
          >
            Domains
          </a>
          <Link
            to="/hosting"
            activeProps={{ className: "text-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground transition" }}
          >
            Hosting
          </Link>
          <Link
            to="/bdix-cloud-vps"
            activeProps={{ className: "text-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground transition" }}
          >
            BDIX VPS
          </Link>
          <Link
            to="/xeon-cloud-vps"
            activeProps={{ className: "text-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground transition" }}
          >
            Xeon VPS
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            hash="login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            Client Login <ArrowRight className="h-4 w-4" />
          </Link>
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-6 py-5 space-y-4 shadow-elegant animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Navigation</span>
          </div>
          <div className="grid gap-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-accent/50 active:bg-accent/70 hover:text-brand-orange transition-all duration-200"
            >
              <Home className="h-4.5 w-4.5 text-muted-foreground" />
              <span>Home</span>
            </Link>
            <a
              href="https://portal.carrothost.com/cart.php?a=add&domain=register"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-accent/50 active:bg-accent/70 hover:text-brand-orange transition-all duration-200"
            >
              <Globe className="h-4.5 w-4.5 text-muted-foreground" />
              <span>Domains</span>
            </a>
            <Link
              to="/hosting"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-accent/50 active:bg-accent/70 hover:text-brand-orange transition-all duration-200"
            >
              <Server className="h-4.5 w-4.5 text-muted-foreground" />
              <span>Hosting</span>
            </Link>
            <Link
              to="/bdix-cloud-vps"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-accent/50 active:bg-accent/70 hover:text-brand-orange transition-all duration-200"
            >
              <Cpu className="h-4.5 w-4.5 text-muted-foreground" />
              <span>BDIX VPS</span>
            </Link>
            <Link
              to="/xeon-cloud-vps"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-accent/50 active:bg-accent/70 hover:text-brand-orange transition-all duration-200"
            >
              <Database className="h-4.5 w-4.5 text-muted-foreground" />
              <span>Xeon VPS</span>
            </Link>
          </div>
          <div className="pt-3 border-t border-border/40">
            <Link
              to="/"
              hash="login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-brand w-full py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-105 active:brightness-95 transition-all duration-200"
            >
              Client Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
