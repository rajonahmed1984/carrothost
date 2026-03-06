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
      <div className="section-spacing">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-featured relative overflow-hidden rounded-2xl p-8 text-center md:p-14"
          >
            <div className="glow-orb absolute -right-20 -top-20 h-[300px] w-[300px] bg-primary/8" />
            <div className="glow-orb absolute bottom-0 left-0 h-[200px] w-[200px] bg-accent/5" />
            <div className="relative z-10">
              <h2 className="mb-4 text-2xl font-bold text-foreground md:text-4xl">Ready to Launch?</h2>
              <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground md:text-lg">
                Join 50,000+ websites powered by our infrastructure. Start with a free trial and scale on reliable hosting.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <motion.a
                  href="#pricing"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-glow inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-primary-foreground"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold text-foreground transition-colors hover:border-primary/30"
                >
                  <Headphones className="h-4 w-4" />
                  Contact Support
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container pb-12">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-semibold text-foreground">Carrothost</span>
          </div>
          <p className="text-sm text-muted-foreground">Copyright 2026 Carrothost. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
