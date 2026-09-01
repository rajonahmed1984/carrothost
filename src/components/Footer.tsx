import { Link } from "@tanstack/react-router";

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
              <li><Link to="/system-status" className="hover:text-brand-orange transition">System Status</Link></li>
              <li><Link to="/migrate-to-us" className="hover:text-brand-orange transition">Migrate to Us</Link></li>
              <li><Link to="/wordpress-plugin" className="hover:text-brand-orange transition">WordPress Plugin</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">We Accept</h4>
            <img src="/payments.webp" alt="Accepted Payments" width={300} height={149} className="h-auto w-auto opacity-95 hover:opacity-100 transition dark:brightness-95" />
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/60 text-xs md:text-sm text-muted-foreground flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            {/* Facebook Button */}
            <a
              href="https://www.facebook.com/carrothost"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md hover:shadow-[#1877F2]/40 active:scale-95"
              aria-label="Facebook"
            >
              <svg className="h-4 w-4 fill-white transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* YouTube Button */}
            <a
              href="https://youtube.com/@carrothost999"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF0000] text-white shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md hover:shadow-[#FF0000]/40 active:scale-95"
              aria-label="YouTube"
            >
              <svg className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-1.022 1.762-1.995 2.019C17.785 20 12 20 12 20s-5.785 0-7.548-.479c-.973-.257-1.74-1.034-1.995-2.019C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985 1.022-1.762 1.995-2.019C6.215 4 12 4 12 4s5.785 0 7.548.479c.973.257 1.74 1.034 1.995 2.019zM9.75 8.75v6.5l5.5-3.25-5.5-3.25z"
                  fill="#FFFFFF"
                />
              </svg>
            </a>

            {/* DMCA Badge */}
            <a
              href="/dmca-validation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-105 hover:opacity-95 active:scale-95 ml-1"
              aria-label="DMCA Protection"
            >
              <img src="/DMCA_logo-grn-btn.png" alt="DMCA Protection Status" width={100} height={36} className="h-6 w-auto" />
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} Carrothost All Rights Reserved. An{" "}
            <a href="https://apptimatic.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-orange hover:text-brand-green transition-colors">
              Apptimatic
            </a>{" "}
            company
          </p>
        </div>
      </div>
    </footer>
  );
}
