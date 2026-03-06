import { motion } from "framer-motion";
import { Check, Sparkles, ShoppingCart } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$4",
    period: "/mo",
    description: "Perfect for personal projects and small websites",
    features: [
      "1 Website",
      "10 GB NVMe Storage",
      "Free SSL Certificate",
      "Weekly Backups",
      "1 Email Account",
      "Standard Support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Business",
    price: "$12",
    period: "/mo",
    description: "Ideal for growing businesses and high-traffic sites",
    features: [
      "Unlimited Websites",
      "100 GB NVMe Storage",
      "Free SSL & CDN",
      "Daily Backups",
      "Unlimited Email",
      "Priority 24/7 Support",
      "Staging Environment",
      "Free Domain (1 year)",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$39",
    period: "/mo",
    description: "Maximum performance with dedicated resources",
    features: [
      "Unlimited Websites",
      "500 GB NVMe Storage",
      "Advanced Caching",
      "Real-time Backups",
      "Dedicated IP",
      "White-glove Onboarding",
      "Custom Firewall Rules",
      "SLA Guarantee",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="section-spacing relative overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] bg-primary/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-gradient">
            Plans That Scale With You
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No hidden fees. No surprises. Start free and upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-2xl p-6 md:p-8 flex flex-col relative ${
                plan.featured
                  ? "card-featured md:scale-105 md:-my-4"
                  : "card-premium"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl md:text-5xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-base">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-secondary-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 ${
                  plan.featured
                    ? "btn-glow text-primary-foreground"
                    : "bg-secondary border border-border text-foreground hover:bg-card-hover"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Order Now
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
