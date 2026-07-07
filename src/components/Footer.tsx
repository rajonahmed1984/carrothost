import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Bangladesh's trusted partner for domain registration and premium web hosting. BDIX-optimized, locally supported, and built to scale.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="https://portal.carrothost.com/cart.php?a=add&domain=register" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition">Domain Registration</a></li>
              <li><Link to="/hosting" className="hover:text-brand-orange transition">Shared Hosting</Link></li>
              <li><Link to="/bdix-cloud-vps" className="hover:text-brand-orange transition">BDIX VPS</Link></li>
              <li><Link to="/xeon-cloud-vps" className="hover:text-brand-orange transition">Xeon VPS</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" hash="why" className="hover:text-brand-orange transition">About Us</Link></li>
              <li><Link to="/" hash="why" className="hover:text-brand-orange transition">Careers</Link></li>
              <li><Link to="/" className="hover:text-brand-orange transition">Terms of Service</Link></li>
              <li><Link to="/" className="hover:text-brand-orange transition">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-brand-orange transition">Help Center</Link></li>
              <li><Link to="/" className="hover:text-brand-orange transition">System Status</Link></li>
              <li><Link to="/" className="hover:text-brand-orange transition">Migrate to Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CarrotHost. All rights reserved. Dhaka, Bangladesh.</p>
          <div className="flex items-center gap-4">
            <span>Accepts bKash · Nagad · Visa · Mastercard</span>
            <span className="h-4 w-px bg-border" />
            <a href="/dmca-validation.html" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
              <img src="/DMCA_logo-grn-btn.png" alt="DMCA Protection Status" className="h-5 w-auto" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
