import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Carrot, Sparkles, Phone, ArrowUpRight, Bot } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  actionLink?: { label: string; url: string; external?: boolean };
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Hi there! 🥕 I am your CarrotHost AI assistant. I can help you choose the best hosting plan, compare BDIX and Xeon VPS, or set up Google Tag Manager (GTM) Server-Side Tracking. What are you looking to host today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const quickReplies = [
    { label: "⚡ GTM Tracking Hosting", query: "gtm tracking" },
    { label: "🇧🇩 BDIX VPS Plans", query: "bdix vps" },
    { label: "🚀 Xeon VPS Plans", query: "xeon cloud vps" },
    { label: "🌐 Domain Registration", query: "domains" },
    { label: "📞 Support Hotline", query: "support" },
  ];

  const getAIResponse = (query: string): { text: string; actionLink?: { label: string; url: string; external?: boolean } } => {
    const text = query.toLowerCase();

    if (text.includes("gtm") || text.includes("tracking") || text.includes("server-side")) {
      return {
        text: "Our Shared Webuzo Hosting is optimized for Google Tag Manager (GTM) Server-Side Tracking! We removed heavy Node.js processes and implemented tracking proxies directly in Nginx. This lets you track 100% of customer journeys with zero RAM drain.",
        actionLink: { label: "View Shared Hosting", url: "/hosting" }
      };
    }

    if (text.includes("bdix") || text.includes("local") || text.includes("bangladesh")) {
      return {
        text: "Our BDIX VPS servers are located in a Tier-III data center in Dhaka, offering ultra-low sub-10ms latency to local visitors. Plans start from ৳1,550/mo with full root access and KVM virtualization.",
        actionLink: { label: "View BDIX VPS Plans", url: "/bdix-cloud-vps" }
      };
    }

    if (text.includes("xeon") || text.includes("intel") || text.includes("webdock")) {
      return {
        text: "Our Xeon Cloud VPS uses high-end Intel Xeon Platinum processors coupled with the Webdock management dashboard (visual reboot, rebuild, transactional emails). Plans start from only ৳607/mo (NVMe Nano4) up to 30 threads and 64 GB RAM.",
        actionLink: { label: "View Xeon VPS Plans", url: "/xeon-cloud-vps" }
      };
    }

    if (text.includes("hosting") || text.includes("shared") || text.includes("webuzo")) {
      return {
        text: "We offer next-gen Webuzo Shared Hosting optimized from the Linux kernel level up to handle high traffic and Flash Sales easily. Plans:\n• Starter: ৳4,200/yr\n• Standard: ৳8,400/yr\n• Advanced: ৳12,000/yr.",
        actionLink: { label: "Explore Shared Hosting", url: "/hosting" }
      };
    }

    if (text.includes("vps") || text.includes("vps compare")) {
      return {
        text: "We offer two types of virtual servers:\n1. BDIX VPS: Located in Dhaka for sub-10ms latency to Bangladeshi visitors.\n2. Xeon VPS: Global high-performance virtual nodes powered by Intel Xeon Platinum, featuring Webdock's custom dashboard.",
        actionLink: { label: "Compare BDIX VPS", url: "/bdix-cloud-vps" }
      };
    }

    if (text.includes("domain") || text.includes("register") || text.includes("search")) {
      return {
        text: "You can register .com (৳1,190/yr), .net, .xyz, and .com.bd (৳1,800/yr) domains instantly. DNS management is completely free.",
        actionLink: { label: "Register Domain Now", url: "https://portal.carrothost.com/cart.php?a=add&domain=register", external: true }
      };
    }

    if (text.includes("support") || text.includes("phone") || text.includes("contact") || text.includes("whatsapp") || text.includes("number")) {
      return {
        text: "We offer 24/7 Bangla & English support! You can reach our sales and technical engineers directly by calling or messaging our hotline.",
        actionLink: { label: "Call Hotline: 01787-882277", url: "tel:01787882277", external: true }
      };
    }

    return {
      text: "I want to make sure you get the right info! I can explain GTM Server-Side tracking, compare BDIX/Xeon VPS, or check domain prices. Alternatively, you can speak directly with our team at 01787-882277.",
      actionLink: { label: "Talk to Sales on WhatsApp", url: "https://wa.me/8801787882277", external: true }
    };
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newUserMessage: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const response = getAIResponse(textToSend);
      const botResponse: Message = {
        sender: "bot",
        text: response.text,
        timestamp: new Date(),
        actionLink: response.actionLink,
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <div className="absolute bottom-16 right-0 p-2 bg-brand-green/20 rounded-full shadow-soft hover:scale-105 transition-all duration-300 animate-bounce">
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-white shadow-elegant active:scale-95 transition-all duration-200 relative group"
            aria-label="Open AI Assistant"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute right-16 scale-0 group-hover:scale-100 bg-card border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded-xl shadow-soft transition-all duration-200 whitespace-nowrap">
              Need Help? Chat with AI 🤖
            </span>
          </button>
        </div>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[500px] rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-elegant flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Top Bar Header */}
          <div className="bg-gradient-brand px-5 py-4 flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white relative">
                <Carrot className="h-6 w-6 -rotate-45" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-brand-green border border-white" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  Carrot AI Assistant
                  <Sparkles className="h-3.5 w-3.5 text-brand-green animate-pulse" />
                </div>
                <div className="text-[10px] opacity-90">Always online · 24/7 Support</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 p-1.5 rounded-lg transition"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Logs Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/15">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
              >
                {msg.sender === "bot" && (
                  <div className="h-8 w-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 border border-brand-orange/20">
                    <Carrot className="h-4.5 w-4.5 -rotate-45" />
                  </div>
                )}
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft whitespace-pre-line ${
                      msg.sender === "user"
                        ? "bg-gradient-brand text-primary-foreground rounded-tr-none"
                        : "bg-card border border-border text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.actionLink && (
                    <div className="flex">
                      {msg.actionLink.external ? (
                        <a
                          href={msg.actionLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-primary-foreground text-xs font-bold px-3.5 py-2 transition"
                        >
                          {msg.actionLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <a
                          href={msg.actionLink.url}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-primary-foreground text-xs font-bold px-3.5 py-2 transition"
                        >
                          {msg.actionLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 border border-brand-orange/20">
                  <Carrot className="h-4.5 w-4.5 -rotate-45" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3.5 shadow-soft flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies block */}
          {messages.length < 5 && (
            <div className="px-4 py-2 bg-secondary/15 flex flex-wrap gap-1.5 border-t border-border/40">
              {quickReplies.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleSendMessage(qr.query)}
                  className="rounded-full border border-border bg-card hover:border-brand-orange hover:text-brand-orange transition text-[11px] font-semibold px-2.5 py-1"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Form input area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3.5 border-t border-border flex items-center gap-2 bg-card"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about our services..."
              className="flex-1 bg-secondary/55 text-foreground text-sm rounded-xl px-4 py-2.5 border border-border/80 focus:outline-none focus:border-brand-orange/80 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none shrink-0"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
