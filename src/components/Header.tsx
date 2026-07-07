import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
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
          <Link
            to="/"
            hash="login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            Client Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
