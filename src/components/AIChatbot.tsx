import { useState, useEffect, useRef } from "react";
import { X, Send, Carrot, Sparkles, ArrowUpRight, Bot, HelpCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { chatResponseFn } from "../lib/chat";

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
  const [isThinking, setIsThinking] = useState(false);
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
  }, [messages, isThinking]);

  const quickReplies = [
    { label: "⚡ GTM Tracking Hosting", query: "Can you explain GTM Server-Side tracking?" },
    { label: "🇧🇩 BDIX VPS Plans", query: "Tell me about your BDIX VPS plans." },
    { label: "🚀 Xeon VPS Plans", query: "What are the Xeon VPS plans?" },
    { label: "🌐 Domain Registration", query: "How do I register a domain?" },
    { label: "📞 Support Hotline", query: "How do I contact support?" },
  ];

  // Helper to parse markdown links: [label](url)
  const renderMessageText = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      const isExternal = url.startsWith("http") || url.startsWith("tel:");

      parts.push(
        isExternal ? (
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5"
          >
            {label} <ArrowUpRight className="h-3 w-3.5 inline shrink-0" />
          </a>
        ) : (
          <Link
            key={match.index}
            to={url as any}
            className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5"
          >
            {label} <ArrowUpRight className="h-3 w-3.5 inline shrink-0" />
          </Link>
        )
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Frontend interceptor for domain pricing, availability, and renewals
  const isDomainQuery = (text: string): boolean => {
    const lower = text.toLowerCase();
    
    // Domain keywords
    const domainKeywords = ["domain", "ডোমেইন", "ডোমেন", "tld", "tlds"];
    const tlds = [".com", ".net", ".org", ".info", ".xyz", ".bd", ".co", ".com.bd", ".net.bd"];
    
    // Query intent keywords
    const intentKeywords = [
      "price", "cost", "pricing", "dam", "koto", "taka", "tk", "টাকা", "দাম", "কত", 
      "register", "registration", "buy", "purchase", "renew", "renewal", "check", 
      "avail", "available", "availability", "search", "বুক", "বুকিং", "খুজ", "খোঁজ"
    ];

    // Check if user is asking about domain pricing or registration
    const hasDomainWord = domainKeywords.some(keyword => lower.includes(keyword));
    const hasTld = tlds.some(tld => lower.includes(tld));
    const hasIntent = intentKeywords.some(intent => lower.includes(intent));

    // If they ask about domain generally with pricing/registration intent
    if (hasDomainWord && hasIntent) {
      return true;
    }

    // If they mention a TLD directly with pricing/registration intent (e.g., ".com price")
    if (hasTld && hasIntent) {
      return true;
    }

    // Direct phrases like "how much for .com", "price of domain"
    if (lower.includes("how much") && (hasDomainWord || hasTld)) {
      return true;
    }

    return false;
  };

  // Legacy static AI response fallback (retained for resilience if API call fails)
  const getAIResponseFallback = (query: string): { text: string; actionLink?: { label: string; url: string; external?: boolean } } => {
    const text = query.toLowerCase();

    if (
      text.includes("price") ||
      text.includes("dam") ||
      text.includes("koto") ||
      text.includes("tk") ||
      text.includes("taka") ||
      text.includes("payment") ||
      text.includes("bkash") ||
      text.includes("nagad") ||
      text.includes("rocket")
    ) {
      return {
        text: "We support bKash, Nagad, Rocket, bank transfers, and credit cards.\n\nOur service prices:\n• Shared Hosting: from ৳4,200/year\n• BDIX VPS: from ৳1,550/month\n• Xeon Cloud VPS: from ৳607/month\nFor domain pricing, check the domain portal.",
        actionLink: { label: "View Hosting Plans", url: "/hosting" }
      };
    }

    if (text.includes("gtm") || text.includes("tracking") || text.includes("server-side")) {
      return {
        text: "Our Webuzo Shared Hosting features standard Node-free Google Tag Manager (GTM) Server-Side tracking proxies via Nginx configuration, bypassing ad-blockers and preventing data loss.",
        actionLink: { label: "Shared Hosting Plans", url: "/hosting" }
      };
    }

    if (text.includes("bdix") || text.includes("local") || text.includes("dhaka") || text.includes("ping")) {
      return {
        text: "BDIX VPS servers are located in a Tier-III facility in Dhanmondi, Dhaka. They provide ultra-low latency (<10ms) network speeds for visitors in Bangladesh.",
        actionLink: { label: "BDIX VPS Plans", url: "/bdix-cloud-vps" }
      };
    }

    if (text.includes("xeon") || text.includes("intel") || text.includes("webdock")) {
      return {
        text: "Xeon Cloud VPS servers utilize Intel Xeon Platinum processors and integrate the Webdock dashboard for easy node management and OS rebuilds.",
        actionLink: { label: "Xeon VPS Plans", url: "/xeon-cloud-vps" }
      };
    }

    if (text.includes("support") || text.includes("phone") || text.includes("contact") || text.includes("whatsapp")) {
      return {
        text: "Our support is available 24/7/365. Reach us at:\n• Phone/WhatsApp: 01787-882277\n• Email: support@carrothost.com",
        actionLink: { label: "Submit Ticket", url: "https://portal.carrothost.com/submitticket.php", external: true }
      };
    }

    return {
      text: "I can help you select a hosting plan, set up GTM tracking, or explain BDIX/Xeon VPS nodes. How can I help you today?",
      actionLink: { label: "Contact Support", url: "https://wa.me/8801787882277", external: true }
    };
  };

  const respondToUser = async (currentMessages: Message[], lastMessageText: string) => {
    setIsThinking(true);

    // 1. Check frontend interception for domain queries (Real-time Domain Price Law)
    if (isDomainQuery(lastMessageText)) {
      setTimeout(() => {
        const botResponse: Message = {
          sender: "bot",
          text: "For real-time domain pricing and instant registration, please use our official portal: [Check Domain Pricing](https://portal.carrothost.com/cart.php?a=add&domain=register)",
          timestamp: new Date(),
          actionLink: {
            label: "Check Domain Pricing",
            url: "https://portal.carrothost.com/cart.php?a=add&domain=register",
            external: true,
          },
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsThinking(false);
      }, 400);
      return;
    }

    // 2. Fetch response from OpenAI backend Server Function (Conversational Memory)
    try {
      const history = currentMessages.slice(-10).map((msg) => ({
        role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.text,
      }));

      const data = await chatResponseFn({ data: { messages: history } });

      const botResponse: Message = {
        sender: "bot",
        text: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      console.error("AI Chatbot API failed, falling back to heuristics:", err);
      // Fallback
      const fallback = getAIResponseFallback(lastMessageText);
      const botResponse: Message = {
        sender: "bot",
        text: fallback.text,
        timestamp: new Date(),
        actionLink: fallback.actionLink,
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newUserMessage: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, newUserMessage];
      
      // Schedule response processing
      setTimeout(() => {
        respondToUser(updated, textToSend);
      }, 50);

      return updated;
    });

    setInputText("");
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
        <div className="w-[350px] sm:w-[380px] h-[520px] rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-elegant flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Top Bar Header (Solid corporate accent background) */}
          <div className="bg-brand-orange px-5 py-4 flex items-center justify-between text-white">
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
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
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
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft whitespace-pre-line border border-border/40 ${
                      msg.sender === "user"
                        ? "bg-brand-orange text-white rounded-tr-none border-none"
                        : "bg-card text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "bot" ? renderMessageText(msg.text) : msg.text}
                  </div>
                  {msg.actionLink && (
                    <div className="flex">
                      {msg.actionLink.external ? (
                        <a
                          href={msg.actionLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white text-xs font-bold px-3.5 py-2 transition"
                        >
                          {msg.actionLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <a
                          href={msg.actionLink.url}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white text-xs font-bold px-3.5 py-2 transition"
                        >
                          {msg.actionLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing/Thinking Indicator */}
            {isThinking && (
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
                  className="rounded-full border border-border bg-card hover:border-brand-orange hover:text-brand-orange transition text-[11px] font-semibold px-2.5 py-1 cursor-pointer"
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
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-brand-orange text-white shadow-soft hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none shrink-0 cursor-pointer"
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
