import { Link } from "@tanstack/react-router";
import { Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <h4 className="font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/hosting" className="hover:text-brand-orange transition">Shared Hosting</Link></li>
              <li><Link to="/bdix-cloud-vps" className="hover:text-brand-orange transition">BDIX VPS</Link></li>
              <li><Link to="/xeon-cloud-vps" className="hover:text-brand-orange transition">Xeon VPS</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/about-us" className="hover:text-brand-orange transition">About Us</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-brand-orange transition">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-brand-orange transition">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/whois" className="hover:text-brand-orange transition">WHOIS & DNS Check</Link></li>
              <li><Link to="/" className="hover:text-brand-orange transition">System Status</Link></li>
              <li><Link to="/" className="hover:text-brand-orange transition">Migrate to Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Accept and Social</h4>
            <img src="/payments.webp" alt="Accepted Payments" width={300} height={149} className="h-auto w-auto opacity-95 hover:opacity-100 transition dark:brightness-95" />
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.facebook.com/carrothost"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-secondary/80 text-muted-foreground hover:text-brand-orange hover:bg-secondary hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://youtube.com/@carrothost999"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-secondary/80 text-muted-foreground hover:text-brand-orange hover:bg-secondary hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="YouTube"
              >
                <Youtube className="h-4.5 w-4.5" />
              </a>
              <a href="/dmca-validation.html" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                <img src="/DMCA_logo-grn-btn.png" alt="DMCA Protection Status" width={100} height={36} className="h-5 w-auto" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-4 border-t border-border/60 text-xs md:text-sm text-muted-foreground flex flex-col items-center justify-center gap-4 text-center">
          <p>
            © {new Date().getFullYear()} Carrothost All Rights Reserved. An{" "}
            <a href="https://apptimatic.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
              Apptimatic
            </a>{" "}
            company
          </p>
        </div>
      </div>
    </footer>
  );
}
