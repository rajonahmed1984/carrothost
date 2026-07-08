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

    // 1. Pricing, Payment Methods, Dam, Koto, Tk (MFS like bKash, Nagad)
    if (
      text.includes("price") ||
      text.includes("dam") ||
      text.includes("koto") ||
      text.includes("tk") ||
      text.includes("taka") ||
      text.includes("payment") ||
      text.includes("bkash") ||
      text.includes("nagad") ||
      text.includes("rocket") ||
      text.includes("টাকা") ||
      text.includes("দাম") ||
      text.includes("বিকাশ") ||
      text.includes("নগদ") ||
      text.includes("রকেট") ||
      text.includes("পেমেন্ট")
    ) {
      return {
        text: "আমরা বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket), স্থানীয় ব্যাংক এবং আন্তর্জাতিক কার্ড পেমেন্ট সাপোর্ট করি!\n\nআমাদের সেবাগুলোর মূল্যসমূহ:\n• ওয়েবুজো শেয়ার্ড হোস্টিং: বার্ষিক ৪,২০০ টাকা থেকে শুরু\n• BDIX ভিপিএস হোস্টিং: মাসিক ১,৫৫০ টাকা থেকে শুরু\n• Xeon ক্লাউড ভিপিএস: মাসিক ৬০৭ টাকা থেকে শুরু\n• .com ডোমেইন রেজিস্ট্রেশন: বার্ষিক ১,১৯০ টাকা",
        actionLink: { label: "ওয়েবসাইট প্ল্যান দেখুন", url: "/" }
      };
    }

    // 2. Google Tag Manager (GTM) tracking
    if (
      text.includes("gtm") ||
      text.includes("tracking") ||
      text.includes("server-side") ||
      text.includes("pixel") ||
      text.includes("কনভার্সন") ||
      text.includes("পিক্সেল") ||
      text.includes("ট্র্যাকিং")
    ) {
      return {
        text: "আমাদের Webuzo শেয়ার্ড হোস্টিং-এ আপনি সম্পূর্ণ Node-free 100% Google Tag Manager (GTM) Server-Side tracking সেটআপ করতে পারবেন। আমরা Nginx-এ সরাসরি ট্র্যাকিং প্রক্সি সেটআপ করেছি, যা আপনার ডাটা লস কমায় এবং ব্রাউজার অ্যাড-ব্লকার বাইপাস করতে সাহায্য করে।",
        actionLink: { label: "সার্ভার-সাইড হোস্টিং দেখুন", url: "/hosting" }
      };
    }

    // 3. BDIX Dhaka Server
    if (
      text.includes("bdix") ||
      text.includes("local") ||
      text.includes("bangladesh") ||
      text.includes("dhaka") ||
      text.includes("ping") ||
      text.includes("ঢাকা") ||
      text.includes("বিডিআইএক্স") ||
      text.includes("লোকাল")
    ) {
      return {
        text: "আমাদের BDIX VPS সার্ভারগুলো ঢাকার ধানমন্ডির প্রিমিয়াম Tier-III ডেটাসেন্টারে কো-লোকেটেড। বাংলাদেশের ভেতরের ভিজিটরদের জন্য এটি sub-10ms ল্যাটেন্সি (Ping) দেয়। লোকাল ই-কমার্স, নিউজ পেপার বা ইনভেন্টরি অ্যাপের জন্য এটি সেরা পছন্দ।",
        actionLink: { label: "BDIX VPS প্ল্যান দেখুন", url: "/bdix-cloud-vps" }
      };
    }

    // 4. Xeon Server
    if (
      text.includes("xeon") ||
      text.includes("intel") ||
      text.includes("webdock") ||
      text.includes("জিয়ন") ||
      text.includes("ইনটেল")
    ) {
      return {
        text: "আমাদের Xeon Cloud VPS-এ ব্যবহার করা হয়েছে হাই-এন্ড Intel Xeon Platinum প্রসেসর। এটি গ্লোবাল ক্লাউড নেটওয়ার্কে হোস্ট করা এবং এর সাথে পাচ্ছেন Webdock-এর রিমোট ড্যাশবোর্ড প্যানেল (গ্রাফিক্যাল রিবুট, রিইন্সটল, ব্যাকআপ ম্যানেজমেন্ট)। এটি যেকোনো ভারী অ্যাপ ডেভেলপমেন্ট বা কম্পাইলেশনের জন্য উপযুক্ত।",
        actionLink: { label: "Xeon VPS প্ল্যান দেখুন", url: "/xeon-cloud-vps" }
      };
    }

    // 5. Shared Hosting & LiteSpeed
    if (
      text.includes("hosting") ||
      text.includes("shared") ||
      text.includes("webuzo") ||
      text.includes("litespeed") ||
      text.includes("হোস্টিং") ||
      text.includes("শেয়ার্ড")
    ) {
      return {
        text: "আমাদের শেয়ার্ড হোস্টিং প্ল্যানে Webuzo কন্ট্রোল প্যানেল দেওয়া হয় যা cPanel-এর চেয়ে হালকা ও দ্রুতগতির। এটি LiteSpeed এন্টারপ্রাইজ ওয়েব সার্ভার এবং সম্পূর্ণ NVMe SSD ড্রাইভ দ্বারা চালিত। ওয়ার্ডপ্রেস বা ই-কমার্স সাইটের স্পিড ৩ গুণ বাড়ানোর জন্য এটি চমৎকার।\n\nপ্ল্যানসমূহ:\n• Starter (10GB): ৪,২০০ টাকা/বছর\n• Standard (25GB): ৮,৪০০ টাকা/বছর\n• Advanced (50GB): ১২,০০০ টাকা/বছর",
        actionLink: { label: "শেয়ার্ড হোস্টিং দেখুন", url: "/hosting" }
      };
    }

    // 6. Domain Registration
    if (
      text.includes("domain") ||
      text.includes("register") ||
      text.includes("search") ||
      text.includes("ডোমেইন") ||
      text.includes("ডোমেন") ||
      text.includes("রেজিস্ট্রেশন")
    ) {
      return {
        text: "CarrotHost থেকে আপনি যেকোনো সময় instant ডোমেইন রেজিস্ট্রেশন করতে পারেন। ডোমেইন সার্চ ও বুকিং সম্পূর্ণ স্বয়ংক্রিয়।\n\nমূল্য তালিকা:\n• .com ডোমেইন: ১,১৯০ টাকা/বছর\n• .net ডোমেইন: ১,৪৫০ টাকা/বছর\n• .com.bd ডোমেইন: ১,৮০০ টাকা/বছর (২ বছরের জন্য ৩,৬০০ টাকা ন্যূনতম রেজিস্ট্রেশন ফী)",
        actionLink: { label: "ডোমেইন রেজিস্ট্রেশন করুন", url: "https://portal.carrothost.com/cart.php?a=add&domain=register", external: true }
      };
    }

    // 7. Migration / Transfer
    if (
      text.includes("migrate") ||
      text.includes("migration") ||
      text.includes("transfer") ||
      text.includes("নিয়ে আস") ||
      text.includes("ট্রান্সফার") ||
      text.includes("মাইগ্রেশন") ||
      text.includes("মুভ")
    ) {
      return {
        text: "আমরা সম্পূর্ণ ফ্রিতে আপনার বর্তমান হোস্টিং (cPanel/Webuzo/Plesk) থেকে সাইট CarrotHost-এ মাইগ্রেশন বা ট্রান্সফার করে দেব। আপনার ওয়েবসাইটের কোনো ডাউনটাইম (Downtime) ছাড়াই আমাদের ইঞ্জিনিয়াররা পুরো কাজ নিরাপদে সম্পন্ন করবেন।",
        actionLink: { label: "হোয়াটসঅ্যাপে আমাদের জানান", url: "https://wa.me/8801787882277", external: true }
      };
    }

    // 8. Contact & Hotline (Bangla support)
    if (
      text.includes("support") ||
      text.includes("phone") ||
      text.includes("contact") ||
      text.includes("whatsapp") ||
      text.includes("number") ||
      text.includes("call") ||
      text.includes("hotline") ||
      text.includes("helpline") ||
      text.includes("যোগাযোগ") ||
      text.includes("হেল্পলাইন") ||
      text.includes("নাম্বার") ||
      text.includes("ফোন") ||
      text.includes("কল") ||
      text.includes("হেল্প")
    ) {
      return {
        text: "আমাদের ২৪/৭ বাংলা ও ইংরেজি কাস্টমার সাপোর্ট টিম সর্বদা প্রস্তুত! যেকোনো প্রয়োজনে কল করুন অথবা হোয়াটসঅ্যাপ মেসেজ করুন:\n\n• হেল্পলাইন নম্বর: 01787-882277\n• ইমেইল: support@carrothost.com",
        actionLink: { label: "সরাসরি কল করুন", url: "tel:01787882277", external: true }
      };
    }

    // 9. VPS Comparison
    if (text.includes("vps") || text.includes("ভিপিএস")) {
      return {
        text: "আমাদের ভিপিএস সার্ভার দুটি ক্যাটাগরির:\n১. BDIX VPS: বাংলাদেশ (ঢাকা) ডেটাসেন্টার, লোকাল স্পিডের জন্য বেস্ট।\n২. Xeon Cloud VPS: গ্লোবাল হাই-পারফরম্যান্স সার্ভার (Intel Xeon Platinum প্রসেসর), ডেভেলপমেন্ট ও টেস্ট সার্ভারের জন্য সেরা।",
        actionLink: { label: "BDIX VPS কম্পেয়ার করুন", url: "/bdix-cloud-vps" }
      };
    }

    return {
      text: "আমি আপনাকে CarrotHost-এর হোস্টিং প্যাক, ডোমেন প্রাইস, GTM ট্র্যাকিং প্রক্সি, অথবা BDIX/Xeon VPS সার্ভার কম্পেয়ার করতে সাহায্য করতে পারি। আপনি কি জানতে চান তা একটু বিস্তারিত বলুন, অথবা আমাদের সাপোর্টে সরাসরি যোগাযোগ করুন।",
      actionLink: { label: "হোয়াটসঅ্যাপে কথা বলুন 💬", url: "https://wa.me/8801787882277", external: true }
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
