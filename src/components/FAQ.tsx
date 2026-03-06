import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Can I migrate my existing website for free?",
    answer: "Absolutely. Our team handles the entire migration process at no extra cost. We support WordPress, custom apps, cPanel, and more. Average migration time is under 2 hours with zero downtime.",
  },
  {
    question: "What happens if I exceed my storage or bandwidth?",
    answer: "We don't shut you down. You'll receive a notification and can upgrade your plan instantly. Business and Enterprise plans come with generous overage buffers so you're never caught off guard.",
  },
  {
    question: "Do you offer a money-back guarantee?",
    answer: "Yes, all plans include a 30-day money-back guarantee. If you're not completely satisfied, we'll refund your payment — no questions asked.",
  },
  {
    question: "How does your uptime guarantee work?",
    answer: "We guarantee 99.99% uptime backed by our SLA. If we fall below that threshold in any given month, you'll automatically receive account credits proportional to the downtime.",
  },
  {
    question: "Can I host multiple domains on one plan?",
    answer: "Business and Enterprise plans support unlimited websites and domains. Starter plans are limited to one site but can be upgraded at any time with a single click.",
  },
  {
    question: "What security measures do you provide?",
    answer: "Every plan includes free SSL, a web application firewall, brute-force protection, and malware scanning. Enterprise plans add custom firewall rules, dedicated IPs, and DDoS mitigation.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="section-spacing relative">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-gradient">
            Common Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="card-premium rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left"
              >
                <span className="font-medium text-foreground text-sm md:text-base pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
