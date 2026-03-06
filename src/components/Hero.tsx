import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="glow-orb w-[600px] h-[600px] bg-primary/5 -top-40 -right-40 absolute" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent/5 bottom-0 -left-20 absolute animate-pulse-glow" />

      <div className="container relative z-10 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            All systems operational — 99.99% uptime
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6">
            <span className="text-foreground">Web Hosting</span>
            <br />
            <span className="text-gradient">That Just Works.</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Ultra-fast servers, enterprise-grade security, and one-click deploys.
            From startups to scale — your infrastructure, simplified.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-glow px-8 py-4 rounded-xl text-primary-foreground font-semibold text-base flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold text-base flex items-center gap-2 hover:bg-secondary transition-colors w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </motion.a>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: "50K+", label: "Active Sites" },
              { value: "99.99%", label: "Uptime SLA" },
              { value: "<200ms", label: "Avg Response" },
              { value: "24/7", label: "Expert Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
