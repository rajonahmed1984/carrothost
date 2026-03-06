import { motion } from "framer-motion";
import { ArrowRight, Headphones } from "lucide-react";

const Footer = () => {
  const links = {
    Product: ["Shared Hosting", "VPS Hosting", "Cloud Hosting", "WordPress Hosting", "Dedicated Servers"],
    Company: ["About Us", "Careers", "Blog", "Press Kit", "Partners"],
    Resources: ["Documentation", "API Reference", "Status Page", "Community", "Tutorials"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "SLA"],
  };

  return (
    <footer className="relative border-t border-border">
      {/* CTA Banner */}
      <div className="section-spacing">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-featured rounded-2xl p-8 md:p-14 text-center relative overflow-hidden"
          >
            <div className="glow-orb w-[300px] h-[300px] bg-primary/8 -top-20 -right-20 absolute" />
            <div className="glow-orb w-[200px] h-[200px] bg-accent/5 bottom-0 left-0 absolute" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Launch?
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8">
                Join 50,000+ websites powered by our infrastructure. Start with a free trial — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  href="#pricing"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl text-primary-foreground font-semibold text-base"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border bg-card text-foreground font-semibold text-base hover:border-primary/30 transition-colors"
                >
                  <Headphones className="w-4 h-4" />
                  Contact Support
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer links */}
      <div className="container pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-foreground">HostFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 HostFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
